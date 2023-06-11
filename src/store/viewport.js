import { defineStore } from 'pinia'

export const useViewport = defineStore('viewport', {
    state: () => ({
        width: 800,
        height: 600,
    }),

    actions: {

        init() {
            window.addEventListener("resize", () => {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
            })
        }
    }

});
