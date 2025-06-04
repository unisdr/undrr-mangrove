import Fetcher from "./Fetcher";

export default {
  title: "Components/Fetcher",
  component: Fetcher,
  tags: ["autodocs"],

  argTypes: {
    api: {
      control: "text",
    },

    searchTerm: {
      control: "text",
    },

    loadingLabel: {
      control: "text",
    },
  },
};

export const Default = {
  render: () => {
    const renderData = ({ isLoading, data }) => (
      <div>
        {isLoading && <p>Loading data...</p>}
        <pre>{JSON.stringify(data, null, 4)}</pre>
      </div>
    );

    return (
      <Fetcher
        api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics"
        queryParams={{
          items_per_page: 1000,
        }}
        render={renderData}
        loadingLabel="Loading data"
      />
    );
  },
};

export const WithSearchTerm = {
  render: () => {
    const renderData = ({ isLoading, data }) => (
      <div>
        {isLoading && <p>Searching...</p>}
        <pre>{JSON.stringify(data, null, 4)}</pre>
      </div>
    );

    return (
      <Fetcher
        api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics"
        queryParams={{
          items_per_page: 1000,
        }}
        render={renderData}
        loadingLabel="Searching"
      />
    );
  },
};

export const WithoutQueryParams = {
  render: () => {
    const renderData = ({ isLoading, data }) => (
      <div>
        {isLoading && <p>Loading data...</p>}
        <pre>{JSON.stringify(data, null, 4)}</pre>
      </div>
    );

    return (
      <Fetcher
        api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics"
        render={renderData}
        loadingLabel="Loading data"
      />
    );
  },
};
