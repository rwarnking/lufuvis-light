<!-- Layout -->
<template>
    <div class="small-multiple">
        <svg if="initialized" :width="width" :height="height">
            <AreaChart v-for="item in measures"
                :data="item.data.values"
                :key="item.id"
                :id="item.id"
                :x="item.x"
                :y="item.y"
                :yLabel="item.data.display_short"
                :width="width"
                :height="height / measures.length"
            />
        </svg>
    </div>
</template>

<!-- Code behind -->
<script setup>
    import AreaChart from "./charts/AreaChart";
    import axios from "axios";;

    import { useApp } from "@/store/app";
    import { ref, onMounted, reactive } from "vue";


    const props = defineProps({
        width: {
            type: Number,
            default: 200
        },
        height: {
            type: Number,
            default: 800
        }
    });

    const initialized = ref(false);
    const bnl = useApp();

    const measures = reactive([]);

    // Initialise the UI once it is realised.
    onMounted(async () => {
        // get data regarding original distances
        const dataset = await (await axios.get("data.json")).data

        measures.value = []

        let i = 0;
        const order = [];
        for (const [key, entry] of Object.entries(dataset)) {
            measures.push({
                id: key,
                index: i++,
                data: entry,
                x: d => new Date(d.date),
                y: d => d.best_val_n,
            });
            order.push({ id: key, position: i*props.height })

            bnl.selectView(key);
        }
        bnl.setViewOrder(order);
        initialized.value = true;
    });
</script>


<!-- Local styles -->
<style>
    .small-multiple {
        height: 100%; /* 100% Full-height */
        width: 20%; /* 0 width - change this with JavaScript */
        position: sticky; /* Stay in place */
        z-index: 1; /* Stay on top */
        top: 90px; /* Stay at the top */
        left: 0;
        background-color: #fff; /* Black*/
        display: flex;
        flex-direction: column;
    }

    .dataline {
        stroke: black;
        stroke-width: 1.5;
        stroke-opacity: 1;
        stroke-linecap: "round";
        stroke-linejoin: "round";
    }

    circle {
        stroke: black;
        stroke-width: 1;
    }

    .sm-area {
        stroke: none;
        fill: lightgray;
    }
</style>
