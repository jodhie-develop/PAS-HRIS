"use client";

import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const deviceIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#2A558C" fill-opacity="0.25"/><circle cx="12" cy="12" r="5" fill="#2A558C" stroke="white" stroke-width="2"/></svg>`
    ),
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

export type DevicePosition = { lat: number; lng: number; accuracy: number };

export function AbsensiMap({ devicePosition }: { devicePosition: DevicePosition }) {
  const position: [number, number] = [devicePosition.lat, devicePosition.lng];

  return (
    <MapContainer
      center={position}
      zoom={17}
      scrollWheelZoom={false}
      style={{ height: "220px", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={deviceIcon}>
        <Popup>Lokasi Anda saat Check In/Out</Popup>
      </Marker>
      <Circle
        center={position}
        radius={devicePosition.accuracy}
        pathOptions={{ color: "#2A558C", fillColor: "#2A558C", fillOpacity: 0.12 }}
      />
    </MapContainer>
  );
}
