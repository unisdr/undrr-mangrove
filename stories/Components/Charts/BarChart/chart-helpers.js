/**
 * Generalized transform function to calculate values per year,
 * counting each entry only once per unique result.node_id,
 * with an option for cumulative counting.
 * @param {Array} results - The raw dataset containing commitments.
 * @param {Object} options - Additional configuration options (e.g., startYear, endYear, color, cumulative).
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForBarChart = (results, options = {}) => {
  const { startYear = 2015, endYear = 2030, defaultColor = "#007bc8", cumulative = false, graphType = "COMMITMENTS" } = options;

  const yearCounts = {};
  const seenNodeIds = new Set(); // Track unique node_id's

  let valueExtractor;

  if (graphType === "COMMITMENTS") {
    valueExtractor = function(result) {
      return 1;
    };
  } else if (graphType === "ORGANISATIONS") {
    valueExtractor = function(result) {
      return result.organizations.length;
    };
  } else if (graphType === "DELIVERABLES") {
    valueExtractor = function(result) {
      return 1;
    };
  } else {
    console.error("Invalid graphType passed to mg-bar-chart");
    return false;
  }
  
  // Iterate over each result and calculate values using the valueExtractor function
  results.forEach((result) => {
    if (!seenNodeIds.has(result.node_id) || graphType === "DELIVERABLES") {
      seenNodeIds.add(result.node_id); // Mark node_id as seen
      const year = new Date(result.created_on).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + valueExtractor(result);  // Correctly call valueExtractor here
    }
  });
  
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  // Clear the original array
  results.length = 0;

  // If cumulative, build the cumulative count
  let cumulativeValue = 0;

  const calcultated = years.map((year) => {
    const currentValue = yearCounts[year] || 0;
    if (cumulative) {
      cumulativeValue += currentValue;
      return {
        label: year.toString(),
        value: cumulativeValue,
        color: defaultColor,
      };
    }
    return {
      label: year.toString(),
      value: currentValue,
      color: defaultColor,
    };
  });

  return calcultated;
};
