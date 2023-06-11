<!-- Layout -->
<template>
    <div>
        <svg ref="chart">
            <g class="toplevel">
                <SlopeChart v-for="(item, index) in blabla"
                    :data="item"
                    :key="index"
                    :xScale="xScale"
                    :x="access.x"
                    :y1="access.y1"
                    :y2="access.y2"
                    :yDomain="yDomain"
                    :size="height"
                    :offset="10"
                    :areas="areas"
                    :percentage="percentage"
                />
            </g>
        </svg>
    </div>
</template>

<!-- Code behind -->
<script>
    import * as d3 from "d3";
    import SlopeChart from "./charts/SlopeChart";

    import { useApp } from "@/store/app";
    import { ref, defineComponent, onMounted, computed, watch, reactive } from "vue";
    import { v4 as uuidv4 } from "uuid";

    export default defineComponent({
        // Specifies the components used by this one.
        components: {
            SlopeChart
        },

        props: {

            id: {
                type: String,
                required: true
            },
            data: {
                type: Array,
                required: true
            },
            xScale: {
                type: Function,
                required: true
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

        // Initialises a new instance.
        setup(props) {
            const chart = ref(null);
            // Get access to parts that we need in our properties and functions.

            const bnl = useApp();

            const access = {
                x: d => new Date(d.date),
                y1: d => d.pre_val_a,
                y2: d => d.post_val_a,
            };
            const clip = uuidv4();

            const sim = reactive({
                data: []
            });
            const initial = ref([]);

            const blabla = computed(function() {
                return sim.data.filter((_, i) => i % 2 === 0);
            })
            const radius = computed(() => props.height * 0.5);

            const myforce = function(alpha) {
                for (let j = 0; j < 5; ++j) {
                    sim.data.forEach((d, i) => {

                        // use this to prevent vis from leaving the visible
                        // part of the chart

                        // if (d.fx === undefined && d.x < 10) {
                        //     d.vx += d.x * alpha * 1;
                        // } else if (d.fx === undefined && d.x > props.width-radius.value*2+15) {
                        //     d.vx = 0;
                        //     d.x = props.width-radius.value*2+15;
                        // } else if (d.fx === undefined) {

                        if (d.fx === undefined) {
                            const sign = d.x < initial.value[i] ? 1 : -1;
                            const dist = Math.abs(d.x-initial.value[i]);
                            d.vx += sign * dist * alpha * 0.01;
                        }
                    })
                }
            };

            const prevTansform = ref(d3.zoomIdentity);

            // let size = 100;
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

            // Initialise the UI once it is realised.
            onMounted(async () => {
                const svg = d3.select(chart.value);

                //////////////
                // Main svg //
                //////////////
                svg
                    .attr("width", props.width)
                    .attr("height", props.height)
                    .attr("viewBox", [0, 0, props.width, props.height])
                    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

                // append clip path (necessary for zooming)
                svg.insert("clipPath", "g")
                    .attr("id", clip)
                    .append("rect")
                    .attr("x", props.xScale.range()[0])
                    .attr("y", 0)
                    .attr("width", props.xScale.range()[1]-props.xScale.range()[0])
                    .attr("height", props.height);

                svg.select("g.toplevel")
                    .attr("clip-path", `url(#${clip})`)

                const links = [];
                initial.value = [];

                props.data.forEach(d => {
                    initial.value.push(props.xScale(access.x(d)) - radius.value + 10);
                    initial.value.push(initial.value[initial.value.length-1]);
                    sim.data.push(Object.assign({
                        x: initial.value[initial.value.length-1],
                        y: radius.value,
                        fy: radius.value,
                        r: radius.value
                    }, d))


                    sim.data.push(Object.assign({
                        x: initial.value[initial.value.length-1],
                        fx: initial.value[initial.value.length-1],
                        y: -radius.value,
                        fy: -radius.value,
                        r: radius.value
                    }, d))

                    links.push({
                        source: sim.data[sim.data.length - 2],
                        target: sim.data[sim.data.length - 1]
                    })
                });

                // compData.value.forEach(d => {
                //     if (d.x + radius.value * 2.0 + 10 > props.width) {
                //         d.x = props.width - radius.value * 2.0 + 10;
                //     }
                // })

                // let collisionList = []
                // do {
                //     for (let i = 0; i < compData.value.length; i++) {
                //         if (compData.value[i] + radius.value * 2.0 + 10 > compData.value[i + 1]) {
                //             collisionList.push(i)
                //         } else if (compData.value[i - 1] + radius.value * 2.0 + 10 > compData.value[i]) {
                //             collisionList.push(i)
                //         }
                //     }
                // } while (collisionList.length > 0);

                // add links between neighboring nodes
                for (let i = 0; i < sim.data.length-2; i+=2) {
                    if (sim.data[i+2].x - sim.data[i].x < radius.value*2) {
                        links.push({
                            source: sim.data[i],
                            target: sim.data[i+2]
                        })
                    }
                }

                // const nodes = props.data.map(Object.create);
                // const simulation =
                d3.forceSimulation(sim.data)
                    .alphaMin(0.4)
                    .force("myforce", myforce)
                    .force("collide", d3.forceCollide().radius(d => d.r-10).strength(1))
            });

            // Watch some of our properties to automatically refresh the
            // D3 diagram.
            function zoomed(transform) {
                const zx = transform.rescaleX(props.xScale)
                    .interpolate(d3.interpolateRound);


                // d3.select(chart.value)
                //     .attr("transform", `translate(${xPos(props.x(props.data), zx, false)},${props.offset})`)


                // const myforce = function(alpha) {
                //     for (let j = 0; j < 5; ++j) {
                //         compData.value.forEach((d, i) => {
                //             if (d.fx === undefined && d.x < 10) {
                //                 d.vx += d.x * alpha * 1;
                //                 // d.x = radius.value;
                //             } else if (d.fx === undefined && d.x > props.width-radius.value*2+15) {
                //                 // d.vx -= d.x * alpha * 1;
                //                 d.vx = 0;
                //                 d.x = props.width-radius.value*2+15;
                //             } else if (d.fx === undefined) {
                //                 const sign = d.x < initial[i] ? 1 : -1;
                //                 const dist = Math.abs(d.x-initial[i]);
                //                 d.vx += sign * dist * alpha * 0.01;
                //             }
                //         })
                //     }
                // }
                // if (prevTansform.value.k !== transform.k) {
                    sim.data.forEach((d, i) => {
                        d.x = zx(access.x(d)) - radius.value + 10;
                        initial.value[i] = d.x;
                        d.vx = 0;
                        d.vy = 0;
                        // d.y = radius.value,
                        // d.fy = radius.value,
                        // d.r = radius.value
                        if (i % 2 === 1) d.fx = d.x
                    })
                    d3.forceSimulation(sim.data)
                        .alphaMin(0.4)
                        .force("myforce", myforce)
                        .force("collide", d3.forceCollide().radius(d => d.r-10).strength(1))
                        // .on("end", function() {
                        //     console.log(sim.data[sim.data.length-2].x);
                        // })
                // }
            }

            function toggle() {
                const show = bnl.detailsVisible.get(props.id) === true;
                d3.select(chart.value.parentNode).classed("nothere", show ? null : true)
            }

            watch(() => bnl.detailsVisible, toggle, { deep: true })

            watch(() => bnl.zoomEndTime, function() {
                if (prevTansform.value.k !== bnl.detailZoom.k) {
                    prevTansform.value = bnl.detailZoom
                    zoomed(bnl.detailZoom);
                }
            });
            watch(() => bnl.detailZoom, function(transform) {
                if (prevTansform.value.k === transform.k) {
                    sim.data.forEach((d,i) => {
                        d.x += (transform.x-prevTansform.value.x);
                        if (i % 2 === 1) d.fx = d.x
                    });
                    prevTansform.value = transform
                }
            });

            return {
                chart,
                access,
                sim,
                blabla,
                prevTansform,
            };
        }
    })
</script>


<!-- Local styles -->
<style scoped>

    .nothere {
        display: none;
    }

    .detail-chart {
        width: 100%;
        text-align: left;
        display: grid;
    }

    div.svg-tooltip {
        position: fixed;
        text-align: center;
        padding: .2rem;
        background: #313639;
        color: #f9f9f9;
        border: 0px;
        border-radius: 8px;
        pointer-events: none;
        font-size: .7rem;
        word-wrap: break-word;
        z-index: 2;
    }

    .dataline {
        stroke: black;
        stroke-width: 1.5;
        stroke-opacity: 1;
        stroke-linecap: "round";
        stroke-linejoin: "round";
    }

    .recommendation-line {
        stroke: darkgreen;
        stroke-width: 1.5;
        stroke-opacity: 1;
        stroke-linecap: "round";
        stroke-linejoin: "round";
    }

    circle {
        stroke: black;
        stroke-width: 1;
    }
</style>
