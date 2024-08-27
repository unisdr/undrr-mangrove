import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

// Main BarChart component
export default function BarChart({
  data, // Array of data objects with 'label' and 'value' properties
  width, // Width of the SVG element
  height, // Height of the SVG element
  labelColor = "#6B7280", // Default color for labels
  backgroundColor = "#FFFFFF", // Default background color for the SVG
  axisColor = "#9CA3AF", // Default color for the axis lines
  tickColor = "#D1D5DB", // Default color for the tick marks
  color = "#4065A3", // Default color for the bars
  title = "Bar Chart", // Default title of the chart
  xAxisLabel = "X-Axis", // Default label for the x-axis
  yAxisLabel = "Y-Axis", // Default label for the y-axis
  dataSource = "Data Source", // Default data source label
  ariaLabel = "Bar chart showing data", // ARIA label for accessibility
  ariaDescription = "", // ARIA description for accessibility
}) {
  // Reference to the SVG element
  const svgRef = useRef();

  // Effect hook to render the chart when dependencies change
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    // Clear existing content
    svg.selectAll("*").remove();

    // Set SVG attributes
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img") // ARIA role for accessibility
      .attr("aria-label", ariaLabel) // ARIA label for accessibility
      .attr("aria-describedby", ariaDescription) // ARIA description for accessibility
      .style("background-color", backgroundColor) // Set background color
      .style("overflow", "visible"); // Ensure content is visible

    // Set the margins
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a group element for the chart
    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create x-scale
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label)) // Map data labels to the x-axis
      .range([0, innerWidth]) // Set the range of the x-axis
      .padding(0.2); // Add padding between bars

    // Create y-scale
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)]) // Set the domain from 0 to the max value
      .range([innerHeight, 0]); // Set the range of the y-axis

    // Create x-axis
    const xAxis = d3.axisBottom(xScale);
    // Create y-axis with 5 ticks
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // Append x-axis to the chart
    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerHeight})`) // Move x-axis to the bottom
      .call(xAxis)
      .selectAll("line, path")
      .attr("stroke", tickColor); // Set color for x-axis ticks and path

    // Append y-axis to the chart
    // chart
    //   .append("g")
    //   .attr("class", "y-axis")
    //   .call(yAxis)
    //   .selectAll("line, path")
    //   .attr("stroke", tickColor); // Set color for y-axis ticks and path

    // Add horizontal grid lines
    // chart
    //   .append("g")
    //   .attr("class", "grid-horizontal")
    //   .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(""))
    //   .selectAll(".tick line")
    //   .attr("stroke", "#D1D5DB") // Set color for grid lines
    //   .attr("stroke-dasharray", "3,3"); // Make grid lines dashed

    // Create groups for each bar
    const barGroups = chart
      .selectAll()
      .data(data)
      .enter()
      .append("g")
      .attr("key", (d) => d.label); // Use label as key

    // Append rectangles (bars) to the bar groups
    barGroups
      .append("rect")
      .attr("class", "bar")
      .attr("x", (g) => xScale(g.label)) // Set x position based on label
      .attr("y", (g) => yScale(g.value)) // Set y position based on value
      .attr("height", (g) => innerHeight - yScale(g.value)) // Set height based on value
      .attr("width", xScale.bandwidth()) // Set width based on x-scale bandwidth
      .attr("fill", color ? color : (g) => g.color) // Set fill color based on data
      .attr("tabindex", 0) // Make bars focusable for accessibility
      .attr("role", "listitem") // ARIA role for accessibility
      .attr("aria-label", (g) => `Bar for ${g.label} with value ${g.value}`); // ARIA label for accessibility

    // Append text labels to the bar groups
    barGroups
      .append("text")
      .attr("class", "value")
      .attr("x", (a) => xScale(a.label) + xScale.bandwidth() / 2) // Center text in the bar
      .attr("y", (a) => yScale(a.value) - 5) // Position text above the bar
      .attr("text-anchor", "middle") // Center text horizontally
      .style("fill", labelColor) // Set text color
      .text((a) => `${a.value}`); // Display the value

    // Append x-axis label
    chart
      .append("text")
      .attr("class", "label")
      .attr("x", innerWidth / 2) // Center label horizontally
      .attr("y", innerHeight + margin.bottom - 10) // Position label below the x-axis
      .attr("text-anchor", "middle") // Center text horizontally
      .style("fill", labelColor) // Set text color
      .text(xAxisLabel); // Set text to x-axis label

    // Append y-axis label
    chart
      .append("text")
      .attr("class", "label")
      .attr("x", -innerHeight / 2) // Center label vertically
      .attr("y", -margin.left / 2.4) // Position label to the left of the y-axis
      .attr("transform", "rotate(-90)") // Rotate text to be vertical
      .attr("text-anchor", "middle") // Center text horizontally
      .style("fill", labelColor) // Set text color
      .text(yAxisLabel); // Set text to y-axis label

    // Append chart title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", innerWidth / 2 + margin.left) // Center title horizontally
      .attr("y", 5) // Position title at the top
      .attr("text-anchor", "middle") // Center text horizontally
      .style("fill", labelColor) // Set text color
      .style("font-size", "22px") // Set font size
      .style("font-weight", "600") // Set font weight
      .text(title); // Set text to chart title

    // Append data source label
    chart
      .append("text")
      .attr("class", "source")
      .attr("x", innerWidth) // Position label at the right end
      .attr("y", innerHeight + margin.bottom - 5) // Position label below the x-axis
      .attr("text-anchor", "end") // Align text to the end
      .style("fill", labelColor) // Set text color
      .style("font-size", "10px") // Set font size
      .text(dataSource); // Set text to data source
  }, [
    data,
    width,
    height,
    labelColor,
    backgroundColor,
    axisColor,
    tickColor,
    title,
    xAxisLabel,
    yAxisLabel,
    dataSource,
    ariaLabel,
    ariaDescription,
  ]);

  // Render the SVG element
  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
}
