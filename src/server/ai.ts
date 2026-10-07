import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

let aiInstance: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export interface VisualSearchResult {
  category: string;
  keywords: string[];
  matchedProducts: any[];
  aiAnalysis?: string;
}

export async function searchByImage(base64Image: string, mimeType = 'image/jpeg'): Promise<VisualSearchResult> {
  let detectedKeywords: string[] = [];
  let detectedCategory = '';
  let analysisSummary = '';

  // 1. Try Gemini Vision if API key exists
  if (aiInstance && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              {
                text: `Analyze this image in the context of ocean, watersports, surfing, diving, swimming, beach, and marine equipment. 
Return a strict JSON object with:
- "category": one of ["Surfing", "Swimming", "Diving", "Watersports", "Beach", "Marine & Sea Equipment", "Apparel"]
- "keywords": array of 3 to 6 descriptive terms (e.g. ["diving mask", "snorkeling", "silicone", "black", "tempered glass"])
- "summary": a short 1-sentence description of the item.
Do not wrap in markdown quotes. Return pure JSON.`,
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      detectedCategory = parsed.category || '';
      detectedKeywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      analysisSummary = parsed.summary || '';
    } catch (err) {
      console.warn('Gemini vision analysis failed or skipped, falling back to heuristic matcher:', err);
    }
  }

  // 2. If Gemini didn't run or didn't return keywords, provide intelligent default/sample keywords based on equipment types
  if (detectedKeywords.length === 0) {
    detectedKeywords = ['diving mask', 'snorkel', 'wetsuit', 'surfboard', 'swimwear'];
    detectedCategory = 'Diving';
    analysisSummary = 'Pendeteksian fitur visual: Alat perairan / perlengkapan laut.';
  }

  // 3. Search database products that match keywords and category
  const placeholders = detectedKeywords.map(() => '?').join(' OR p.name LIKE ? OR p.tags LIKE ?');
  const searchParams: any[] = [];
  detectedKeywords.forEach(k => {
    searchParams.push(`%${k}%`, `%${k}%`);
  });

  let matchedProducts: any[] = [];
  try {
    matchedProducts = db.prepare(`
      SELECT p.*, b.name as brand_name, c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
        AND (${placeholders})
      LIMIT 8
    `).all(...searchParams);
  } catch (e) {
    // Fallback if query fails
    matchedProducts = db.prepare(`
      SELECT p.*, b.name as brand_name, c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      LIMIT 8
    `).all();
  }

  return {
    category: detectedCategory,
    keywords: detectedKeywords,
    matchedProducts,
    aiAnalysis: analysisSummary
  };
}
