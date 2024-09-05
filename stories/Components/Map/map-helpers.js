import { getContinent, getCountryCoords } from "./lookup";
/**
 * Transform function to calculate the number of commitments per year.
 * @param {Array} rawData - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForMap = (results) => {
  const data = results
    .reduce((acc, entry) => {
      // console.log("acc.country_iso_code",entry.country_iso_code);
      // here we work around some geographic exception
      // null = global
      if (entry.country_iso_code == null) {
        entry.country_name = "Global";
        entry.title = "Global";
        entry.country_id = "ALL";
        entry.country_iso_code = "GLOBAL";
      }
      // false + country name = continent
      if (entry.country_iso_code === false) {
        entry.title = entry.country_name + " regional commitments";
        entry.country_iso_code = entry.country_name.toUpperCase();
        entry.country_name = entry.country_name;
      }
      const existingEntry = acc.find(
        (item) => item.country_iso_code === entry.country_iso_code
      );
      if (existingEntry) {
        existingEntry.value += 1;
      } else {
        acc.push({
          ...entry,
          label: entry.country_name,
          description: entry.title,
          coords: getCountryCoords(entry.country_iso_code),
          continent: getContinent(entry.country_iso_code),
          value: 1,
        });
      }
      return acc;
    }, [])
    .filter((c) => c.coords !== null);
  return data;
};
