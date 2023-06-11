// <copyright file="vewport.js" company="Universität Stuttgart">
// Copyright © 2022 Visualisierungsinstitut der Universität Stuttgart. All rights reserved.
// </copyright>
// <author>Christoph Müller</author>

import { onMounted, onUnmounted, ref } from "vue";


export default function useViewport() {
    // Gets the height of the viewport.
    const viewportHeight = ref(0);

    // Gets the width of the viewport.
    const viewportWidth = ref(0);

    const onResize = function () {
        viewportHeight.value = window.innerHeight;
        viewportWidth.value = window.innerWidth;
    };

    onMounted(() => {
        viewportHeight.value = window.innerHeight;
        viewportWidth.value = window.innerWidth;
        window.addEventListener('resize', onResize);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', onResize);
    });

    return { viewportHeight, viewportWidth };
}
