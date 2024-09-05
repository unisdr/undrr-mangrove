import data from "./data.json";

export const getLatLong = (countryIsoCode) => {
  if (!countryIsoCode) return null;

  const country = data.find(
    (c) => c.iso_alpha_3 === countryIsoCode.toUpperCase()
  );

  return country ? [country.latitude, country.longitude] : null;
};
