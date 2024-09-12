import Histogram from "./Histogram";

export default {
  title: "Components/Charts/Histogram",
  component: Histogram,
};

export const DefaultHistogram = {
  render: () => (
    <Histogram
      dataSeries={[
        {
          seriesLabel: "Sample Data",
          data: [10, 20, 20, 30, 30, 30, 40, 50, 60, 70, 80, 90, 100, 100, 110],
          color: "#69b3a2",
        },
      ]}
      width={500}
      height={300}
      title="Default Histogram"
    />
  ),

  name: "Default Histogram",
};

export const MultipleSeriesHistogram = {
  render: () => (
    <Histogram
      dataSeries={[
        {
          seriesLabel: "Dataset 1",
          data: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125],
          color: "#69b3a2",
        },
        {
          seriesLabel: "Dataset 2",
          data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130],
          color: "#ff6347",
        },
      ]}
      width={600}
      height={400}
      bins={10}
      title="Multiple Series Histogram"
    />
  ),

  name: "Multiple Series Histogram",
};

export const MirroredHistogram = {
  render: () => (
    <Histogram
      dataSeries={[
        {
          seriesLabel: "Group A",
          data: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125],
          color: "#69b3a2",
        },
        {
          seriesLabel: "Group B",
          data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130],
          color: "#ff6347",
        },
      ]}
      width={600}
      height={400}
      bins={10}
      mirrored={true}
      title="Mirrored Histogram"
    />
  ),

  name: "Mirrored Histogram",
};

export const OverlappingHistogram = {
  render: () => (
    <Histogram
      dataSeries={[
        {
          seriesLabel: "Variable 1",

          data: Array.from(
            {
              length: 1000,
            },
            () => Math.random() * 2 - 1,
          ),

          color: "#69b3a2",
        },
        {
          seriesLabel: "Variable 2",

          data: Array.from(
            {
              length: 1000,
            },
            () => Math.random() * 2 + 3,
          ),

          color: "#404080",
        },
      ]}
      width={800}
      height={400}
      bins={30}
      title="Overlapping Histogram"
    />
  ),

  name: "Overlapping Histogram",
};
