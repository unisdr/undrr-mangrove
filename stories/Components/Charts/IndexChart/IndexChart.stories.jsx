import IndexChart from "./IndexChart";

export default {
  title: "Components/Charts/IndexChart",
  component: IndexChart,
};

export const DefaultIndexChart = {
  render: () => (
    <IndexChart
      data={[
        {
          date: new Date("2024-01-01"),
          value: 10,
        },
        {
          date: new Date("2024-02-01"),
          value: 15,
        },
        {
          date: new Date("2024-03-01"),
          value: 20,
        },
        {
          date: new Date("2024-04-01"),
          value: 25,
        },
        {
          date: new Date("2024-05-01"),
          value: 30,
        },
        {
          date: new Date("2024-06-01"),
          value: 35,
        },
      ]}
      width={1000}
      height={600}
      lineColor="#4065A3"
      labelColor="#6B7280"
      axisColor="#9CA3AF"
      tickColor="#D1D5DB"
      title="Sample Index Chart"
      xAxisLabel="Date"
      yAxisLabel="Value"
      ariaLabel="Index chart showing data over time"
      ariaDescription="This chart displays an index chart that shows data values over time."
    />
  ),

  name: "Default IndexChart",
};

export const CustomRtlIndexChart = {
  render: () => (
    <IndexChart
      data={[
        {
          date: new Date("2024-01-01"),
          value: 10,
        },
        {
          date: new Date("2024-02-01"),
          value: 15,
        },
        {
          date: new Date("2024-03-01"),
          value: 20,
        },
        {
          date: new Date("2024-04-01"),
          value: 25,
        },
        {
          date: new Date("2024-05-01"),
          value: 30,
        },
        {
          date: new Date("2024-06-01"),
          value: 35,
        },
      ]}
      width={1000}
      height={600}
      lineColor="#4065A3"
      labelColor="#6B7280"
      axisColor="#9CA3AF"
      tickColor="#D1D5DB"
      title="مخطط المؤشر"
      xAxisLabel="التاريخ"
      yAxisLabel="القيمة"
      locale="ar"
      direction="rtl"
      ariaLabel="مخطط المؤشر الذي يظهر البيانات على مدى الزمن"
    />
  ),

  name: "Custom RTL IndexChart",
};

export const CustomIndexChart = {
  render: () => (
    <IndexChart
      data={[
        {
          date: new Date("2024-01-01"),
          value: 5,
        },
        {
          date: new Date("2024-02-01"),
          value: 15,
        },
        {
          date: new Date("2024-03-01"),
          value: 25,
        },
        {
          date: new Date("2024-04-01"),
          value: 35,
        },
        {
          date: new Date("2024-05-01"),
          value: 45,
        },
        {
          date: new Date("2024-06-01"),
          value: 55,
        },
      ]}
      width={1000}
      height={600}
      lineColor="#007bc8"
      labelColor="#6B7280"
      axisColor="#9CA3AF"
      tickColor="#D1D5DB"
      title="Custom Index Chart"
      xAxisLabel="Custom Date"
      yAxisLabel="Custom Value"
      ariaLabel="Index chart showing custom data over time"
      ariaDescription="This chart displays an index chart with custom data values over time."
    />
  ),

  name: "Custom IndexChart",
};
