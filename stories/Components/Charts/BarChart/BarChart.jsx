import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function BarChart({
  data,
  width,
  height,
  labelColor = "#6B7280",
  backgroundColor = "#FFFFFF",
  axisColor = "#9CA3AF",
  tickColor = "#D1D5DB",
  title = "Bar Chart",
  xAxisLabel = "X-Axis",
  yAxisLabel = "Y-Axis",
  dataSource = "Data Source",
  ariaLabel = "Bar chart showing data",
  ariaDescription = "",
}) {
  const svgRef = useRef();

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

    // Set the margins
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("line, path")
      .attr("stroke", tickColor);

    chart
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("line, path")
      .attr("stroke", tickColor);

    // Horizontal grid lines
    chart
      .append("g")
      .attr("class", "grid-horizontal")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(""))
      .selectAll(".tick line")
      .attr("stroke", "#D1D5DB")
      .attr("stroke-dasharray", "3,3");

    const barGroups = chart
      .selectAll()
      .data(data)
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
      .attr("fill", (g) => g.color)
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

    // X-axis label
    svg
      .append("text")
      .attr("class", "label")
      .attr("x", innerWidth / 2 + margin.left)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text(xAxisLabel);

    // Y-axis label
    svg
      .append("text")
      .attr("class", "label")
      .attr("x", -(innerHeight / 2) - margin.left)
      .attr("y", margin.left / 2.4)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text(yAxisLabel);

    // Title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", innerWidth / 2 + margin.left)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .style("font-size", "22px")
      .style("font-weight", "600")
      .text(title);

    // Data source
    svg
      .append("text")
      .attr("class", "source")
      .attr("x", innerWidth - margin.right / 2)
      .attr("y", innerHeight + margin.bottom * 1.7)
      .attr("text-anchor", "start")
      .style("fill", labelColor)
      .style("font-size", "10px")
      .text(dataSource);
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

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
}
