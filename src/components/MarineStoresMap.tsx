import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface StoreLocation {
  id: string;
  name: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  services: string[];
}

interface MarineStoresMapProps {
  stores: StoreLocation[];
  selectedStoreId?: string;
  onSelectStore?: (store: StoreLocation) => void;
  shipmentTracker?: {
    orderNumber: string;
    originCity: string;
    destCity: string;
    currentLocation: string;
    status: string;
    originCoords: [number, number];
    destCoords: [number, number];
    currentCoords: [number, number];
  };
}

export function MarineStoresMap({ stores, selectedStoreId, onSelectStore, shipmentTracker }: MarineStoresMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on Indonesia archipelago
    const initialLat = shipmentTracker ? shipmentTracker.currentCoords[0] : -8.5;
    const initialLng = shipmentTracker ? shipmentTracker.currentCoords[1] : 115.2;
    const initialZoom = shipmentTracker ? 8 : 7;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], initialZoom);
    mapInstanceRef.current = map;

    // Clean TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SKYRA Marine Logistics',
      maxZoom: 18,
    }).addTo(map);

    // Custom Icons
    const storeIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div style="background-color: #0891b2; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; font-size: 14px; font-weight: bold;">
          ⚓
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const activeStoreIcon = L.divIcon({
      className: 'custom-pin-active',
      html: `
        <div style="background-color: #f59e0b; color: #020617; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 10px rgba(0,0,0,0.4); border: 3px solid white; font-size: 16px; font-weight: bold;">
          ⭐
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const truckIcon = L.divIcon({
      className: 'custom-pin-truck',
      html: `
        <div style="background-color: #10b981; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 2px solid white; font-size: 16px;">
          🚚
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Add Store Markers
    stores.forEach((store) => {
      const isSelected = selectedStoreId === store.id;
      const marker = L.marker([store.lat, store.lng], {
        icon: isSelected ? activeStoreIcon : storeIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; line-height: 1.4;">
          <strong style="font-size: 13px; color: #0891b2; display: block; margin-bottom: 2px;">${store.name}</strong>
          <span style="display: inline-block; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-bottom: 4px;">${store.type}</span>
          <p style="margin: 4px 0;">${store.address}</p>
          <p style="margin: 4px 0; color: #64748b;"><strong>Jam:</strong> ${store.hours}</p>
          <p style="margin: 4px 0; color: #64748b;"><strong>Telp:</strong> ${store.phone}</p>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectStore) onSelectStore(store);
      });
    });

    // If shipment tracker is active, draw shipping route line and courier position
    if (shipmentTracker) {
      // Polyline between origin and destination
      const routeLine = L.polyline([
        shipmentTracker.originCoords,
        shipmentTracker.currentCoords,
        shipmentTracker.destCoords,
      ], {
        color: '#0891b2',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8,
      }).addTo(map);

      // Courier live marker
      const courierMarker = L.marker(shipmentTracker.currentCoords, { icon: truckIcon }).addTo(map);
      courierMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color: #059669;">🚚 Posisi Paket Anda Sekarang</strong>
          <p style="margin: 2px 0;">Pesanan: <strong>#${shipmentTracker.orderNumber}</strong></p>
          <p style="margin: 2px 0; color: #64748b;">Lokasi: ${shipmentTracker.currentLocation}</p>
          <p style="margin: 2px 0; color: #0284c7; font-weight: bold;">Status: ${shipmentTracker.status}</p>
        </div>
      `).openPopup();

      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [stores, selectedStoreId, shipmentTracker]);

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
