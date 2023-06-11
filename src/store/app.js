import * as d3 from 'd3';
import { defineStore } from 'pinia'

export const useApp = defineStore('app', {
    state: () => ({
        errors: [],
            selectedViews: {},
            viewOrder: [],
            viewOrderComparison: () => 0,
            highlightedObs: null,
            selectedObs: null,
            selectedLayout: 0,
            detailZoom: d3.zoomIdentity,
            detailsVisible: new Map(),
            zoomEndTime: Date.now(),
    }),

    actions: {

        addError(error) {
            this.errors.push(error);
        },

        clearErrors() {
            errors = [];
        },

        selectView(key, value=true) {
            this.selectedViews[key] = value;
        },

        setSelectedViews(data) {
            this.selectedViews[data.key] = data.value;
        },
        resetSelectedViews() {
            Object.keys(this.selectedViews).forEach(key => {
                this.selectedViews[key] = true;
            })
        },

        setViewOrder(items) {
            this.viewOrder = items;
        },
        updateViewOrder(key, position) {
            const item = this.viewOrder.find(d => d.id === key);
            if (item !== undefined) {
                item.position = position;
                this.viewOrder.sort((a, b) => a.position - b.position);
            }
        },

        setHighlightedObs(obs) {
            this.highlightedObs = obs;
        },
        resetHighlightedObs() {
            this.highlightedObs = null;
        },

        setSelectedObs(obs) {
            this.selectedObs = obs;
        },
        resetSelectedObs() {
            this.selectedObs = null;
        },

        setSelectedLayout(layout) {
            this.selectedLayout = layout;
        },

        setZoom(transform) {
            this.detailZoom = transform;
        },
        resetZoom() {
            this.detailZoom = d3.zoomIdentity;
        },
        endZoom() {
            this.zoomEndTime = Date.now();
        },

        setDetailsVisible(id) {
            this.detailsVisible.set(id, true)
        },
        toggleDetailsVisible(id) {
            const value = this.detailsVisible.get(id)
            if (value !== undefined) {
                this.detailsVisible.set(id, !value)
            }
        },
    }
});
