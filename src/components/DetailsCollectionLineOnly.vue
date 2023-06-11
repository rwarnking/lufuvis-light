<!-- Layout -->
<template>
    <div class="detail-chart">
        <div v-for="item in selMeasures" :key="item.id">
            <h3>{{item.data.display}}</h3>
            <h6 v-if="item.data.percentage">in % of recommended</h6>
            <h6 v-if="!item.data.percentage">in {{item.data.unit}}</h6>
            <LineChart
                :data="item.data.values"
                :key="item.id"
                :x="item.x"
                :y="item.y"
                :yDomain="item.data.ydomain"
                :yLabel="item.data.display"
                :yLabelShort="item.data.display_short"
                :margin="margins"
                :width="width"
                :height="125"
                :areas="item.data.areas"
                :percentage="item.data.percentage"
            />
        </div>
    </div>
</template>

<!-- Code behind -->
<script>
    import LineChart from "./charts/LineChart";
    import axios from "axios";
    import { useApp } from "@/store/app";
    import { defineComponent, onMounted, reactive, computed, watch } from "vue";

    export default defineComponent({
        // Specifies the components used by this one.
        components: {
            LineChart,
        },

        props: {
            width: {
                type: Number,
                default: 800
            }
        },

        // Initialises a new instance.
        setup() {
            // Get access to parts that we need in our properties and functions.
            const bnl = useApp();

            const measures = reactive([]);
            const selMeasures = computed(() => {
                return measures.filter(d => bnl.selectedViews[d.id]);
            })

            const margins = {
                top: 0,
                bottom: 10,
                left: 40,
                right: 10
            };

            // Initialise the UI once it is realised.
            onMounted(async () => {
                // get data regarding original distances
                const dataset = await (await axios.get("data.json")).data

                for (const [key, entry] of Object.entries(dataset)) {
                    measures.push({
                        id: key,
                        data: entry,
                        x: d => new Date(d.date),
                        y: d => d.best_val_a,
                    });
                }
                orderUpdate(bnl.viewOrder);
            });

            function orderUpdate(order) {
                measures.sort((a, b) => order.findIndex(d => d.id === a.id)-order.findIndex(d => d.id === b.id))
            }

            watch(() => bnl.viewOrder, orderUpdate, { deep: true });

            return {
                margins,
                measures,
                selMeasures,
            };
        }
    })
</script>


<!-- Local styles -->
<style>
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
