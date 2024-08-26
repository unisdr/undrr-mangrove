export const transformDataForBarChart = (results) => {
  const yearCounts = {};

  results.forEach((result) => {
    const year = new Date(result.created_on).getFullYear();
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  return Object.entries(yearCounts).map(([year, count]) => ({
    label: year.toString(),
    value: count,
    color: "#4065A3",
  }));
};
