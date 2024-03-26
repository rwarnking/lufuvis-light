<!-- Layout -->
<template>
    <g ref="chart" class="slope"></g>
</template>


<!-- Code behind -->
<script>
    import * as d3 from "d3";
    import { handleMouseOverPrePost, handleMouseOut } from "@/components/event-handler-collection"
    import { useApp } from "@/store/app";
    import { ref, onMounted, defineComponent, watch } from "vue";

    export default defineComponent({

        props: {

            data: {
                type: Object,
                required: true
            },

            xScale: {
                type: Function,
                required: true,
            },

            x: {
                type: Function,
                required: true
            },

            y1: {
                type: Function,
                required: true
            },

            y2: {
                type: Function,
                required: true
            },

            size: {
                type: Number,
                default: 100
            },

            offset: {
                type: Number,
                default: 0
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
            time: {
                type: Number,
            },
            simTime: {
                type: Number,
            },
        },

        setup(props) {
            const chart = ref(null);
            const bnl = useApp();

            const circleHeight = 15;
            const size = props.size - props.offset - circleHeight;

            // let triangle;

            // function xPos(value, scale=props.xScale, limited=true) {
            //     let x = scale(value) - size*0.5;
            //     if (limited && x < scale.range()[0]) {
            //         return scale.range()[0];
            //     }
            //     if (limited && x + size > scale.range()[1]) {
            //         return scale.range()[1] - size;
            //     }
            //     return x;
            // }

            // Update the bars in the bar chart.
            function draw() {
                const theg = d3.select(chart.value);
                theg.selectAll('*').remove();
                theg.attr("transform", `translate(${props.data.x},${props.offset})`);
                const g = theg.append('g')

                // Compute values.
                const R = props.data.recommended;
                const toPercentage = (val) => {
                    const divider = props.percentage ? R : 100.0;
                    return val / divider * 100.0
                }

                // const X = d3.map(props.data, props.x);
                const Y1 = toPercentage(props.y1(props.data));
                const Y2 = toPercentage(props.y2(props.data));
                // const I = d3.range(props.data.length);
                // const D = props.data;

                // Compute default domains.
                // const xDomain = d3.extent(X);
                // const xDomain = [0, 1];
                const puffer = (Math.max(Y1, Y2) - Math.min(Y1, Y2)) * 0.1
                const yDomain = props.yDomain === undefined ?
                    [Math.min(Y1, Y2)-puffer, Math.max(Y1, Y2)+puffer] :
                    [toPercentage(props.yDomain[0]), toPercentage(props.yDomain[1])];

                // TODO
                // xDomain[0] -= 0.1;
                // xDomain[1] += 0.1;

                // const xRange = [0, size];
                const yRange = [size, 0];

                // Construct scales and axes.
                // const xScale = d3.scaleUtc()
                //     .domain(xDomain)
                //     .nice()
                //     .range(xRange);
                const yScale = d3.scaleLinear(yDomain, yRange);

                // const yAxis = d3.axisLeft(yScale)
                //     .tickValues(props.areas.map(d => toPercentage(d.start)))

                const toDateString = d => {
                    return d.toLocaleDateString('en-EN', { dateStyle: "medium" })
                }
                g.append("text")
                    .attr("font-size", 9)
                    .attr("x", size*0.5)
                    .attr("y", -1)
                    .attr("text-anchor", "middle")
                    .text(toDateString(props.x(props.data)))

                ///////////////
                // Add Areas //
                ///////////////

                let res = props.areas;
                res.sort((a, b) => a.start - b.start)

                g.append("g")
                    .selectAll("rect")
                    .data(res
                        .filter(d =>
                            yScale(toPercentage(d.start)) > yRange[1] &&
                            yScale(toPercentage(d.end)) < yRange[0]
                        )
                    )
                    .join("rect")
                    .attr("x", 0)
                    .attr("y", d => Math.max(yRange[1], yScale(toPercentage(d.end))))
                    .attr("width", size)
                    .attr("height", d => Math.min(yRange[0], yScale(toPercentage(d.start)))-Math.max(yRange[1],yScale(toPercentage(d.end))))
                    .attr('fill-opacity', 0.33)
                    .attr("fill", d => d.color)

                // AddAreas(svg, areas, xScale, yScale);

                ///////////////
                // Add Lines //
                ///////////////
                // Construct a line generator.
                // let quotient = Math.min(
                //     (
                //         (props.xScale(props.x(props.data)) -
                //         props.xScale.range()[0])
                //     ) / size,
                //     0.5
                // );
                // quotient = Math.max(quotient,
                //     (props.xScale(props.x(props.data)) -
                //     props.xScale.range()[1] + size) / size
                // );

                const xscale = bnl.detailZoom
                    .rescaleX(props.xScale)
                    .interpolate(d3.interpolateRound)
                let blub = xscale(props.x(props.data)) - props.data.x;

                // triangle = g.append("path")
                g.append("path")
                    .classed("triangle", true)
                    .attr("fill", "lightgray")
                    .attr("d", `
                        M${0}
                        ${yRange[0]}
                        L${size}
                        ${yRange[0]}
                        L${blub}
                        ${yRange[0] + circleHeight}
                        Z
                    `)

                g.append("line")
                    .classed("dataline", true)
                    .attr("x1", size * 0.25)
                    .attr("y1", yScale(Y1))
                    .attr("x2", size * 0.75)
                    .attr("y2", yScale(Y2));


                // const line2 = d3.line()
                //     .defined(i => D[i])
                //     .curve(d3.curveLinear)
                //     .x(i => xScale(X[i]))
                //     .y(i => yScale(toPercentage(R[i])));
                // svg.append("path")
                //     .classed("recommendation-line", true)
                //     .classed("zoomable", true)
                //     .attr("fill", "none")
                //     .attr("d", line2(I));

                // AddRecommendationLine(svg, lineThreshold, xScale, yScale)

                ///////////////////
                // Add Datapoints //
                ///////////////////
                const colorScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => toPercentage(d.end)))
                    .range(props.areas.map(d => d.color));

                const interpretationScale = d3.scaleThreshold()
                    .domain(props.areas.map(d => toPercentage(d.end)))
                    .range(props.areas.map(d => d.name));

                const datadots = g.append("g")
                    .classed("zoomable", true)

                const preTooltip = {
                    "pp": "PRE",
                    "recommended": props.data.recommended,
                    "abs": props.data.pre_val_a,
                    "%": Math.round(props.data.pre_val_a / props.data.recommended * 100.0),
                    "interpretation": interpretationScale(Y1)
                }

                const postTooltip = {
                    "pp": "POST",
                    "recommended": props.data.recommended,
                    "abs": props.data.post_val_a,
                    "%": Math.round(props.data.post_val_a / props.data.recommended * 100.0),
                    "interpretation": interpretationScale(Y2)
                }

                datadots
                    .append("circle")
                    .classed("pre-data", true)
                    .style("stroke-dasharray", 3)
                    .attr("cx", size * 0.25)
                    .attr("cy", yScale(Y1))
                    .attr("fill", colorScale(Y1))
                    .attr("r", 5.0)
                    .on("mouseover", function(event) {
                        handleMouseOverPrePost.call(this, event, preTooltip);
                    })
                    .on("mouseout", handleMouseOut)

                datadots
                    .append("circle")
                    .classed("post-data", true)
                    .attr("cx", size * 0.75)
                    .attr("cy", yScale(Y2))
                    .attr("fill", colorScale(Y2))
                    .attr("r", 5.0)
                    .on("mouseover", function(event) {
                        handleMouseOverPrePost.call(this, event, postTooltip);
                    })
                    .on("mouseout", handleMouseOut)
            }

            function update() {
                const xscale = bnl.detailZoom
                    .rescaleX(props.xScale)
                    .interpolate(d3.interpolateRound)
                let blub = xscale(props.x(props.data)) - props.data.x;

                // triangle = g.append("path")
                d3.select(chart.value)
                    .attr("transform", `translate(${props.data.x},${props.offset})`)
                    .select(".triangle")
                    .attr("d", `
                        M${0}
                        ${size}
                        L${size}
                        ${size}
                        L${blub}
                        ${size + circleHeight}
                        Z
                    `)
            }

            // Watch some of our properties to automatically refresh the
            // D3 diagram.
            // function zoomed(transform) {
            //     const zx = transform.rescaleX(props.xScale)
            //         .interpolate(d3.interpolateRound);

            //     d3.select(chart.value)
            //         .attr("transform", `translate(${zx(props.x(props.data))},${props.offset})`)

            //     // triangle.attr("d", `
            //     //     M${0}
            //     //     ${size}
            //     //     L${size}
            //     //     ${size}
            //     //     L${0.5 * size}
            //     //     ${size + circleHeight}
            //     //     Z
            //     // `)

            //     let blub = zx(props.x(props.data)) - props.data.x;

            //     triangle.attr("d", `
            //         M${0}
            //         ${size}
            //         L${size}
            //         ${size}
            //         L${blub}
            //         ${size + circleHeight}
            //         Z
            //     `)
            // }

            // watch(() => bnl.zoomEndTime, function() {
            //     myTransform = bnl.detailZoom;
            //     // zoomed(bnl.detailZoom);
            // });
            watch(() => props.time, draw);
            watch(() => props.simTime, update);
            watch(() => props.yDomain, draw, { deep: true });

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
