import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import * as esri from "esri-leaflet";
import "./map.scss";

// Fix leaflet's default icon issues with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapComponent = ({ data, center = [20, 0], zoom = 2 }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const createLabelIcon = (label, value) => {
    return L.divIcon({
      className: "mg-custom-label-icon",
      html: `<div class="mg-label-container"><div class="mg-label-text">${label}</div><div class="mg-label-value">${value}</div></div>`,
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
      {data.map((entry, index) => (
        <Marker
          key={index}
          position={entry.coords}
          icon={createLabelIcon(entry.label, entry.value)}
          eventHandlers={{
            click: () => {
              setSelectedEntry(entry);
            },
          }}
        >
          {selectedEntry && selectedEntry.label === entry.label && (
            <Popup
              position={entry.coords}
              onClose={() => setSelectedEntry(null)}
            >
              <div>
                <strong>{entry.label}</strong>
                <br />
                {entry.value} commitments
                <br />
                <p>{entry.description}</p>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
