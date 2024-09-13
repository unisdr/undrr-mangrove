import BarChartProcessor from "./BarChart";

export default {
  title: "Components/Charts/BarChart",
  component: BarChartProcessor,
  argTypes: {
    data: {
      control: { type: "array" },
      description: "Data to be displayed in the bar chart",
    },
    width: {
      control: { type: "number" },
      description: "Width of the bar chart in pixels",
      defaultValue: 600,
    },
    height: {
      control: { type: "number" },
      description: "Height of the bar chart in pixels",
      defaultValue: 400,
    },
    labelColor: {
      control: { type: "color" },
      description: "Color of the labels",
      defaultValue: "#6B7280",
    },
    backgroundColor: {
      control: { type: "color" },
      description: "Background color of the chart",
      defaultValue: "#FFFFFF",
    },
    title: {
      control: { type: "text" },
      description: "Title of the bar chart",
      defaultValue: "Bar Chart",
    },
    color: {
      control: { type: "color" },
      description: "Default color of the bars",
      defaultValue: "#4065A3",
    },
    axisColor: {
      control: { type: "color" },
      description: "Default color for the axis lines",
      defaultValue: "#6B7280",
    },
    tickColor: {
      control: { type: "color" },
      description: "Default color for the tick marks",
      defaultValue: "#6B7280",
    },
    xAxisLabel: {
      control: { type: "text" },
      description: "The label for the x-axis",
      defaultValue: "X-Axis",
    },
    yAxisLabel: {
      control: { type: "text" },
      description: "The label for the y-axis",
      defaultValue: "Y-Axis",
    },
    dataSource: {
      control: { type: "text" },
      description: "The label for the data source",
      defaultValue: "UNDRR",
    },
    type: {
      control: { type: "select" },
      options: ["COMMITMENTS", "ORGANIZATIONS", "DELIVERABLES"],
      description:
        "The type of data to display. Options are either COMMITMENTS or ORGANIZATIONS.",
      defaultValue: "COMMITMENTS",
    },
    ariaLabel: {
      control: { type: "text" },
      description: "ARIA label for accessibility",
      defaultValue: "Bar chart showing data",
    },
    ariaDescription: {
      control: { type: "text" },
      description: "ARIA description for accessibility",
      defaultValue: "ARIA description for accessibility",
    },
    apiData: {
      control: { type: "boolean" },
      description: "If data is coming from an API (Drupal) it will be refined.",
      defaultValue: false,
    },
  },
};

// We don't do the fetching as part of this story, as that is subjective to the use environment
// const Template = (args) => (
//   <Fetcher
//     api="https://sfvc-migration.undrr.org/api/v2/content/commitments-metrics?items_per_page=1000"
//     render={({ isLoading, data }) => (
//       <>{isLoading ? <Loader /> : <BarChartProcessor {...args} data={data} />}</>
//     )}
//   />
// );

export const Default = {
  args: {
    data: [
      {
        color: "#4065A3",
        label: "2029",
        value: 5,
      },
      {
        color: "#4065A3",
        label: "2021",
        value: 3,
      },
    ],
    width: 600,
    height: 400,
    labelColor: "#6B7280",
    backgroundColor: "#FFFFFF",
    title: "Barchart default example",
    color: "#4065A3",
    xAxisLabel: "X-Axis",
    yAxisLabel: "Y-Axis",
    dataSource: "UNDRR",
    type: "COMMITMENTS",
    apiData: false,
  },
};

export const Organizations = {
  args: {
    data: [
      {
        color: "#4065A3",
        label: "2029",
        value: 10,
      },
      {
        color: "#4065A3",
        label: "2021",
        value: 12,
      },
    ],
    width: 1000,
    height: 400,
    labelColor: "#6B7280",
    backgroundColor: "#FFFFFF",
    title: "Organizations Bar Chart",
    color: "#4065A3",
    xAxisLabel: "Years",
    yAxisLabel: "Number of Organizations",
    dataSource: "UNDRR",
    type: "ORGANIZATIONS",
    apiData: false,
  },
};

export const Deliverables = {
  args: {
    data: [
      {
        color: "#4065A3",
        label: "2029",
        value: 10,
      },
      {
        color: "#4065A3",
        label: "2021",
        value: 12,
      },
    ],
    width: 600,
    height: 400,
    labelColor: "#6B7280",
    backgroundColor: "#FFFFFF",
    title: "Deliverables Bar Chart",
    color: "#4065A3",
    xAxisLabel: "Years",
    yAxisLabel: "Number of Deliverables",
    dataSource: "UNDRR",
    type: "DELIVERABLES",
    apiData: false,
  },
};
