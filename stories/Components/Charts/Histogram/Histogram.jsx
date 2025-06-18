import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

export default function Histogram({
  dataSeries,
  width,
  height,
  bins = 30,
  title = 'Histogram',
  locale = 'en',
  direction = 'ltr',
}) {
  const svgRef = useRef();

  const [visibleSeries, setVisibleSeries] = useState(
    dataSeries.map(() => true)
  );

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', title)
      .style('background-color', '#fff')
      .style('overflow', 'visible')
      .attr('dir', direction);

    svg.select('title').text(`Histogram titled: ${title}`);

    const margin = { top: 30, right: 150, bottom: 50, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const allData = dataSeries.flatMap((series, index) =>
      visibleSeries[index] ? series.data : []
    );

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(allData), d3.max(allData)])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().range([innerHeight, 0]);

    // add bins for each data series using the histogram layout
    const histogram = d3
      .histogram()
      .domain(xScale.domain())
      // add bins with specified number of thresholds
      .thresholds(xScale.ticks(bins));

    const allBins = dataSeries.map((series, index) =>
      visibleSeries[index] ? histogram(series.data) : []
    );
    const maxBinCount = d3.max(allBins, bins => d3.max(bins, d => d.length));
    yScale.domain([0, maxBinCount]);

    chart
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale));

    chart.append('g').call(d3.axisLeft(yScale).ticks(5));

    chart
      .append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(''))
      .selectAll('.tick line')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '2,2');

    chart
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3.axisBottom(xScale).ticks(bins).tickSize(-innerHeight).tickFormat('')
      )
      .selectAll('.tick line')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '2,2');

    dataSeries.forEach((series, seriesIndex) => {
      if (!visibleSeries[seriesIndex]) return;

      const seriesBins = histogram(series.data);

      chart
        .selectAll(`.bar-series-${seriesIndex}`)
        .data(seriesBins)
        .join('rect')
        .attr('class', `bar-series-${seriesIndex}`)
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr('height', d => innerHeight - yScale(d.length))
        .attr('fill', series.color || '#69b3a2')
        .attr('fill-opacity', 0.6)
        .on('mouseover', function (event, d) {
          d3.select(this).attr(
            'fill',
            d3.color(series.color || '#69b3a2').brighter(0.5)
          );
        })
        .on('mouseout', function () {
          d3.select(this).attr('fill', series.color || '#69b3a2');
        });
    });

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
      .style('opacity', 0);

    chart
      .selectAll('[class^=bar-series-]')
      .on('mouseover', function (event, d) {
        tooltip
          .style('opacity', 1)
          .html(`Range: [${d.x0}, ${d.x1})<br>Count: ${d.length}`)
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function () {
        tooltip.style('opacity', 0);
      });

    // Add legend with toggle functionality
    const legend = svg
      .append('g')
      .attr('transform', `translate(${innerWidth + 50}, ${margin.top})`);

    dataSeries.forEach((series, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 25})`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setVisibleSeries(prev =>
            prev.map((visible, index) => (index === i ? !visible : visible))
          );
        });

      legendRow
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', visibleSeries[i] ? series.color || '#69b3a2' : '#ccc');

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 12.5)
        .attr('text-anchor', 'start')
        .style('alignment-baseline', 'middle')
        .style('font-size', '12px')
        .text(series.seriesLabel);
    });
  }, [
    dataSeries,
    width,
    height,
    bins,
    title,
    locale,
    direction,
    visibleSeries,
  ]);

  return (
    <div>
      <h3>{title}</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
