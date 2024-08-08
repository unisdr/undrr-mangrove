import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function BarChart({
  data,
  width,
  height,
  color = "#4065A3",
  locale = "en",
  direction = "ltr",
  title = "Bar Chart",
  axisColor = "#ccc",
  tickColor = "#A0A0A0",
}) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", title) // Use the graph title as the ARIA label
      .style("background-color", "#fff")
      .style("overflow", "visible")
      .attr("dir", direction); // Add direction attribute for LTR/RTL

    svg.select("title").text(`Bar chart titled: ${title}`); // Append title for screen readers

    // Set the margins
    const margin = { top: 60, right: 30, bottom: 50, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a group element to contain the bars, applying margins
    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((_, index) => index))
      .range([0, innerWidth])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data)])
      .range([innerHeight, 0]);

    // Create axes generators
    const xAxis = d3.axisBottom(xScale).ticks(data.length);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // Clear existing contents
    svg.selectAll(".bar").remove();
    svg.selectAll(".bar-label").remove();
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();
    svg.selectAll(".tooltip").remove();
    svg.selectAll(".grid").remove();

    // Append new axes elements
    chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("line, path") // Select all lines and paths (ticks and axis line)
      .attr("stroke", tickColor); // Change the stroke color to gray

    chart
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("line, path") // Select all lines and paths (ticks and axis line)
      .attr("stroke", tickColor); // Change the stroke color to gray

    // Add grid lines
    chart
      .append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(""))
      .selectAll(".tick line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "2,2");

    // Create a tooltip element
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "#fff")
      .style("padding", "5px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0 0 10px rgba(0, 0, 0, 0.1)")
      .style("opacity", 0); // Initially invisible

    // Bind data and create bars
    chart
      .selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (_, index) => xScale(index))
      .attr("y", yScale)
      .attr("width", xScale.bandwidth())
      .attr("height", (value) => innerHeight - yScale(value))
      .attr("fill", color)
      .attr("tabindex", 0)
      .attr("role", "listitem")
      .attr(
        "aria-label",
        (_, index) => `Bar ${index + 1} with value ${data[index]}`
      )
      .on("mouseover", function (event, value) {
        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`Value: ${value}`)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
        d3.select(this).attr("fill", d3.color(color).brighter(0.5));
      })
      .on("mousemove", function (event) {
        // Update tooltip position
        tooltip
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        // Hide tooltip
        tooltip.style("opacity", 0);
        d3.select(this).attr("fill", color);
      });

    // Add labels directly on top of bars
    chart
      .selectAll(".bar-label")
      .data(data)
      .join("text")
      .attr("class", "bar-label")
      .attr("x", (_, index) => xScale(index) + xScale.bandwidth() / 2)
      .attr("y", (value) => yScale(value) - 5) // Position label above bar
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "black") // Label color
      .text((value) => value);
  }, [
    data,
    width,
    height,
    color,
    locale,
    direction,
    title,
    axisColor,
    tickColor,
  ]);

  return (
    <div>
      <h3>{title}</h3> {/* Render the graph title */}
      <svg ref={svgRef}>
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
    </div>
  );
}
