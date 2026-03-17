// TODO: Layered hydration (.fromElement.js + .hydrate.js) not yet adopted for
// this component. See docs/HYDRATION.md for the pattern.
import React from 'react';
import PropTypes from 'prop-types';
import { useRef, useEffect, useState } from 'react';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { transformDataForBarChart } from './chart-helpers';

/**
 * Renders a D3-powered bar chart with configurable axes, colors, and accessibility attributes.
 *
 * @param {Object} props
 * @param {Array<{label: string, value: number}>} [props.data] Array of data objects with label and value properties
 * @param {string} [props.cumulative]     Whether to accumulate values across bars ('true'/'false')
 * @param {number} [props.startYear]      Start year for filtering time-series data
 * @param {number} [props.endYear]        End year for filtering time-series data
 * @param {number} [props.width]          Width of the SVG element in pixels
 * @param {number} [props.height]         Height of the SVG element in pixels
 * @param {string} [props.labelColor]     CSS color for axis labels and value text
 * @param {string} [props.backgroundColor] CSS background color for the SVG
 * @param {string} [props.axisColor]      CSS color for axis lines
 * @param {string} [props.tickColor]      CSS color for tick marks (use 'none' to hide the y-axis)
 * @param {string} [props.color]          CSS fill color for the bars
 * @param {string} [props.title]          Chart title displayed above the bars
 * @param {string} [props.xAxisLabel]     Label for the x-axis
 * @param {string} [props.yAxisLabel]     Label for the y-axis
 * @param {string} [props.dataSource]     Data source attribution shown below the chart
 * @param {string} [props.ariaLabel]      Accessible label for the SVG element
 * @param {string} [props.ariaDescription] Accessible description for the SVG element
 * @param {string} [props.apiData]        Whether data comes from an API ('true'/'false')
 * @param {string} [props.type]           Data type key passed to transformDataForBarChart
 * @param {{top: number, right: number, bottom: number, left: number}} [props.margin] SVG margins
 */
export default function BarChartProcessor({
  data = [],
  cumulative = 'false',
  startYear = 2015,
  endYear = 2030,
  width = 600,
  height = 400,
  labelColor = '#6B7280',
  backgroundColor = '#FFFFFF',
  axisColor = '#6B7280',
  tickColor = '#6B7280',
  color = '#4065A3',
  title = '',
  xAxisLabel = '',
  yAxisLabel = '',
  dataSource = '',
  ariaLabel = 'Bar chart showing data',
  ariaDescription = '',
  apiData = 'false',
  type = '',
  margin = { top: 40, right: 30, bottom: 70, left: 70 },
}) {
  const [chartData, setChartData] = useState(data);
  const svgRef = useRef();

  useEffect(() => {
    mapData();
  }, [data, type]);

  const mapData = () => {
    setChartData(
      transformDataForBarChart(data, {
        graphType: type,
        defaultColor: color,
        apiData: apiData,
        startYear,
        endYear,
        cumulative,
      })
    );
  };

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll('*').remove(); // Clear existing content

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', ariaLabel)
      .attr('aria-describedby', ariaDescription)
      .style('background-color', backgroundColor)
      .style('overflow', 'visible');

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scaleBand()
      .domain(chartData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, max(chartData, d => d.value)])
      .range([innerHeight, 0]);

    chart
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(axisBottom(xScale))
      .selectAll('line, path')
      .attr('stroke', tickColor);

    if (tickColor != 'none') {
      chart
        .append('g')
        .attr('class', 'y-axis')
        .call(axisLeft(yScale).ticks(5))
        .selectAll('line, path')
        .attr('stroke', tickColor);
    }

    const barGroups = chart
      .selectAll()
      .data(chartData)
      .enter()
      .append('g')
      .attr('key', d => d.label);

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('x', g => xScale(g.label))
      .attr('y', g => yScale(g.value))
      .attr('height', g => innerHeight - yScale(g.value))
      .attr('width', xScale.bandwidth())
      .attr('fill', color)
      .attr('tabindex', 0)
      .attr('role', 'listitem')
      .attr('aria-label', g => `Bar for ${g.label} with value ${g.value}`);

    barGroups
      .append('text')
      .attr('class', 'value')
      .attr('x', a => xScale(a.label) + xScale.bandwidth() / 2)
      .attr('y', a => yScale(a.value) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', labelColor)
      .text(a => (a.value !== 0 ? `${a.value}` : ''));

    if (xAxisLabel) {
      chart
        .append('text')
        .attr('class', 'label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('fill', labelColor)
        .text(xAxisLabel);
    }

    if (yAxisLabel) {
      chart
        .append('text')
        .attr('class', 'label')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left / 2.4)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .style('fill', labelColor)
        .text(yAxisLabel);
    }

    if (title) {
      svg
        .append('text')
        .attr('class', 'title')
        .attr('x', innerWidth / 2 + margin.left)
        .attr('y', 5)
        .attr('text-anchor', 'middle')
        .style('fill', labelColor)
        .style('font-size', '22px')
        .style('font-weight', '600')
        .text(title);
    }

    if (dataSource) {
      chart
        .append('text')
        .attr('class', 'source')
        .attr('x', innerWidth)
        .attr('y', innerHeight + margin.bottom - 5)
        .attr('text-anchor', 'end')
        .style('fill', labelColor)
        .style('font-size', '10px')
        .text(dataSource);
    }
  }, [
    chartData,
    width,
    height,
    margin,
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

BarChartProcessor.propTypes = {
  /** Array of data objects, each with a label and numeric value */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  /** Whether to accumulate values across bars ('true' or 'false') */
  cumulative: PropTypes.string,
  /** Start year for filtering time-series data */
  startYear: PropTypes.number,
  /** End year for filtering time-series data */
  endYear: PropTypes.number,
  /** Width of the SVG element in pixels */
  width: PropTypes.number,
  /** Height of the SVG element in pixels */
  height: PropTypes.number,
  /** CSS color for axis labels and value text */
  labelColor: PropTypes.string,
  /** CSS background color for the SVG */
  backgroundColor: PropTypes.string,
  /** CSS color for axis lines */
  axisColor: PropTypes.string,
  /** CSS color for tick marks (use 'none' to hide the y-axis) */
  tickColor: PropTypes.string,
  /** CSS fill color for the bars */
  color: PropTypes.string,
  /** Chart title displayed above the bars */
  title: PropTypes.string,
  /** Label for the x-axis */
  xAxisLabel: PropTypes.string,
  /** Label for the y-axis */
  yAxisLabel: PropTypes.string,
  /** Data source attribution shown below the chart */
  dataSource: PropTypes.string,
  /** Accessible label for the SVG element */
  ariaLabel: PropTypes.string,
  /** Accessible description for the SVG element */
  ariaDescription: PropTypes.string,
  /** Whether data comes from an API ('true' or 'false') */
  apiData: PropTypes.string,
  /** Data type key passed to transformDataForBarChart */
  type: PropTypes.string,
  /** SVG margins around the chart area */
  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
};
