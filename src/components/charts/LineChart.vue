<!-- Layout -->
<template>
    <svg ref="chart"></svg>
</template>


<!-- Code behind -->
<script>
    import * as d3 from "d3";
    import { v4 as uuidv4 } from 'uuid';
    import { handleMouseOver, handleMouseOut } from "@/components/event-handler-collection";
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

            y: {
                type: Function,
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
            xScale: {
                type: Function,
                default: null
            },

            yDomain: {
                type: Array,
                default: undefined
            },

            yLabel: {
                type: String,
                required: true
            },
            yLabelShort: {
                type: String,
                required: true
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

            let circles, lineGroup, dataLine, recommendLine;
            let xScale, yScale;

            const radius = 5;

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

                props.data.forEach((d, i) => d.id = i);
                const X = d3.map(props.data, props.x);
                const Y = d3.map(props.data, (val) => toPercentage(props.y(val)));
                const I = d3.range(X.length);
                const D = props.data;

                // Compute default domains.
                const xDomain = d3.extent(X);
                const yDomain = props.yDomain === undefined ?
                    [0, d3.max(Y)] :
                    [toPercentage(props.yDomain[0]), toPercentage(props.yDomain[1])];

                // TODO
                // const yDomain = [0, d3.max(Y)]
                // const yDomain = [d3.min(Y), d3.max(Y)]

                const xRange = [
                    props.margin.left, props.width - props.margin.right];
                const yRange = [props.height - props.margin.bottom, props.margin.top];

                // Construct scales and axes.
                xScale = props.xScale === null ? props.xType()
                    .domain(xDomain)
                    .nice()
                    .range(xRange) : props.xScale;
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
                // Remove x-axis line and add a custom one
                // const tmp = svg.append("g")
                //     .attr("transform", `translate(0, ${height - marginBottom})`);
                // tmp.call(xAxis)
                // tmp.select(".domain")
                //     .remove();
                // tmp.append("line")
                //     .attr("stroke", "black")
                //     .attr("stroke-width", 1)
                //     .attr("x1", xScale.range()[0])
                //     .attr("y1", 0)
                //     .attr("x2", xScale.range()[1])
                //     .attr("y2", 0);

                svg.append("g")
                    .attr("transform", `translate(${props.margin.left}, 0)`)
                    .call(yAxis)
                    .call(g => g.select(".domain").remove())
                    .call(g => g.selectAll(".tick line").clone()
                        .attr("x2", props.width - props.margin.left - props.margin.right)
                        .attr("stroke-opacity", 0.1))
                    // .call(g => g.append("text")
                    //     .attr("x", 0)
                    //     .attr("y", 10)
                    //     .attr("fill", "currentColor")
                    //     .attr("text-anchor", "start")
                    //     .text(props.yLabelShort + " in % of recommended"));

                ///////////////
                // Add Areas //
                ///////////////
                const colors = {
                    "high": "red",
                    "medium": "orangered",
                    "low": "orange",
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
                // Construct a line generator.
                const line = (data, xscale=xScale) => d3.line()
                    .defined(i => D[i])
                    .curve(d3.curveLinear)
                    .x(i => xscale(X[i]))
                    .y(i => yScale(Y[i]))(data);

                lineGroup = svg.append("g").attr("clip-path", `url(#${clip})`)

                dataLine = lineGroup.append("path")
                    .classed("dataline", true)
                    .classed("zoomable", true)
                    .attr("fill", "none")
                    .attr("d", line(I));

                const line2 = (data, xscale=xScale) => d3.line()
                    .defined(i => D[i])
                    .curve(d3.curveLinear)
                    .x(i => xscale(X[i]))
                    .y(i => yScale(toPercentage(R[i])))(data);

                recommendLine = lineGroup.append("path")
                    .classed("recommendation-line", true)
                    .classed("zoomable", true)
                    .attr("fill", "none")
                    .attr("d", line2(I));

                // AddRecommendationLine(svg, lineThreshold, xScale, yScale)

                ///////////////////
                // Add Datapints //
                ///////////////////
                const colorScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => d.end))
                    .range(props.areas.map(d => colors[d.name]).concat(["black"]));

                const interpretationScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => toPercentage(d.end)))
                    .range(props.areas.map(d => d.name).concat(["none"]));

                const datadots = svg.append("g")
                    .classed("zoomable", true)
                    .attr("clip-path", `url(#${clip})`)

                circles = datadots.selectAll("circle")
                    .data(props.data)
                    .join("circle")
                    .attr("data-id", (d, i) => i)
                    .attr("cx", (d, i) => xScale(X[i]))
                    .attr("cy", (d, i) => yScale(Y[i]))
                    .attr("fill", d => colorScale(d.best_val_a))
                    .attr("r", radius)
                    .on("mouseover", function(event, d) {
                        bnl.setHighlightedObs(d.id);
                        handleMouseOver.call(this, event, d, interpretationScale);
                    })
                    .on("mousedown", function(_, d) {
                        bnl.setSelectedObs(d.id);
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
                        [xScale.range()[0], yScale.range()[0]],
                        [xScale.range()[1], yScale.range()[1]]
                    ])
                    .on("zoom", function(event) {
                        bnl.setZoom(event.transform);
                    })
                    .on("end", function() {
                        bnl.endZoom();
                    })

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

                const toPercentage = (d, access) => {
                    const divider = props.percentage ? d.recommended : 100.0;
                    return access(d) / divider * 100.0
                }

                // move circles
                circles.attr("cx", d => zx(props.x(d)))
                // move lines
                dataLine.attr("d", d3.line()
                    .x(d => zx(props.x(d)))
                    .y(d => yScale(toPercentage(d, props.y)))(props.data)
                );
                recommendLine.attr("d", d3.line()
                    .x(d => zx(props.x(d)))
                    .y(d => yScale(toPercentage(d, (dd) => dd.recommended)))(props.data)
                )
            }

            function addXGuide(id) {
                lineGroup.selectAll(".x-guide")
                    .data([props.data[id]])
                    .join("line")
                    .classed("x-guide", true)
                    .attr("transform", bnl.detailZoom)
                    .attr("x1", d => xScale(props.x(d)))
                    .attr("y1", yScale.range()[1])
                    .attr("x2", d =>  xScale(props.x(d)))
                    .attr("y2", yScale.range()[1])
                    .style("stroke-dasharray", 5 / bnl.detailZoom.k)
                    .attr("stroke-width", 1 / bnl.detailZoom.k)
                    .attr("stroke", "gray")
                    .transition()
                    .duration(250)
                    .attr("y2", yScale.range()[0])
            }
            function removeXGuide() {
                lineGroup.selectAll(".x-guide")
                    .data([])
                    .exit()
                    .transition()
                    .duration(350)
                    .attr("y2", yScale.range()[1])
                    .remove();
            }

            function highlight(id) {
                if (id === null){
                    removeXGuide();
                    circles.filter(":not(.clicked)")
                        .classed("hovered", false)
                        .transition()
                        .duration(100)
                        .attr("r", radius)
                } else {
                    addXGuide(id);
                    circles.filter(d => d.id === id)
                        .classed("hovered", true)
                        .transition()
                        .duration(100)
                        .attr("r", radius * 2)
                }
            }

            function select(id) {
                circles.filter(d => d.id !== id)
                    .classed("clicked", false)
                    .transition()
                    .duration(100)
                    .attr("r", radius)
                circles.filter(d => d.id === id)
                    .classed("clicked", true)
            }

            // Watch some of our properties to automatically refresh the
            // D3 diagram.
            watch(() => bnl.highlightedObs, highlight);
            watch(() => bnl.selectedObs, select);
            watch(() => bnl.detailZoom, zoomed);
            // watch(() => bnl.brushedClusters, draw);

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
