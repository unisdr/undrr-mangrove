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
  ariaLabel = "Bar chart showing data",
  ariaDescription = "",
}) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", ariaLabel)
      .attr("aria-describedby", ariaDescription)
      .style("background-color", backgroundColor)
      .style("overflow", "visible");

    svg.select("title").text(`Bar chart titled: ${title}`);

    // Set the margins
    const margin = { top: 40, right: 30, bottom: 50, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.language))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg.selectAll(".bar").remove();
    svg.selectAll(".bar-label").remove();
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();
    svg.selectAll(".tooltip").remove();
    svg.selectAll(".grid-horizontal").remove();
    svg.selectAll(".grid-vertical").remove();

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

    // horizontal grid lines
    chart
      .append("g")
      .attr("class", "grid-horizontal")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(""))
      .selectAll(".tick line")
      .attr("stroke", "#D1D5DB")
      .attr("stroke-dasharray", "3,3");

    // vertical grid lines
    chart
      .append("g")
      .attr("class", "grid-vertical")
      .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(""))
      .attr("transform", `translate(0, ${innerHeight})`)
      .selectAll(".tick line")
      .attr("stroke", "#D1D5DB")
      .attr("stroke-dasharray", "3,3");

    // add a tooltip
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
      .style("opacity", 0);

    const barGroups = chart.selectAll().data(data).enter().append("g");

    barGroups
      .append("rect")
      .attr("class", "bar")
      .attr("x", (g) => xScale(g.language))
      .attr("y", (g) => yScale(g.value))
      .attr("height", (g) => innerHeight - yScale(g.value))
      .attr("width", xScale.bandwidth())
      .attr("fill", (g) => g.color)
      .attr("tabindex", 0)
      .attr("role", "listitem")
      .attr("aria-label", (g) => `Bar for ${g.language} with value ${g.value}`)
      .on("mouseenter", function (event, actual) {
        d3.selectAll(".value").attr("opacity", 0);

        d3.select(this)
          .transition()
          .duration(300)
          .attr("opacity", 0.6)
          .attr("x", (a) => xScale(a.language) - 5)
          .attr("width", xScale.bandwidth() + 10);

        const y = yScale(actual.value);

        chart
          .append("line")
          .attr("id", "limit")
          .attr("x1", 0)
          .attr("y1", y)
          .attr("x2", innerWidth)
          .attr("y2", y)
          .attr("stroke", "#FED966")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "3 6");

        barGroups
          .append("text")
          .attr("class", "divergence")
          .attr("x", (a) => xScale(a.language) + xScale.bandwidth() / 2)
          .attr("y", (a) => yScale(a.value) + 30)
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .text((a, idx) => {
            const divergence = (a.value - actual.value).toFixed(1);

            let text = "";
            if (divergence > 0) text += "+";
            text += `${divergence}%`;

            return idx !== g.language ? text : "";
          });
      })
      .on("mouseleave", function () {
        d3.selectAll(".value").attr("opacity", 1);

        d3.select(this)
          .transition()
          .duration(300)
          .attr("opacity", 1)
          .attr("x", (a) => xScale(a.language))
          .attr("width", xScale.bandwidth());

        chart.selectAll("#limit").remove();
        chart.selectAll(".divergence").remove();
      });

    barGroups
      .append("text")
      .attr("class", "value")
      .attr("x", (a) => xScale(a.language) + xScale.bandwidth() / 2)
      .attr("y", (a) => yScale(a.value) - 5)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text((a) => `${a.value}%`);

    svg
      .append("text")
      .attr("class", "label")
      .attr("x", -(innerHeight / 2) - margin.left)
      .attr("y", margin.left / 2.4)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text("Love meter (%)");

    svg
      .append("text")
      .attr("class", "label")
      .attr("x", innerWidth / 2 + margin.left)
      .attr("y", innerHeight + margin.bottom * 1.7)
      .attr("text-anchor", "middle")
      .style("fill", labelColor)
      .text("Languages");

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

    svg
      .append("text")
      .attr("class", "source")
      .attr("x", innerWidth - margin.right / 2)
      .attr("y", innerHeight + margin.bottom * 1.7)
      .attr("text-anchor", "start")
      .style("fill", labelColor)
      .style("font-size", "10px")
      .text("Source: Stack Overflow, 2018");
  }, [
    data,
    width,
    height,
    labelColor,
    backgroundColor,
    axisColor,
    tickColor,
    title,
    ariaLabel,
    ariaDescription,
  ]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
}
