<template>
    <svg ref="el" :width="width*data.length" :height="height"></svg>
</template>

<script setup>
    import * as d3 from 'd3';
    import { ref, onMounted } from 'vue';

    const props = defineProps({
        data: {
            type: Array,
            required: true
        },
        colors: {
            type: Array,
            required: true
        },
        fillOpacity: {
            type: Number,
            default: 1
        },
        width: {
            type: Number,
            default: 50
        },
        height: {
            type: Number,
            default: 15
        },
    })

    const el = ref(null);

    function draw() {
        const svg = d3.select(el.value);
        svg.selectAll("*").remove();

        const colors = d3.scaleOrdinal()
            .domain(props.data)
            .range(props.colors);

        svg.append("g")
            .selectAll("rect")
            .data(props.data)
            .join("rect")
            .attr("x", (_, i) => i * props.width)
            .attr("y", 0)
            .attr("width", props.width)
            .attr("height", props.height)
            .attr("fill", d => colors(d))
            .attr("fill-opacity", props.fillOpacity)

        svg.append("g")
            .selectAll("text")
            .data(props.data)
            .join("text")
            .attr("x", (_, i) => (i + 0.5) * props.width)
            .attr("y",  props.height * 0.75)
            .style("font-size", 9)
            .attr("text-anchor", "middle")
            .text(d => d)
    }

    onMounted(draw)
</script>