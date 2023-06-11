<!-- Layout -->
<template>
    <HeaderInfo/>
    <main>
        <SmallMultiples :width="size.width*0.2" :height="Math.max(size.height-90,0)"/>
        <div class="main-info">
            <TimeMaster :width="size.width*0.8"/>
            <DetailsCollectionLineOnly v-if="selectedLayout === 1" :width="size.width*0.8"/>
            <DetailsCollectionCandle v-else-if="selectedLayout === 2" :width="size.width*0.8"/>
            <DetailsCollectionArrows v-else-if="selectedLayout === 3" :width="size.width*0.8"/>
            <DetailsCollectionTraingles v-else-if="selectedLayout === 4" :width="size.width*0.8"/>
            <DetailsCollectionOvals v-else-if="selectedLayout === 5" :width="size.width*0.8"/>
            <DetailsCollection v-else :width="size.width*0.8"/>
        </div>
    </main>
</template>


<!-- Code behind -->
<script setup>
    import HeaderInfo from "@/components/HeaderInfo"
    import SmallMultiples from "@/components/SmallMultiples"
    import DetailsCollectionLineOnly from "@/components/DetailsCollectionLineOnly"
    import DetailsCollectionCandle from "@/components/DetailsCollectionCandle"
    import DetailsCollectionArrows from "@/components/DetailsCollectionArrows"
    import DetailsCollectionTraingles from "@/components/DetailsCollectionTraingles"
    import DetailsCollectionOvals from "@/components/DetailsCollectionOvals"
    import DetailsCollection from "@/components/DetailsCollectionLineSlope"
    import TimeMaster from "@/components/TimeMaster"
    import { useApp } from '@/store/app'
    import { storeToRefs } from 'pinia'
    import { useWindowSize } from '@vueuse/core'
    import { reactive } from "vue"

    const size = reactive(useWindowSize());
    const app = useApp();
    const { selectedLayout } = storeToRefs(app);

</script>


<!-- Style -->
<style scoped>
main {
    display: flex;
}

.main-info {
    width: 80%;
}

</style>
