<!-- Layout -->
<template>
    <div class="timeline">
        <TimeBand v-if="values.length > 0"
            :data="values"
            :x="x"
            :y="y"
            :width="width"
            :height="70"
        />
    </div>
</template>

<!-- Code behind -->
<script>
    import TimeBand from "@/components/charts/TimeBand";
    import axios from "axios";;
    import { defineComponent, onMounted, reactive, toRefs } from "vue";

    export default defineComponent({
        // Specifies the components used by this one.
        components: {
            TimeBand,
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

            const data = reactive({ values: [] });
            const x = d => new Date(d.date);
            const y = () => 1.0;

            // Initialise the UI once it is realised.
            onMounted(async () => {
                // get data regarding original distances
                data.values = await (await axios.get("befunde.json")).data;
            });

            return {
                ...toRefs(data),
                x,
                y,
            };
        }
    })
</script>


<!-- Local styles -->
<style>
.timeline {
    width: 100%;
    text-align: left;
    position: sticky;
    top: 90px; /* Stay at the top */
    z-index: 1;
    background-color: white;
}

.timeline h4 {
    margin-top: 0px;
    margin-bottom: 0px;
    margin-left: 40px;
    text-align: left;
}

.time-circle {
    stroke: lightgray;
}
</style>
