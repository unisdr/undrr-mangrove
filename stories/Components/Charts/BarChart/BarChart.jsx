import React from "react";
import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import {
  transformDataForCommitmentsPerYear,
  transformDataForOrganizationsPerCommitment,
} from "./chart-helpers";

// Main BarChart component
export default function BarChart({
  data = [], // Array of data objects with 'label' and 'value' properties
  width = 600, // Default width of the SVG element
  height = 400, // Default height of the SVG element
  labelColor = "#6B7280", // Default color for labels
  backgroundColor = "#FFFFFF", // Default background color for the SVG
  axisColor = "#6B7280", // Default color for the axis lines
  tickColor = "#6B7280", // Default color for the tick marks
  color = "#4065A3", // Default color for the bars
  title = "Bar Chart", // Default title of the chart
  xAxisLabel = "X-Axis", // Default label for the x-axis
  yAxisLabel = "Y-Axis", // Default label for the y-axis
  dataSource = "Data Source", // Default data source label
  ariaLabel = "Bar chart showing data", // ARIA label for accessibility
  ariaDescription = "", // ARIA description for accessibility
  type = "COMMITMENTS", // Type of data to display
}) {
  const [chartData, setChartData] = useState(data);
  const svgRef = useRef();

  useEffect(() => {
    mapData();
  }, [data, type]);

  const mapData = () => {
    if (type === "COMMITMENTS") {
      setChartData(transformDataForCommitmentsPerYear(data));
    } else {
      setChartData(transformDataForOrganizationsPerCommitment(data));
    }
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear existing content

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", ariaLabel)
      .attr("aria-describedby", ariaDescription)
      .style("background-color", backgroundColor)
      .style("overflow", "visible");

    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value)])
      .range([innerHeight, 0]);

    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("line, path")
      .attr("stroke", tickColor);

    chart
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("line, path")
      .attr("stroke", tickColor);

    const barGroups = chart
      .selectAll()
      .data(chartData)
      .enter()
      .append("g")
      .attr("key", (d) => d.label);

    barGroups
      .append("rect")
      .attr("class", "bar")
      .attr("x", (g) => xScale(g.label))
      .attr("y", (g) => yScale(g.value))
      .attr("height", (g) => innerHeight - yScale(g.value))
      .attr("width", xScale.bandwidth())
      .attr("fill", color)
      .attr("tabindex", 0)
      .attr("role", "listitem")
      .attr("aria-label", (g) => `Bar for ${g.label} with value ${g.value}`);

    barGroups
      .append("text")
      .attr("class", "value")
      .attr("x", (a) => xScale(a.label) + xScale.bandwidth() / 2)
      .attr("y", (a) => yScale(a.value) - 5)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text((a) => `${a.value}`);

    chart
      .append("text")
      .attr("class", "label")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text(xAxisLabel);

    chart
      .append("text")
      .attr("class", "label")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left / 2.4)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text(yAxisLabel);

    svg
      .append("text")
      .attr("class", "title")
      .attr("x", innerWidth / 2 + margin.left)
      .attr("y", 5)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .style("font-size", "22px")
      .style("font-weight", "600")
      .text(title);

    chart
      .append("text")
      .attr("class", "source")
      .attr("x", innerWidth)
      .attr("y", innerHeight + margin.bottom - 5)
      .attr("text-anchor", "end")
      .style("fill", labelColor)
      .style("font-size", "10px")
      .text(dataSource);
  }, [
    chartData,
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

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
}
