<!-- Layout -->
<template>
    <div class="detail-chart">
        <div v-for="item in selMeasures" :key="item.id">
            <h3>{{item.data.display}}</h3>
            <h6 v-if="item.data.percentage">in % of recommended</h6>
            <h6 v-if="!item.data.percentage">in {{item.data.unit}}</h6>
            <TriangleChart
                :data="item.data.values"
                :key="item.id"
                :x="item.x"
                :yo="item.yo"
                :yc="item.yc"
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
    import TriangleChart from "@/components/charts/TriangleChart.vue";
    import axios from "axios";;
    import { useApp } from "@/store/app";
    import { defineComponent, onMounted, reactive, computed, watch } from "vue";

    export default defineComponent({
        // Specifies the components used by this one.
        components: {
            TriangleChart,
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
                        yo: d => d.pre_val_a,
                        yc: d => d.post_val_a,
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
