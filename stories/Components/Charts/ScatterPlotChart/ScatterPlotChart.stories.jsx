import ConnectedScatterplot from "./ConnectedScatterplot";

export default {
  title: "Components/Charts/ConnectedScatterplot",
  component: ConnectedScatterplot,
};

export const DefaultConnectedScatterplot = {
  render: () => (
    <ConnectedScatterplot
      data={[
        {
          x: 10,
          y: 20,
        },
        {
          x: 20,
          y: 40,
        },
        {
          x: 30,
          y: 25,
        },
        {
          x: 40,
          y: 50,
        },
        {
          x: 50,
          y: 30,
        },
        {
          x: 60,
          y: 80,
        },
        {
          x: 70,
          y: 65,
        },
      ]}
      width={1000}
      height={600}
      lineColor="#4065A3"
      pointColor="#FFA500"
      labelColor="#6B7280"
      axisColor="#9CA3AF"
      tickColor="#D1D5DB"
      title="Sample Connected Scatterplot"
      ariaLabel="Connected scatterplot showing the relationship between x and y values"
      ariaDescription="This chart displays a connected scatterplot that shows the relationship between x and y values with lines connecting the points."
    />
  ),

  name: "Default ConnectedScatterplot",
};

export const CustomRtlConnectedScatterplot = {
  render: () => (
    <ConnectedScatterplot
      data={[
        {
          x: 10,
          y: 20,
        },
        {
          x: 20,
          y: 40,
        },
        {
          x: 30,
          y: 25,
        },
        {
          x: 40,
          y: 50,
        },
        {
          x: 50,
          y: 30,
        },
        {
          x: 60,
          y: 80,
        },
        {
          x: 70,
          y: 65,
        },
      ]}
      width={1000}
      height={600}
      lineColor="#4065A3"
      pointColor="#FFA500"
      labelColor="#6B7280"
      axisColor="#9CA3AF"
      tickColor="#D1D5DB"
      title="مخطط الانتثار المتصل"
      locale="ar"
      direction="rtl"
      ariaLabel="مخطط الانتثار المتصل الذي يظهر العلاقة بين القيم x و y"
    />
  ),

  name: "Custom RTL ConnectedScatterplot",
};

export const CustomConnectedScatterplot = {
  render: () => (
    <ConnectedScatterplot
      data={[
        {
          x: 5,
          y: 15,
        },
        {
          x: 15,
          y: 35,
        },
        {
          x: 25,
          y: 50,
        },
        {
          x: 35,
          y: 45,
        },
        {
          x: 45,
          y: 55,
        },
        {
          x: 55,
          y: 60,
        },
      ]}
      width={1000}
      height={600}
      lineColor="#007bc8"
      pointColor="#ff6e52"
      labelColor="#6B7280"
      axisColor="#9CA3AF"
      tickColor="#D1D5DB"
      title="Custom Connected Scatterplot"
      ariaLabel="Connected scatterplot showing custom data"
      ariaDescription="This chart displays a connected scatterplot with custom x and y values."
    />
  ),

  name: "Custom ConnectedScatterplot",
};
