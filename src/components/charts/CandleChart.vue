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
                // const xAxis = d3.axisBottom(xScale).tickFormat(d3.utcFormat(xFormat)).tickValues(xTicks);
                // const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
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

                // svg.append("g")
                //     .attr("transform", `translate(0, ${height - marginBottom})`)
                //     .call(xAxis)
                //     .call(g => g.select(".domain").remove());

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

                // svg.append("g")
                //     .selectAll("rect")
                //     .data(res)
                //     .join("rect")
                //     .attr("x", xScale.range()[0])
                //     .attr("y", d => yScale(toPercentage(d.end)))
                //     .attr("width", xScale.range()[1]-xScale.range()[0])
                //     .attr("height", d => yScale(toPercentage(d.start))-yScale(toPercentage(d.end)))
                //     .attr('fill-opacity', 0.2)
                //     .attr("fill", d => colors[d.name])

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

                // svg.append("line")
                //     .classed("recommendation-line", true)
                //     .attr("x1", xScale.range()[0])
                //     .attr("y1", yScale(toPercentage(props.lineThreshold)))
                //     .attr("x2", xScale.range()[1])
                //     .attr("y2", yScale(toPercentage(props.lineThreshold)));

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

                // g.append("line")
                //     .attr("y1", i => yScale(Yl[i]))
                //     .attr("y2", i => yScale(Yh[i]));

                let size = radius * 2.0;
                let arrowPoints = [[0, 0], [10, 5], [0, 10]];
                svg.append('defs')
                    .append('marker')
                    .attr('id', 'arrow_green')
                    .attr('viewBox', [0, 0, 10, 10])
                    .attr('refX', 10)
                    .attr('refY', 5)
                    .attr('markerWidth', size / 4)
                    .attr('markerHeight', size / 4)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', d3.line()(arrowPoints))
                    .attr('stroke', 'green')
                    .attr("stroke-width", 2)
                    .attr("fill", "none");

                svg.append('defs')
                    .append('marker')
                    .attr('id', 'arrow_red')
                    .attr('viewBox', [0, 0, 10, 10])
                    .attr('refX', 10)
                    .attr('refY', 5)
                    .attr('markerWidth', size / 4)
                    .attr('markerHeight', size / 4)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', d3.line()(arrowPoints))
                    .attr('stroke', 'red')
                    .attr("stroke-width", 2)
                    .attr("fill", "none");

                // const colorScale = d3.scaleThreshold()
                //     .domain(props.areas.map(d => d.end))
                //     .range(props.areas.map(d => colors[d.name]).concat(["black"]));

                // const barcolors = ["#4daf4a", "#999999", "#e41a1c"];
                candles.append("rect")
                    // .attr("y1", i => yScale(Yo[i]))
                    // .attr("y2", i => yScale(Yc[i]))
                    // .attr("stroke-width", size)

                    .attr("x", -size*0.5)
                    .attr("y", (d, i) => Math.min(yScale(Yo[i]), yScale(Yc[i])))
                    .attr("width", size)
                    .attr("height", (d, i) => Math.abs(yScale(Yc[i]) - yScale(Yo[i])))
                    .attr("fill", "#aaa")
                    .on("mouseover", function(event, i) {
                        handleMouseOverCandle.call(this, event, props.data[i], interpretationScale);
                    })
                    .on("mouseout", handleMouseOut)

                // g.append("line")
                //     .attr("y1", i => yScale(Yo[i]))
                //     .attr("y2", i => yScale(Yc[i]))
                //     .attr("stroke-width", size)
                //     // .attr('marker-end', 'url(#arrow)')
                //     .attr("stroke", "#aaa")//i => barcolors[1 + Math.sign(Yo[i] - Yc[i])]);
                    // .attr("stroke", i => colorScale(props.data[i].best_val_a))

                candles.append("polyline")
                    .filter(i => Math.abs(yScale(Yo[i])-yScale(Yc[i])+size*0.1) > size)
                    .attr("points", i => {
                        const m = yScale(Yo[i]) < yScale(Yc[i]) ? -1 : 1;
                        let ys = d3.range(yScale(Yc[i])+size*0.6*m, yScale(Yo[i]) + size*m*0.5, size*m).reverse();
                        return ys.map(d => "0,"+d).join(" ");
                    })
                    .attr("stroke-width", 3)
                    // .attr('marker-start', 'url(#arrow)')
                    .attr('marker-mid', i => yScale(Yo[i]) < yScale(Yc[i]) ? 'url(#arrow_red)' : 'url(#arrow_green)')
                    .attr('marker-end', i => yScale(Yo[i]) < yScale(Yc[i]) ? 'url(#arrow_red)' : 'url(#arrow_green)')
                    .attr("stroke", "none");
                    // .attr("stroke", i => barcolors[1 + Math.sign(Yo[i] - Yc[i])]);

                ///////////////////
                // Add Datapints //
                ///////////////////
                const colorScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => d.end))
                    .range(props.areas.map(d => colors[d.name]).concat(["black"]));

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
            watch(() => props.data, draw);
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
