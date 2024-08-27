import { getLatLong } from "./lookup";
/**
 * Transform function to calculate the number of commitments per year.
 * @param {Array} rawData - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForMap = (results) => {
  return results
    .map((entry) => {
      const _coords = getLatLong(entry.country_iso_code);
      return {
        ...entry,
        label: entry.country_name,
        description: entry.title,
        coords: _coords,
      };
    })
    .filter((c) => c.coords !== null);
};
