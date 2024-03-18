<!-- Layout -->
<template>
    <svg ref="chart"></svg>
</template>


<!-- Code behind -->
<script>
    import * as d3 from "d3";
    import { v4 as uuidv4 } from 'uuid';
    import { handleMouseOverObs, handleMouseOut } from "@/components/event-handler-collection"

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
                        bottom: 0,
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

        },

        setup(props) {
            // The template reference to bind the histogram to.
            const chart = ref(null);
            const bnl = useApp();

            let dCircle, dLines, mRect, yRect;
            let xScale;

            const cRadius = 5;

            // Update the bars in the bar chart.
            function draw() {

                const svg = d3.select(chart.value);
                svg.selectAll('*').remove();

                // Compute values.
                props.data.forEach((d, i) => d.id = i);
                const X = d3.map(props.data, props.x);
                const Y = d3.map(props.data, props.y);
                // const I = d3.range(X.length);
                // const D = props.data;

                // Compute default domains.
                const xDomain = d3.extent(X);
                const yDomain = [0, d3.max(Y)];

                const xRange = [
                    props.margin.left, props.width - props.margin.right];
                const yRange = [props.height - props.margin.bottom, props.margin.top + cRadius * 2.1];

                // Construct scales and axes.
                xScale = props.xType()
                    .domain(xDomain)
                    .nice()
                    .range(xRange);
                const yScale = props.yType(yDomain, yRange);

                // const xAxis = d3.axisBottom(xScale)
                //     .tickValues(data.map(x))
                //     .tickFormat(d3.timeFormat("%B %d, %Y"));

                // const xAxis = d3.axisBottom(xScale)
                //     .tickValues(data.map(props.x))
                //     .tickFormat(d3.timeFormat("%B %d"));
                // const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

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
                    .attr("y", yScale.range()[1] - cRadius * 2)
                    .attr("width", xScale.range()[1]-xScale.range()[0])
                    .attr("height", Math.abs(yScale.range()[0]-yScale.range()[1]) + cRadius * 2);

                svg.attr("clip-path", `url(#${clip})`)

                //////////
                // Data //
                //////////
                const rectHeight = 10;
                const tmp1 = d3.map(props.data, d => {
                    return props.x(d).getFullYear();
                });

                // Remove doubles
                const tmp2 = [...new Set(tmp1)];

                const years = d3.map(tmp2, d => {
                    // const y = x(d).getFullYear();
                    return {
                        "start": new Date(d.toString()),
                        "end": new Date((d + 1).toString())
                    }
                });

                let month = [];
                years.forEach(y => {
                    let y_string = y["start"].getFullYear().toString();
                    for (let i=0; i < 12; i++) {
                        if (xScale(new Date(y_string, i + 1)) > xScale.range()[0] &&
                            xScale(new Date(y_string, i)) < xScale.range()[1] - 10
                        ) {
                            month.push({
                                "start": new Date(y_string, i),
                                "end": new Date(y_string, i + 1)
                            })
                        }
                    }
                })

                //////////////////
                // Add Yearband //
                //////////////////
                yRect = svg.append("g")
                    .attr("transform", `translate(0, ${props.height - props.margin.bottom - rectHeight})`)
                    .selectAll("rect")
                    .data(years)
                    .enter("rect")

                yRect.append("rect")
                    .attr("x", d => Math.max(xScale.range()[0], xScale(d.start)))
                    .attr("y", 0)
                    .attr("width", d => Math.max(0,
                        Math.min(
                            xScale(d.end) - Math.max(xScale.range()[0], xScale(d.start)),
                            xScale.range()[1] - Math.max(xScale.range()[0], xScale(d.start))
                        )
                    ))
                    .attr("height", rectHeight)
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)

                yRect.append("text")
                    .style("fill", "black")
                    .style("font-size", rectHeight)
                    .attr("text-anchor", "middle")
                    .attr("x", d => {
                        return Math.max(xScale.range()[0], xScale(d.start)) +
                        Math.min(
                            xScale(d.end) - Math.max(xScale.range()[0], xScale(d.start)),
                            xScale.range()[1] - Math.max(xScale.range()[0], xScale(d.start))
                        ) * 0.5
                    })
                    .attr("y", rectHeight - 1)
                    .text(d => d.start.getFullYear());

                ///////////////////
                // Add Monthband //
                ///////////////////
                const samples = [0.5, 0.75, 1]
                // spring - "#85b746"
                const spring = samples.map(d3.scaleSequential().range(["#fff","#85b746"]))
                // summer - "#f0e42c"
                const summer = samples.map(d3.scaleSequential().range(["#fff","#f0e42c"]))
                // autumn - "#e66422"
                const autumn = samples.map(d3.scaleSequential().range(["#fff","#e66422"]))
                // winter - "#00579c"
                const winter = samples.map(d3.scaleSequential().range(["#fff","#0081e8"]))
                const monthToSeason = (m) => {
                    switch(m) {
                        case 11: return winter[0];
                        case 0: return winter[1];
                        case 1: return winter[2];
                        case 2: return spring[0];
                        case 3: return spring[1];
                        case 4: return spring[2];
                        case 5: return summer[0];
                        case 6: return summer[1];
                        case 7: return summer[2];
                        case 8: return autumn[0];
                        case 9: return autumn[1];
                        case 10: return autumn[2];
                    }
                };

                const STR_MONTH = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];

                let monthColor = d3.scaleOrdinal()
                    .domain(d3.range(12))
                    .range(d3.range(12).map(monthToSeason));

                mRect = svg.append("g")
                    .attr("transform", `translate(0, ${props.height - props.margin.bottom - rectHeight * 2})`)
                    .selectAll("rect")
                    .data(month)
                    .enter("rect")

                mRect.append("rect")
                    // .classed("zoomable", true)
                    .attr("x", d => Math.max(xScale.range()[0], xScale(d.start)))
                    .attr("y", 0)
                    .attr("width", d => Math.max(0,
                        Math.min(
                            xScale(d.end) - Math.max(xScale.range()[0], xScale(d.start)),
                            xScale.range()[1] - Math.max(xScale.range()[0], xScale(d.start))
                        )
                    ))
                    .attr("height", rectHeight)
                    // .attr("fill", d => monthColor(d.end.getMonth()))
                    .attr("fill", d => "white")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)

                mRect.append("text")
                    .style("fill", "black")
                    .style("font-size", rectHeight)
                    .attr("text-anchor", "middle")
                    .attr("x", d => {
                        return Math.max(xScale.range()[0], xScale(d.start)) +
                        Math.min(
                            xScale(d.end) - Math.max(xScale.range()[0], xScale(d.start)),
                            xScale.range()[1] - Math.max(xScale.range()[0], xScale(d.start))
                        ) * 0.5
                    })
                    .attr("y", rectHeight - 1)
                    .text(d => STR_MONTH[d.start.getMonth()]);

                ////////////////////
                // Vertical lines //
                ////////////////////
                dLines = svg.append("g")
                    .attr("stroke", "lightgray")
                    .selectAll("line")
                    .data(props.data)
                    .join("line")
                    .classed("zoomable", true)
                    .attr("y1", yScale.range()[0])
                    .attr("x1", d => xScale(props.x(d)))
                    .attr("y2", yScale.range()[1])
                    .attr("x2", d => xScale(props.x(d)));

                ///////////////////
                // Add Datapoints //
                ///////////////////
                dCircle = svg.selectAll("circle")
                    .data(props.data)
                    .join("g")
                dCircle
                    .attr("data-id", (d, i) => i)
                    .on("mouseover", function(event, d) {
                        bnl.setHighlightedObs(d.id);
                        handleMouseOverObs.call(this, event, d);
                    })
                    .on("mousedown", function(_, d) {
                        bnl.setSelectedObs(d.id);
                    })
                    .on("mouseout", function() {
                        bnl.resetHighlightedObs();
                        handleMouseOut();
                    })

                dCircle.append("circle")
                    .classed("time-circle", true)
                    .classed("zoomable", true)
                    .attr("data-id", (d, i) => i)
                    .attr("cx", (d, i) => xScale(X[i]))
                    .attr("cy", (d, i) => yScale(Y[i]))
                    .attr("fill", "lightgray")
                    .attr("r", cRadius)

                dCircle.append("text")
                    .style("font-size", rectHeight)
                    .attr("text-anchor", "middle")
                    .attr("x", (d, i) => xScale(X[i]))
                    .attr("y", (d, i) => yScale(Y[i]) + 4)
                    .text((d, i) => X[i].getDate() + ".")
            }

            function zoomed(transform) {
                const zx = transform.rescaleX(xScale)
                    .interpolate(d3.interpolateRound);

                // move circles
                dCircle.selectAll("circle").attr("cx", d => zx(props.x(d)))
                dCircle.selectAll("text").attr("x", d => zx(props.x(d)))
                // dCircle.attr("transform", d => `translate(${zx(props.x(d))}, 0)`)
                // move lines
                dLines
                    .attr("x1", d => zx(props.x(d)))
                    .attr("x2", d => zx(props.x(d)))

                // mRect.attr("transform", transform)

                mRect.selectAll("rect")
                    .attr("x", d => Math.max(zx.range()[0], zx(d.start)))
                    .attr("width", d => Math.max(0,
                        Math.min(
                            zx(d.end) - Math.max(zx.range()[0], zx(d.start)),
                            zx.range()[1] - Math.max(zx.range()[0], zx(d.start))
                        )
                    ))

                mRect.selectAll("text")
                    .attr("x", d => {
                        return Math.max(zx.range()[0], zx(d.start)) +
                        Math.min(
                            zx(d.end) - Math.max(zx.range()[0], zx(d.start)),
                            zx.range()[1] - Math.max(zx.range()[0], zx(d.start))
                        ) * 0.5
                    })

                yRect.selectAll("rect")
                    .attr("x", d => Math.max(zx.range()[0], zx(d.start)))
                    .attr("width", d => Math.max(0,
                        Math.min(
                            zx(d.end) - Math.max(zx.range()[0], zx(d.start)),
                            zx.range()[1] - Math.max(zx.range()[0], zx(d.start))
                        )
                    ))

                yRect.selectAll("text")
                    .attr("x", d => {
                        return Math.max(zx.range()[0], zx(d.start)) +
                        Math.min(
                            zx(d.end) - Math.max(zx.range()[0], zx(d.start)),
                            zx.range()[1] - Math.max(zx.range()[0], zx(d.start))
                        ) * 0.5
                    })

            }

            function highlightDate(id) {
                if (id === null){
                    dCircle
                        .selectAll("circle")
                        .filter(":not(.clicked)")
                        .classed("hovered", false)
                        .transition()
                        .duration(100)
                        .attr("r", cRadius)
                } else {
                    dCircle
                        .selectAll("circle")
                        .filter(d => d.id === id)
                        .classed("hovered", true)
                        .transition()
                        .duration(100)
                        .attr("r", cRadius * 2)
                }
            }

            function selectDate(id) {
                dCircle.selectAll("circle")
                    .filter(d => d.id !== id)
                    .classed("clicked", false)
                    .transition()
                    .duration(100)
                    .attr("r", cRadius)
                dCircle.selectAll("circle")
                    .filter(d => d.id === id)
                    .classed("clicked", true)
            }

            // Watch some of our properties to automatically refresh the
            // D3 diagram.
            watch(() => bnl.highlightedObs, highlightDate);
            watch(() => bnl.selectedObs, selectDate);
            watch(() => bnl.detailZoom, zoomed);

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
