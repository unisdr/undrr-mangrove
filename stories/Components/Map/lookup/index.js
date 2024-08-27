import data from "./data.json";

export const getLatLong = (countryIsoCode) => {
  const country = data.find((c) => c.country === countryIsoCode);
  return country ? [country.latitude, country.longitude] : null;
};
