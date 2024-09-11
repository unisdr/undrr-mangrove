import BarChart from "./BarChart";
import Fetcher from "../../Fetcher/Fetcher";

export default {
  title: "Components/Charts/BarChart",
  component: BarChart,
};

export const BarChartWithFetcher = {
  render: () => (
    <Fetcher
      api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics"
      queryParams={{
        items_per_page: 1000,
      }}
      render={({ isLoading, data }) => (
        <>
          {isLoading ? (
            <span>Loading data.</span>
          ) : (
            <BarChart
              data={data}
              width={1000}
              height={300}
              margin={{
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              labelColor="#9CA3AF"
              axisColor="#9CA3AF"
              tickColor="none"
              title=""
              type="COMMITMENTS"
              xAxisLabel=""
              yAxisLabel=""
              dataSource=""
              ariaLabel="Bar chart showing the number of commitments by year"
              ariaDescription="This chart displays the number of commitments made each year based on fetched API data."
            />
          )}
        </>
      )}
    />
  ),

  name: "BarChart with Fetcher",
};

export const BarChartForOrganisations = {
  render: () => (
    <Fetcher
      api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics"
      queryParams={{
        items_per_page: 1000,
      }}
      render={({ isLoading, data }) => (
        <>
          {isLoading ? (
            <span>Loading data.</span>
          ) : (
            <BarChart
              data={data}
              width={1000}
              height={300}
              labelColor="#9CA3AF"
              axisColor="#9CA3AF"
              tickColor="#9FAAAE"
              title="Orgnisations by year"
              type="ORGANISATIONS"
              xAxisLabel="Year"
              yAxisLabel="Number of organizations"
              dataSource="Data from fetched API"
              ariaLabel="Bar chart showing the number of commiting organisations by year"
              ariaDescription="This chart displays the number of commiting organisations based on fetched API data."
            />
          )}
        </>
      )}
    />
  ),

  name: "BarChart for Organisations",
};

export const BarChartForDeliverables = {
  render: () => (
    <Fetcher
      api="https://sfvc-migration.undrr.org/api/v2/content/commitment-deliverables-metrics"
      queryParams={{
        items_per_page: 1000,
      }}
      render={({ isLoading, data }) => (
        <>
          {isLoading ? (
            <span>Loading data.</span>
          ) : (
            <BarChart
              data={data}
              width={1000}
              height={300}
              labelColor="#9CA3AF"
              axisColor="#9CA3AF"
              tickColor="#9FAAAE"
              title="Deliverables by year"
              type="DELIVERABLES"
              xAxisLabel="Year"
              yAxisLabel="Number of deliverables"
              dataSource="Data from fetched API"
              ariaLabel="Bar chart showing the number of deliverables by year"
              ariaDescription="This chart displays the number of deliverables based on fetched API data."
            />
          )}
        </>
      )}
    />
  ),

  name: "BarChart for Deliverables",
};
