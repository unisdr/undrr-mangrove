import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/dist/styles.min.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import DOMPurify from "dompurify";
import "./map.css";
import { transformDataForMap } from "./map-helpers";

export const transformData = (results) => {
  return transformDataForMap(results);
};

// Configure default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to remove attribution prefix, this removes the flag
function RemoveAttributionPrefix() {
  const map = useMap();
  map.attributionControl.setPrefix("");
  return null;
}

export default function MapComponent({
  data,
  center = [20, 0],
  zoom = 2,
  maxZoom = 5,
  minZoom = 2,
}) {
  const maxValue = Math.max(...data.map((entry) => entry.value));
  const commitmentLink = "/commitments?term_node_tid_depth";
  const globalLink = "/commitments?field_geographic_scope_value=GLOBAL";

  const calculateIconSize = (value) => {
    const minSize = 38;
    const maxSize = 100;
    return minSize + (value / maxValue) * (maxSize - minSize);
  };

  const createLabelIcon = (label, value) => {
    const size = calculateIconSize(value);
    // We only show "Global" as a label, as otherwsie this marker is shown over a country
    const isGlobal = label.toLowerCase() === "global";

    return L.divIcon({
      className: "mg-custom-label-icon",
      html: `
        <div class="mg-label-container">
          ${isGlobal ? `<div class="mg-label-text">${label}</div>` : ""}
          <div class="mg-label-value">${value}</div>
        </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const handleMarkerClick = (countryId) => {
    console.log("markerClicked", countryId);

    if (countryId === "ALL") {
      window.open(`${globalLink}`, "_blank");
    } else {
      window.open(`${commitmentLink}=${countryId}`, "_blank");
    }
  };

  const continents = {
    Global: "Global",
    Africa: "Africa",
    Europe: "Europe",
    Asia: "Asia",
    Americas: "Americas",
    "North America": "North America",
    "South America": "South America",
    Oceania: "Oceania",
    Antarctica: "Antarctica",
  };
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      maxZoom={maxZoom}
      minZoom={minZoom}
      style={{ height: "500px", width: "100%" }}
    >
      <RemoveAttributionPrefix />
      <TileLayer
        attribution='Base map produced by <a href="https://www.un.org/geospatial/">United Nations Geospatial</a> | <a href="https://leafletjs.com/">Leaflet</a> | Powered by <a href="https://www.esri.com/">Esri</a>'
        url="https://geoservices.un.org/arcgis/rest/services/ClearMap_WebTopo/MapServer/tile/{z}/{y}/{x}"
      />

      {/* Loop through continents and render MarkerClusterGroup for each */}
      {Object.entries(continents).map(([continentCode, continentName]) => {
        // Filter the data for the current continent
        const filteredData = data.filter(function (entry) {
          return entry.continent === continentCode;
        });

        // Calculate the sum of entry.value for the current continent
        const totalValue = filteredData.reduce(
          (sum, entry) => sum + entry.value,
          0,
        );

        const createClusterCustomIcon = function (cluster) {
          return L.divIcon({
            className: "mg-custom-label-icon",
            html: `
            <div class="mg-label-container">
              <div class="mg-label-text">${continentName}</div>
              <div class="mg-label-value">${totalValue}</div>
            </div>`,
            iconSize: L.point(80, 80, true),
          });
        };

        return (
          <MarkerClusterGroup
            iconCreateFunction={createClusterCustomIcon}
            key={continentCode} // Key prop for React rendering, not inside function
            disableClusteringAtZoom="3"
            zoomToBoundsOnClick={true}
            spiderfyOnMaxZoom={false}
            showCoverageOnHover={false}
            maxClusterRadius="300"
          >
            {filteredData.map((entry, index) => (
              <Marker
                key={`${continentCode}-${index}`} // Correct use of key here
                position={entry.coords}
                icon={createLabelIcon(entry.label, entry.value)}
              >
                <Popup>
                  <div
                    style={{
                      padding: "5px",
                      lineHeight: "1.6em",
                      fontSize: "2em",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(entry.label),
                    }}
                  />
                  {entry.country_id && (
                    <a
                      style={{
                        fontSize: "2em",
                        paddingLeft: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleMarkerClick(entry.country_id)}
                    >
                      More Info
                    </a>
                  )}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        );
      })}
    </MapContainer>
  );
}
