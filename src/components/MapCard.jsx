import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { decode } from '@googlemaps/polyline-codec';

// Standard routing markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Event Markers
const fuelIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const breakIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Spatial Math 
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 3959.87433; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function MapCard({ geometry, waypoints, totalDistance, stops = [] }) {
  if (!geometry || !waypoints) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🗺️ Route Map</h2>
          <div className="h-96 bg-gray-200 rounded flex items-center justify-center">Map data unavailable</div>
        </div>
      </div>
    );
  }

  const positions = useMemo(() => decode(geometry, 5).map(([lat, lng]) => [lat, lng]), [geometry]);
  
  // High-level interpolation transformation
  // High-level interpolation transformation with Scale Correction
  const eventMarkers = useMemo(() => {
    const markers = [];
    if (!stops || stops.length === 0 || positions.length < 2) return markers;

    // 1. Calculate the map's total Haversine distance
    let totalHaversineDist = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      totalHaversineDist += haversine(
        positions[i][0], positions[i][1], 
        positions[i+1][0], positions[i+1][1]
      );
    }

    // 2. Create a scaling factor (Map Distance vs Backend Distance)
    const scaleFactor = totalDistance > 0 ? (totalHaversineDist / totalDistance) : 1;

    let currentDist = 0;
    let stopIdx = 0;

    // 3. Walk the path and drop pins using the scaled targets
    for (let i = 0; i < positions.length - 1; i++) {
      if (stopIdx >= stops.length) break;
      const p1 = positions[i];
      const p2 = positions[i + 1];
      const segDist = haversine(p1[0], p1[1], p2[0], p2[1]);

      let scaledTarget = stops[stopIdx].distance * scaleFactor;

      while (stopIdx < stops.length && currentDist + segDist >= scaledTarget) {
        const ratio = segDist > 0 ? (scaledTarget - currentDist) / segDist : 0;
        
        // Ensure we don't overshoot the segment bounds (floating point safety)
        const safeRatio = Math.max(0, Math.min(1, ratio));
        
        const lat = p1[0] + (p2[0] - p1[0]) * safeRatio;
        const lng = p1[1] + (p2[1] - p1[1]) * safeRatio;
        
        // Prevent duplicate pins stacking perfectly on top of each other
        const isDuplicate = markers.some(m => Math.abs(m.lat - lat) < 0.0001 && Math.abs(m.lng - lng) < 0.0001);
        
        if (!isDuplicate) {
          markers.push({ lat, lng, type: stops[stopIdx].type });
        }
        
        stopIdx++;
        if (stopIdx < stops.length) {
          scaledTarget = stops[stopIdx].distance * scaleFactor;
        }
      }
      currentDist += segDist;
    }
    return markers;
  }, [positions, stops, totalDistance]);

  const center = waypoints[0];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title text-2xl">🗺️ Route Map</h2>
          <div className="badge badge-info badge-lg">Total: {Math.round(totalDistance)} miles</div>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-gray-500 mb-2">
          <span>🔵 Optimal Route</span>
          <span>📍 Dispatch Terminals</span>
          <span className="text-orange-500">🟠 Fuel Stops</span>
          <span className="text-violet-500">🟣 HOS Rest Breaks</span>
        </div>
        <MapContainer center={center} zoom={5} style={{ height: '450px', width: '100%' }} className="rounded-lg z-0">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={positions} color="#2563eb" weight={5} opacity={0.8} />
          
          {waypoints.map((wp, idx) => (
            <Marker key={`wp-${idx}`} position={wp}>
              <Popup>{idx === 0 ? '📍 Current Location' : idx === 1 ? '📦 Pickup Terminal' : '🏁 Dropoff Terminal'}</Popup>
            </Marker>
          ))}

          {eventMarkers.map((marker, idx) => (
            <Marker key={`event-${idx}`} position={[marker.lat, marker.lng]} icon={marker.type === 'fuel' ? fuelIcon : breakIcon}>
              <Popup>{marker.type === 'fuel' ? '⛽ Mandatory Fuel Stop' : '🛌 30-Min HOS Rest Break'}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}