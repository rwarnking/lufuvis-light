<template>
    <div class="debug">
        <div>
            <b>Debug Header</b>
        </div>
        <span class="divider"></span>
        <div>
            <b style="margin: 0 0.5em;">Layout</b>
            <select @change="event => app.setSelectedLayout(Number.parseInt(event.target.value))">
                <option value=0>Line+Slope</option>
                <option value=1>Line</option>
                <option value=2>Candle</option>
                <option value=3>Arrows</option>
                <option value=4>Triangles</option>
                <option value=5>Ovals</option>
            </select>
            <b style="margin: 0 0.5em;">Data Range</b>
            <select value="0" @change="event => app.setDataDomain(event.target.value === '1')">
                <option value=0>0 to Maximum</option>
                <option value=1>Minimum to Maximum</option>
            </select>

        </div>
    </div>
    <nav>
        <div>
            <b>Select Patient<br></b>
            <select name="attributes" id="attributes" @change="e => app.setDataset(e.target.value)">
                <option value="p0_a">P0-A</option>
                <option value="p1_d">P1-D</option>
            </select>
        </div>
        <span class="divider"></span>
        <div>
            <b>Age<br></b>
            <b id="age">{{patient.age}}</b>
        </div>
        <span class="divider"></span>
        <div>
            <b>Gender<br></b>
            <b id="gender">{{patient.gender}}</b>
        </div>
        <span class="divider"></span>
        <div>
            <b>Height<br></b>
            <b id="height">{{patient.height}} m</b>
        </div>
        <span class="divider"></span>
        <div>
            <b>Weight<br></b>
            <b id="weight">{{patient.weight}} kg</b>
        </div>
    </nav>
</template>

<!-- Code behind -->
<script setup>
    import axios from "axios";
    import { onMounted, reactive } from "vue";
    import { useApp } from '@/store/app';

    const app = useApp();
    const patient = reactive({
        age: 0, gender: "undef", height: 0, weight: 0
    });

    // Initialise the UI once it is realised.
    onMounted(async () => {
        // get data regarding original distances
        const patientdata = await (await axios.get("patient.json")).data
        patient.age = patientdata.age;
        patient.gender = patientdata.gender;
        patient.height = patientdata.height;
        patient.weight = patientdata.weight;
    });
</script>

<!-- Local styles -->
<style scoped>
nav {
    position: sticky; /* Stay in place */
    display: flex;
    padding: 1em;
    align-items: center;
    background-color: #222;
    color: white;
    top: 20px;
    z-index: 1;
}

.debug {
    position: sticky; /* Stay in place */
    display: flex;
    align-items: center;
    background-color: white;
    /* color: white; */
    top: 0;
    z-index: 2;
}

.divider {
    flex-grow: 1;
}
</style>
