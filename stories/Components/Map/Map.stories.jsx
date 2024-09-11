import MapComponent, { transformData } from "./MapComponent";
import Fetcher from "../Fetcher/Fetcher";

export default {
  title: "Components/Maps/MapComponent",
  component: MapComponent,
};

export const MapComponentWithFetcher = {
  render: () => (
    <Fetcher
      api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics"
      queryParams={{
        items_per_page: 1000,
      }}
      render={({ isLoading, data }) => (
        <>
          {isLoading ? (
            <span>Loading map.</span>
          ) : (
            <MapComponent
              data={transformData(data)}
              width={1000}
              center={[20, 30]}
            />
          )}
        </>
      )}
    />
  ),

  name: "MapComponent with Fetcher",
};
