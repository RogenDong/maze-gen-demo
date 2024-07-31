<script setup>
import { ref, onMounted } from 'vue';
import { Maze } from './lib/maze';

const U = 1;// 0b_1
const D = 2;// 0b_10
const L = 4;// 0b_100
const R = 8;// 0b_1000
const ALL = 15;// 0b_1111

const FINAL_IMG = [1, 3, 5, 13, 15];

const IMG_INDEX = {
    1: [U, R, D, L],
    3: [U | D, L | R],
    5: [U | L, U | R, D | R, D | L],
    13: [U | L | R, U | D | R, D | L | R, U | D | L],
};

const WIDTH = ref(10);
const HEIGHT = ref(10);
const MAZE = ref([]);

onMounted(() => {
    // gen();
});

function gen() {
    const mm = new Maze(WIDTH.value, HEIGHT.value);
    mm.gen();
    MAZE.value = mm.map;
}

/**
 * 设置道路的样式
 * @param sign 方向标识
 */
function wayStyle(sign) {
    if (sign == ALL || FINAL_IMG.includes(sign))
        return "cell bi" + sign;
    for (const ii in IMG_INDEX) {
        if (!Object.hasOwnProperty.call(IMG_INDEX, ii)) continue;
        let mat = IMG_INDEX[ii];
        for (let i = 0; i < mat.length; i++) {
            if (mat[i] == sign) {
                return `cell bi${ii} r${i}`;
            }
        }
    }
    return 'cell pc';
}
</script>

<template>
    <div>
        w: <input type="number" :min="5" :max="10" v-model="WIDTH" />
        h: <input type="number" :min="5" :max="10" v-model="HEIGHT" />
        <button class="pc" @click="gen">refresh</button>
    </div>
    <div>
        <div class="row" v-for="line in MAZE">
            <div v-for="s in line" :aaa="s" :class="wayStyle(s)"></div>
        </div>
    </div>
</template>

<style scoped>
.bi1 {
    background-image: url("./assets/1.jpg");
}

.bi3 {
    background-image: url("./assets/3.jpg");
}

.bi5 {
    background-image: url("./assets/5.jpg");
}

.bi13 {
    background-image: url("./assets/13.jpg");
}

.bi15 {
    background-image: url("./assets/15.jpg");
}

.r1 {
    transform: rotate(90deg);
}

.r2 {
    transform: rotate(180deg);
}

.r3 {
    transform: rotate(-90deg);
}

.inline {
    display: inline-block;
}

.cell {
    background-size: cover;
    display: inline-block;
    /* margin: 2px; */
    height: 3em;
    width: 3em;
    padding: 0;
}

.row {
    height: 3em;
    padding: 0;
    margin: 0;
}

.pc {
    background-color: #AE92FA;
}

.wc {
    background-color: white;
}

.rc {
    background-color: red;
}

.oc {
    background-color: orange;
}

.yc {
    background-color: yellow;
}

.gc {
    background-color: green;
}
</style>
