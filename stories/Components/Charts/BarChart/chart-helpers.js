/**
 * Transform function to calculate the number of commitments per year.
 * @param {Array} rawData - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForBarChart = (results) => {
  // Initialize an empty object to store counts of results per year
  const yearCounts = {};

  // iterate over each result in the input array and count results per year
  results.reduce((acc, result) => {
    // Extract the year from the 'created_on' date of the result
    const year = new Date(result.created_on).getFullYear();
    // Increment the count for the extracted year in the yearCounts object
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, yearCounts);

  // Convert the yearCounts object into an array of objects suitable for the bar chart
  const startYear = 2015;
  const endYear = Math.max(
    ...results.map((result) => new Date(result.created_on).getFullYear())
  );
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return years.map((year) => ({
    // Set the label to the year as a string
    label: year.toString(),
    // Set the value to the count of results for that year, defaulting to 0 if not present
    value: yearCounts[year] || 0,
  }));
};

/**
 * Transform function to calculate the number of commitments per year.
 * @param {Array} rawData - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForCommitmentsPerYear = (results) => {
  const yearCounts = {};

  // iterate over each result in the input array and count results per year
  results.reduce((acc, result) => {
    const year = new Date(result.created_on).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, yearCounts);

  const startYear = 2015;
  const endYear = Math.max(
    ...results.map((result) => new Date(result.created_on).getFullYear())
  );
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return years.map((year) => ({
    label: year.toString(),
    value: yearCounts[year] || 0,
    color: "#007bc8", // Example color, you can set this as needed
  }));
};

/**
 * Transform function to calculate the number of organizations attached to each commitment per year.
 * @param {Array} results - The raw dataset containing commitments.
 * @returns {Array} - Transformed data array for bar chart visualization.
 */
export const transformDataForOrganizationsPerCommitment = (results) => {
  const yearOrganizationCounts = {};

  // iterate over each result in the input array and count organizations per year
  results.reduce((acc, result) => {
    const year = new Date(result.created_on).getFullYear();
    const organizationCount = result.organizations.length;
    acc[year] = (acc[year] || 0) + organizationCount;
    return acc;
  }, yearOrganizationCounts);

  const startYear = 2015;
  const endYear = Math.max(
    ...results.map((result) => new Date(result.created_on).getFullYear())
  );
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return years.map((year) => ({
    label: year.toString(),
    value: yearOrganizationCounts[year] || 0,
    color: "#fbcb39", // Example color, you can set this as needed
  }));
};
