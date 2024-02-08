<!-- Layout -->
<template>
    <div class="detail-chart">
        <div v-for="item in selMeasures" :key="item.id">
            
            <h3>{{item.data.display}}</h3>
            <!-- TODO make this a style class mb dont know if better -->
            <span style="display: flex; justify-content: space-between; margin-bottom: 5px; margin-left: 40px; margin-right: 0.5em;">
                <div>
                    <h6 v-if="item.data.percentage">in % of recommended</h6>
                    <h6 v-if="!item.data.percentage">in {{item.data.unit}}</h6>
                </div>
                
                <div style="display: flex; align-items: center;">
                    <ColorLegend
                        :width="50"
                        :height="15"
                        style="margin-right: 10px;"
                        :fill-opacity="0.33"
                        :data="item.data.areas.map(d => d.name)"
                        :colors="item.data.areas.map(d => colors[d.name])"
                    />
                    <button class="details-button" @click="bnl.toggleDetailsVisible(item.id)">
                        {{ visible[item.id] ? "hide slope charts" : "show slope charts" }}
                    </button>
                </div>
            </span>
            
            <SlopeCollection
                :id="item.id"
                :data="item.data.values"
                :xScale="scales.x"
                :width="width"
                :height="75"
                :yDomain="item.data.ydomain"
                :areas="item.data.areas"
                :percentage="item.data.percentage"
            />
            
            <LineChart
                :data="item.data.values"
                :x="item.x"
                :y="item.y"
                :margin="margins"
                :width="width"
                :height="125"
                :xScale="scales.x"
                :yDomain="item.data.ydomain"
                :yLabel="item.data.display"
                :yLabelShort="item.data.display_short"
                :areas="item.data.areas"
                :percentage="item.data.percentage"
            />
        </div>
    </div>
</template>

<!-- Code behind -->
<script setup>
    import * as d3 from "d3";
    import LineChart from "./charts/LineChart";
    import SlopeCollection from "./SlopeCollection";
    import ColorLegend from './charts/ColorLegend.vue'
    import axios from "axios";
    import { useApp } from "@/store/app";
    import { onMounted, reactive, computed, watch } from "vue";

    const props = defineProps({
        width: {
            type: Number,
            default: 800
        }
    });

    const colors = {
        "high": "#e63e41",
        "medium": "#e89748",
        "low": "#e3e376",
        "normal": "#1a9641",
    }

    // Get access to parts that we need in our properties and functions.
    const bnl = useApp();

    const measures = reactive([]);
    const selMeasures = computed(() => {
        return measures.filter(d => bnl.selectedViews[d.id]);
    })
    const scales = reactive({
        x: d3.scaleUtc()
    });

    const margins = {
        top: 0,
        bottom: 10,
        left: 40,
        right: 10
    };

    const visible = computed(() => {
        const obj = {};
        selMeasures.value.forEach(d => obj[d.id] = bnl.areDetailsVisible(d.id));
        return obj;
    });

    // Initialise the UI once it is realised.
    onMounted(async () => {
        // get data regarding original distances
        const dataset = await (await axios.get("data.json")).data


        scales.x
            .domain(d3.extent(Object.values(dataset)[0].values, d => new Date(d.date)))
            .nice()
            .range([
                margins.left,
                props.width - margins.right
            ])

        for (const [key, entry] of Object.entries(dataset)) {
            measures.push({
                id: key,
                data: entry,
                x: d => new Date(d.date),
                y: d => d.best_val_a,
            });
            bnl.setDetailsVisible(key);
        }
        orderUpdate(bnl.viewOrder);
    });

    function orderUpdate(order) {
        measures.sort((a, b) => order.findIndex(d => d.id === a.id)-order.findIndex(d => d.id === b.id))
    }

    watch(() => bnl.viewOrder, orderUpdate, { deep: true });

</script>


<!-- Local styles -->
<style scoped>
    .details-button {
        padding: 0.3em 0.5em;
        border-radius: 3px;
        font-weight: normal;
        font-size: 9px;
        cursor: pointer;
        background-color: #d3d3d3;
        color: black;
        border: none;
    }
    .details-button:hover { filter: brightness(80%); }

    .detail-chart {
        width: 100%;
        text-align: left;
        display: grid;
    }

    h3 {
        margin-left: 40px;
        margin-top: 0px;
        margin-bottom: 0px;
    }

    h6 {
        margin-top: 0px;
        margin-bottom: 5px;
    }

    div.svg-tooltip {
        position: fixed;
        text-align: left;
        padding: .5em;
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
