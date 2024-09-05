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
      // false + country name = continent
      if (entry.country_iso_code == null) {
        console.log("NULL");
        entry.country_name = "Global";
        entry.continent = "Global";
        entry.coords = [0,0];
        // entry.latitude = 0;
        // entry.longitude = 0;
        entry.country_iso_code = "GLOBAL";
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
          coords: getCountryCoords(entry.country_iso_code, entry.country_name),
          continent: getContinent(entry.country_iso_code, entry.country_name),
          value: 1,
        });

  
      }
      if (entry.continent == "Global")
        console.log(entry)
      return acc;
    }, [])
    .filter((c) => c.coords !== null);

  return data;
};
