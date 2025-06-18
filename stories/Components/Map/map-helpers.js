import { getContinent, getCountryCoords } from './lookup';
/**
 * Transform function to calculate the number of commitments per year.
 * @param {Array} rawData - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForMap = results => {
  const seenNodeIds = new Set(); // Track unique node_ids

  const data = results
    .reduce((acc, entry) => {
      // Skip if node_id is already processed
      // if (seenNodeIds.has(entry.node_id)) {
      //   return acc;
      // }

      // Mark node_id as processed
      seenNodeIds.add(entry.node_id);

      if (entry.continent == 'North America') {
        entry.continent = 'Americas';
      }

      // Handle geographic exceptions
      if (entry.country_iso_code == null) {
        entry.country_name = 'Global';
        entry.title = 'Global';
        entry.country_id = 'ALL';
        entry.country_iso_code = 'GLOBAL';
      }

      if (entry.country_iso_code === false) {
        entry.title = entry.country_name + ' regional commitments';
        entry.country_iso_code = entry.country_name.toUpperCase();
        entry.country_name = entry.country_name;
      }

      const existingEntry = acc.find(
        item => item.country_iso_code === entry.country_iso_code
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
    .filter(c => c.coords !== null);

  return data;
};
