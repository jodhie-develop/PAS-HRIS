"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const officeIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#B3050A"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`
    ),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// MapContainer only reads `center` on mount; follow the pin when the
// coordinates are edited (typed in or filled from GPS).
function FollowPin({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [map, latitude, longitude]);
  return null;
}

export function OfficeMap({
  latitude,
  longitude,
  radiusMeters,
  name,
}: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  name: string;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={17}
      scrollWheelZoom={false}
      style={{ height: "180px", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={officeIcon}>
        <Popup>{name}</Popup>
      </Marker>
      <Circle
        center={[latitude, longitude]}
        radius={radiusMeters}
        pathOptions={{ color: "#B3050A", fillColor: "#B3050A", fillOpacity: 0.1 }}
      />
      <FollowPin latitude={latitude} longitude={longitude} />
    </MapContainer>
  );
}
