<!-- Layout -->
<template>
    <svg ref="chart"></svg>
</template>


<!-- Code behind -->
<script>
    import * as d3 from "d3";
    import { v4 as uuidv4 } from 'uuid';
    import { handleMouseOver, handleMouseOut, handleMouseOverCandle } from "@/components/event-handler-collection";

    import { useApp } from "@/store/app";
    import { ref, onMounted, defineComponent, watch } from "vue";

    export default defineComponent({

        props: {

            data: {
                type: Array,
                required: true
            },

            x: {
                type: Function,
                required: true
            },

            yo: {
                type: Function,
                required: true
            },
            yc: {
                type: Function,
                required: true
            },

            yLabel: {
                type: String,
                required: true
            },
            yLabelShort: {
                type: String,
                required: true
            },

            margin: {
                type: Object,
                default: () => {
                    return {
                        top: 15,
                        bottom: 10,
                        left: 40,
                        right: 10
                    };
                }
            },
            // Gets the width of the histogram.
            width: {
                type: Number,
                default: 640
            },
            // Gets the height of the histogram.
            height: {
                type: Number,
                default: 400
            },

            xType: {
                type: Function,
                default: d3.scaleUtc
            },
            yType: {
                type: Function,
                default: d3.scaleLinear
            },

            yDomain: {
                type: Array,
                default: undefined
            },

            areas: {
                type: Array,
                required: true
            },
            percentage: {
                type: Boolean,
                default: true
            },

        },

        setup(props) {
            // The template reference to bind the histogram to.
            const chart = ref(null);
            const bnl = useApp();

            let xScale, yScale;
            let circles, candles, dataline, lineGroup;
            let radius = 5;

            // Update the bars in the bar chart.
            function draw() {

                const svg = d3.select(chart.value);
                svg.selectAll('*').remove();

                // Compute values.
                const R = d3.map(props.data, (d) => d.recommended);
                const toPercentage = (val) => {
                    const divider = props.percentage ? R[0] : 100.0;
                    return val / divider * 100.0
                }

                const X = d3.map(props.data, props.x);

                const Yo = d3.map(props.data, (val) => toPercentage(props.yo(val)));
                const Yc = d3.map(props.data, (val) => toPercentage(props.yc(val)));
                // const Yh = d3.map(props.data, props.y);
                // const Yl = d3.map(props.data, props.y);
                const I = d3.range(X.length);

                // const weeks = (start, stop, stride) => d3.utcMonday.every(stride).range(start, +stop + 1);
                // const weekdays = (start, stop) => d3.utcDays(start, +stop + 1).filter(d => d.getUTCDay() !== 0 && d.getUTCDay() !== 6);

                // Compute default domains and ticks.
                const xDomain = d3.extent(X);
                // const yDomain = props.yDomain === undefined ?
                //     [0, Math.max(d3.max(Yo), d3.max(Yc))] :
                //     [toPercentage(props.yDomain[0]),
                //     toPercentage(props.yDomain[1])];

                const yDomain = [0, Math.max(d3.max(Yo), d3.max(Yc)) + d3.max(Yo) * 0.05];
                // const yDomain = [Math.min(d3.min(Yo), d3.min(Yc)), Math.max(d3.max(Yo), d3.max(Yc))];

                const xRange = [
                    props.margin.left, props.width - props.margin.right];
                const yRange = [props.height - props.margin.bottom, props.margin.top];

                // Construct scales and axes.
                // If you were to plot a stock using d3.scaleUtc, you’d see distracting gaps
                // every weekend. This chart therefore uses a d3.scaleBand whose domain is every
                // weekday in the dataset. A few gaps remain for holiday weekdays, such as
                // Christmas, but these are infrequent and allow the labeling of Mondays. As a
                // band scale, we specify explicit tick values.
                // const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
                xScale = props.xType()
                    .domain(xDomain)
                    .nice()
                    .range(xRange);
                yScale = props.yType()
                    .domain(yDomain)
                    .nice()
                    .range(yRange);

                const yAxis = d3.axisLeft(yScale)
                    .tickValues(props.areas.map(d => toPercentage(d.start)))

                //////////////
                // Main svg //
                //////////////
                svg
                    .attr("width", props.width)
                    .attr("height", props.height)
                    .attr("viewBox", [0, 0, props.width, props.height])
                    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

                // clipping - necessary for zooming
                const clip = uuidv4();
                svg.append("clipPath")
                    .attr("id", clip)
                    .append("rect")
                    .attr("x", xScale.range()[0])
                    .attr("y", yScale.range()[1])
                    .attr("width", xScale.range()[1]-xScale.range()[0])
                    .attr("height", Math.abs(yScale.range()[0]-yScale.range()[1]));

                svg.append("g")
                    .attr("transform", `translate(${props.margin.left}, 0)`)
                    .call(yAxis)
                    .call(g => g.select(".domain").remove())
                    .call(g => g.selectAll(".tick line").clone()
                        .attr("x2", props.width - props.margin.left - props.margin.right)
                        .attr("stroke-opacity", 0.1))

                ///////////////
                // Add Areas //
                ///////////////
                const colors = {
                    "high": "red",
                    "medium": "orangered",
                    "low": "orange",
                    // "low": "#ffedcc",

                    "normal": "green",
                }

                let res = props.areas;
                res.sort((a, b) => a.start - b.start)

                svg.append("g")
                    .selectAll("rect")
                    .data(res
                        .filter(d =>
                            yScale(toPercentage(d.start)) > yScale.range()[1] &&
                            yScale(toPercentage(d.end)) < yScale.range()[0]
                        )
                    )
                    .join("rect")
                    .attr("x", xScale.range()[0])
                    .attr("y", d => Math.max(yScale(toPercentage(d.end)), yScale.range()[1]))
                    .attr("width", xScale.range()[1]-xScale.range()[0])
                    .attr("height", d => Math.min(Math.min(
                            yScale(toPercentage(d.start)) - yScale(toPercentage(d.end)),
                            yScale(toPercentage(d.start)) - yScale.range()[1]
                        ), yScale.range()[0] - yScale(toPercentage(d.end)))
                    )
                    .attr('fill-opacity', 0.2)
                    .attr("fill", d => colors[d.name])

                // AddAreas(svg, areas, xScale, yScale);

                ///////////////
                // Add Lines //
                ///////////////
                lineGroup = svg.append("g").attr("clip-path", `url(#${clip})`)

                // Construct a line generator.
                const line2 = (data, xscale=xScale) => d3.line()
                    .curve(d3.curveLinear)
                    .x(i => xscale(X[i]))
                    .y(i => yScale(Yc[i]))(data);

                dataline = lineGroup.append("path")
                    .classed("dataline", true)
                    .classed("zoomable", true)
                    .attr("fill", "none")
                    .attr("d", line2(I));

                // Construct a line generator.
                const line = d3.line()
                    .curve(d3.curveLinear)
                    .x(i => xScale(X[i]))
                    .y(i => yScale(toPercentage(R[i])));

                lineGroup.append("path")
                    .classed("recommendation-line", true)
                    .classed("zoomable", true)
                    .attr("fill", "none")
                    .attr("d", line(I));

                /////////////////
                // Add Candles //
                /////////////////
                const interpretationScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => toPercentage(d.end)))
                    .range(props.areas.map(d => d.name).concat(["none"]));

                candles = svg.append("g")
                    // .attr("stroke", "currentColor")
                    // .attr("stroke-linecap", "round")
                    .attr("clip-path", `url(#${clip})`)
                .selectAll("g")
                .data(I)
                .join("g")
                    .attr("transform", i => `translate(${xScale(X[i])},0)`)

                //let size = radius * 4.0;

                candles.append('path')
                    .attr('d', i =>
                        "M" + (-radius) + "," + yScale(Yc[i]) +
                        "L" + 0 + "," + yScale(Yo[i]) + " " +
                        "L" + radius + "," + yScale(Yc[i])
                    )
                    .attr('stroke', 'gray')
                    .attr("stroke-width", 2)
                    .attr('fill', 'gray')
                    .on("mouseover", function(event, i) {
                        handleMouseOverCandle.call(this, event, props.data[i], interpretationScale);
                    })
                    .on("mouseout", handleMouseOut)

                ///////////////////
                // Add Datapints //
                ///////////////////
                const colorScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => d.end))
                    .range(props.areas.map(d => colors[d.name]).concat(["black"]));

                candles.append("circle")
                    .attr("cy", i => yScale(Yo[i]))
                    .attr("fill", i => colorScale(props.yo(props.data[i])))
                    .attr("r", radius * 0.4)
                    .on("mouseover", function(event, i) {
                        handleMouseOverCandle.call(this, event, props.data[i], interpretationScale);
                    })
                    .on("mouseout", handleMouseOut)

                circles = candles.append("circle")
                    .attr("cy", i => yScale(Yc[i]))
                    .attr("fill", i => colorScale(props.yc(props.data[i])))
                    .attr("r", radius)
                    .on("mouseover", function(event, i) {
                        // console.log(d)
                        bnl.setHighlightedObs(i);
                        handleMouseOver.call(this, event, props.data[i], interpretationScale);
                    })
                    .on("mousedown", function(_, i) {
                        bnl.setSelectedObs(i);
                    })
                    .on("mouseout", function() {
                        bnl.resetHighlightedObs();
                        handleMouseOut();
                    })

                //////////////
                // Add Zoom //
                //////////////
                const zoom = d3.zoom()
                    .scaleExtent([0.75, 32])
                    .extent([
                        [xScale.range()[0], yScale.range()[1]],
                        [xScale.range()[1], yScale.range()[0]]
                    ])
                    .translateExtent([
                        [-Infinity, yScale.range()[0]],
                        [Infinity, yScale.range()[1]]
                    ])
                    .on("zoom", function(event) {
                        bnl.setZoom(event.transform);
                    });

                svg.call(zoom)
                    .on("dblclick.zoom", () => {
                        svg.transition()
                            .duration(750)
                            .call(zoom.transform, d3.zoomIdentity);
                    });

                svg.call(zoom.transform, d3.zoomIdentity);
            }

            function zoomed(transform) {
                // Obacht: hacky
                chart.value.__zoom = transform;
                const zx = transform.rescaleX(xScale)
                    .interpolate(d3.interpolateRound);

                // move candles
                candles.attr("transform", i => `translate(${zx(props.x(props.data[i]))}, 0)`)

                // move lines
                const toPercentage = (d, access) => {
                    const divider = props.percentage ? d.recommended : 100.0;
                    return access(d) / divider * 100.0
                }
                dataline.attr("d", d3.line()
                    .x(d => zx(props.x(d)))
                    .y(d => yScale(toPercentage(d, props.yc)))(props.data)
                );
            }

            function highlight(id) {
                if (id === null){
                    // removeXGuide();
                    circles.filter(":not(.clicked)")
                        .classed("hovered", false)
                        .transition()
                        .duration(100)
                        .attr("r", radius)
                } else {
                    // addXGuide(id);
                    circles.filter(i => i === id)
                        .classed("hovered", true)
                        .transition()
                        .duration(100)
                        .attr("r", radius * 2)
                }
            }

            function select(id) {
                circles.filter(i => i !== id)
                    .classed("clicked", false)
                    .transition()
                    .duration(100)
                    .attr("r", radius)
                circles.filter(i => i === id)
                    .classed("clicked", true)
            }

            // Watch some of our properties to automatically refresh the
            // D3 diagram.
            watch(() => bnl.highlightedObs, highlight);
            watch(() => bnl.selectedObs, select);
            watch(() => bnl.detailZoom, zoomed, { deep: true });

            // Issue the load request once the component is ready.
            onMounted(draw);

            return {
                chart,
                                draw
            };
        },
    })
</script>


<!-- Local styles -->
<style>
</style>
