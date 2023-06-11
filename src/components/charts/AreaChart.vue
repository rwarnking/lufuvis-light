<!-- Layout -->
<template>
    <g ref="chart" :transform="`translate(0,${offset})`"></g>
</template>


<!-- Code behind -->
<script>
    import * as d3 from "d3";

    import { useApp } from "@/store/app";
    import { ref, onMounted, defineComponent, watch } from "vue";

    export default defineComponent({

        props: {

            data: {
                type: Array,
                required: true
            },

            id: {
                type: String,
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

            yLabel: {
                type: String,
                required: true
            },

            margin: {
                type: Object,
                default: () => {
                    return {
                        top: 10,
                        bottom: 10,
                        left: 20,
                        right: 20
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

            let circles, selectedText, hoverText;
            const radius = 2;

            function index() {
                return bnl.viewOrder.findIndex(d => d.id === props.id);
            }
            const offset = index()*props.height;

            // Update the bars in the bar chart.
            function draw() {

                const svg = d3.select(chart.value);
                svg.selectAll('*').remove();

                // Compute values
                props.data.forEach((d, i) => d.id = i);
                const X = d3.map(props.data, props.x);
                const Y = d3.map(props.data, props.y);
                const I = d3.range(X.length);
                const D = props.data;

                // Compute default domains.
                const xDomain = d3.extent(X);
                const yDomain = [0, d3.max(Y)];

                const textHeight = Math.max(20, Math.min(props.width / 3, props.height / 2.35));
                const xRange = [
                    props.margin.left, props.width - props.margin.right];
                const yRange = [props.height - props.margin.bottom, props.margin.top + textHeight];

                // Construct scales and axes.
                const xScale = props.xType(xDomain, xRange);
                const yScale = props.yType(yDomain, yRange);

                // svg.attr("width", props.width)
                //     .attr("height", props.height)
                //     .attr("viewBox", [0, 0, props.width, props.height])
                //     .attr("style", "max-width: 100%; height: auto; height: intrinsic;");


                // const textwidth = Math.min(props.width / 4, props.height / 4);
                const g2 = svg.append("g")
                    .attr("transform", `translate(${props.margin.left}, 0)`)

                const fBig = textHeight/2.25;
                //////////////
                // Add text //
                //////////////
                g2.append("text")
                    .text(props.yLabel)
                    .attr("font-size", fBig)
                    .attr("y", fBig+5)
                selectedText = g2.append("text")
                    .attr("font-size", fBig*0.5)
                    .attr("y", (fBig+5)*1.5)
                    .text("selected: none")
                hoverText = g2.append("text")
                    .attr("font-size", fBig*0.5)
                    // .attr("fill", "#777")
                    .attr("y", (fBig+5)*1.5 + fBig*0.5)
                    .text("hovered: none")

                ///////////////
                // Fill area //
                ///////////////
                // Construct an area generator.
                const area = d3.area()
                    .defined(i => D[i])
                    .x(i => xScale(X[i]))
                    .y0(yScale(0))
                    .y1(i => yScale(Y[i]));

                let svgy = offset;
                let offy = 0, moved = false;
                svg.append("path")
                    .classed("sm-area", true)
                    .attr("d", area(I))

                svg
                    .classed("sm-deselected", !bnl.selectedViews[props.id])
                    .style("cursor", "pointer")
                    // .on("dblclick", () => {})
                    .call(d3.drag()
                        .on("start", (event) => offy = event.y % props.height)
                        .on("drag", (event) => (svgy = event.y - offy))
                        .on("drag.update", function() {
                            moved = true;
                            svg.raise().attr("transform", `translate(0,${svgy})`);
                        })
                        .on("end.update", () => {
                            if (moved) {
                                moved = false;
                                bnl.updateViewOrder(props.id, svgy)
                            } else {
                                bnl.selectView(props.id, !bnl.selectedViews[props.id]);
                            }
                        })
                    )

                ///////////////
                // Add Lines //
                ///////////////
                // Construct a line generator.
                const line = d3.line()
                    .x(i => xScale(X[i]))
                    .y(i => yScale(Y[i]));

                svg.append("path")
                    .classed("dataline", true)
                    .attr("fill", "none")
                    .attr("d", line(I));

                ///////////////////
                // Add Datapints //
                ///////////////////
                circles = svg.append("g")
                    .selectAll("circle")
                    .data(props.data)
                    .join("circle")
                    .classed("small-multiple-p", true)
                    .attr("data-id", (d, i) => i)
                    .attr("cx", (d, i) => xScale(X[i]))
                    .attr("cy", (d, i) => yScale(Y[i]))
                    .attr("r", radius)
            }

            function toggleSelect() {
                d3.select(chart.value)
                    .classed("sm-deselected", !bnl.selectedViews[props.id]);
            }

            function highlightDate(id) {
                if (id === null) {
                    circles.filter(":not(.clicked)")
                        .classed("hovered", false)
                        .transition()
                        .duration(100)
                        .attr("r", radius)
                } else {
                    circles.filter(d => d.id === id)
                        .classed("hovered", true)
                        .transition()
                        .duration(100)
                        .attr("r", radius * 2.0)
                }

                const hovered = bnl.highlightedObs;
                hoverText.text("hovered: " + (hovered !== null ? Math.round(props.data[hovered].best_val_n * 100) / 100 : "none"))
            }

            function selectDate(id) {
                circles.filter(d => d.id !== id)
                    .classed("clicked", false)
                    .transition()
                    .duration(100)
                    .attr("r", radius)
                circles.filter(d => d.id === id)
                    .classed("clicked", true)
                    .transition()
                    .duration(100)
                    .attr("r", radius * 2.0)

                const selection = bnl.selectedObs;
                selectedText.text("selected: "+Math.round(props.data[selection].best_val_n * 100) / 100)
            }

            function updatePosition(order) {
                const index = order.findIndex(d => d.id === props.id);
                if (index >= 0) {
                    order[index].position = index * props.height;
                    d3.select(chart.value)
                        .transition()
                        .duration(100)
                        .attr("transform", `translate(0,${order[index].position})`);
                }
            }

            // Watch some of our properties to automatically refresh the
            // D3 diagram.
            watch(() => bnl.selectedViews[props.id], toggleSelect);
            watch(() => bnl.viewOrder, updatePosition, { deep: true });
            watch(() => bnl.highlightedObs, highlightDate);
            watch(() => bnl.selectedObs, selectDate);

            // Issue the load request once the component is ready.
            onMounted(draw);

            return {
                chart,
                offset,
                                draw
            };
        },
    })
</script>


<!-- Local styles -->
<style>
    .sm-deselected {
        opacity: 0.2;
    }
</style>
