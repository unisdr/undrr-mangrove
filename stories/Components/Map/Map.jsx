import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/dist/styles.min.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import DOMPurify from "dompurify"; // Import DOMPurify
import styles from "./map.module.scss";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function Map({ data, center = [20, 0], zoom = 2 }) {
  const maxValue = Math.max(...data.map((entry) => entry.value));

  const calculateIconSize = (value) => {
    const minSize = 38;
    const maxSize = 100;
    return minSize + (value / maxValue) * (maxSize - minSize);
  };

  const createLabelIcon = (label, value) => {
    const size = calculateIconSize(value);
    return L.divIcon({
      className: styles["mg-custom-label-icon"],
      html: `<div class="${styles["mg-label-container"]}"><div class="${styles["mg-label-text"]}">${label}</div><div class="${styles["mg-label-value"]}">${value}</div></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.arcgis.com/home/item.html?id=7d88506b6af64b02ba3c08dbf66d014b">ArcGIS</a> contributors'
        url="https://geoservices.un.org/arcgis/rest/services/ClearMap_WebTopo/MapServer/tile/{z}/{y}/{x}"
      />
      <MarkerClusterGroup>
        {data.map((entry, index) => (
          <Marker
            key={index}
            position={entry.coords}
            icon={createLabelIcon(entry.label, entry.value)}
          >
            <Popup>
              <div
                style={{ padding: "5px", lineHeight: "1.6em" }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(entry.description),
                }}
              />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
