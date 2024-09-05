import { getContinent, getCountryIsoName } from "./lookup";
/**
 * Transform function to calculate the number of commitments per year.
 * @param {Array} rawData - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForMap = (results) => {
  const data = results
    .reduce((acc, entry) => {
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
          coords: getCountryIsoName(entry.country_iso_code),
          continent: getContinent(entry.country_iso_code),
          value: 1,
        });
      }
      return acc;
    }, [])
    .filter((c) => c.coords !== null);
  return data;
};
