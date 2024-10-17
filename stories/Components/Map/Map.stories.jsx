import MapComponent, { transformData } from "./MapComponent";
import Fetcher from "../Fetcher/Fetcher";
import { Loader } from "../../Utilities/Loader/Loader";

export default {
  title: "Components/Maps/MapComponent",
  component: MapComponent,
  tags: ["autodocs"],
  argTypes: {
    data: {
      control: { type: "object" },
      description: "Data to be displayed on the map",
    },
    center: {
      control: { type: "array" },
      description: "Initial center of the map (latitude, longitude)",
      defaultValue: [20, 0],
    },
    zoom: {
      control: { type: "number" },
      description: "Initial zoom level of the map",
      defaultValue: 2,
    },
    maxZoom: {
      control: { type: "number" },
      description: "Maximum zoom level of the map",
      defaultValue: 5,
    },
    minZoom: {
      control: { type: "number" },
      description: "Minimum zoom level of the map",
      defaultValue: 2,
    },
  },
};

const Template = (args) => (
  <Fetcher
    api="https://sendaicommitments.undrr.org/api/v2/content/commitments-metrics"
    render={({ isLoading, data }) => (
      <>
        {isLoading ? (
          <Loader />
        ) : (
          <MapComponent {...args} data={transformData(data)} />
        )}
      </>
    )}
  />
);

export const Default = {
  render: Template,

  args: {
    data: [],
    center: [20, 0],
    zoom: 2,
    maxZoom: 5,
    minZoom: 2,
  },
};
