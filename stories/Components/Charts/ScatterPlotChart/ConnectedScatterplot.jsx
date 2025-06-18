import React from 'react';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function ConnectedScatterplot({
  data,
  width,
  height,
  lineColor = '#4065A3',
  pointColor = '#FFA500',
  labelColor = '#6B7280',
  backgroundColor = '#FFFFFF',
  axisColor = '#9CA3AF',
  tickColor = '#D1D5DB',
  title = 'Connected Scatterplot',
  locale = 'en',
  direction = 'ltr',
  ariaLabel = 'Connected scatterplot showing data',
  ariaDescription = '',
}) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel)
      .attr('aria-describedby', ariaDescription)
      .style('background-color', backgroundColor)
      .style('overflow', 'visible')
      .attr('dir', direction);

    svg.select('title').text(`Connected scatterplot titled: ${title}`);

    const margin = { top: 40, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.x)])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.y)])
      .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg.selectAll('.line').remove();
    svg.selectAll('.point').remove();
    svg.selectAll('.x-axis').remove();
    svg.selectAll('.y-axis').remove();
    svg.selectAll('.tooltip').remove();
    svg.selectAll('.grid-horizontal').remove();
    svg.selectAll('.grid-vertical').remove();

    chart
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('line, path')
      .attr('stroke', tickColor);

    chart
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('line, path')
      .attr('stroke', tickColor);

    chart
      .append('g')
      .attr('class', 'grid-horizontal')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(''))
      .selectAll('.tick line')
      .attr('stroke', '#D1D5DB')
      .attr('stroke-dasharray', '3,3');

    chart
      .append('g')
      .attr('class', 'grid-vertical')
      .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(''))
      .attr('transform', `translate(0, ${innerHeight})`)
      .selectAll('.tick line')
      .attr('stroke', '#D1D5DB')
      .attr('stroke-dasharray', '3,3');

    const line = d3
      .line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    chart
      .append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2)
      .attr('d', line);

    chart
      .selectAll('.point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 5)
      .attr('fill', pointColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('tabindex', 0)
      .attr('role', 'listitem')
      .attr('aria-label', d => `Point at (${d.x}, ${d.y})`)
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('r', 7)
          .attr('stroke', '#000000')
          .attr('stroke-width', 3);

        const tooltip = d3
          .select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background-color', '#fff')
          .style('padding', '5px')
          .style('border', '1px solid #ccc')
          .style('border-radius', '4px')
          .style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.1)')
          .style('opacity', 0.9)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`)
          .html(`X: ${d.x}, Y: ${d.y}`);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('r', 5)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        d3.selectAll('.tooltip').remove();
      });

    svg
      .append('text')
      .attr('class', 'label')
      .attr('x', -(innerHeight / 2) - margin.left)
      .attr('y', margin.left / 2.4)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .style('fill', labelColor)
      .text('Y-Axis Label');

    svg
      .append('text')
      .attr('class', 'label')
      .attr('x', innerWidth / 2 + margin.left)
      .attr('y', innerHeight + margin.bottom * 1.7)
      .attr('text-anchor', 'middle')
      .style('fill', labelColor)
      .text('X-Axis Label');

    svg
      .append('text')
      .attr('class', 'title')
      .attr('x', innerWidth / 2 + margin.left)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .style('fill', labelColor)
      .style('font-size', '22px')
      .style('font-weight', '600')
      .text(title);
  }, [
    data,
    width,
    height,
    lineColor,
    pointColor,
    labelColor,
    backgroundColor,
    axisColor,
    tickColor,
    title,
    locale,
    direction,
    ariaLabel,
    ariaDescription,
  ]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
}
