<template>
  <el-tree
    class="testTree"
    :data="data"
    show-checkbox
    node-key="id"
    :default-expanded-keys="[2, 4]"
    :default-checked-keys="[5]"
    :props="defaultProps"
  />
  <div @click="$emit('firstClick')">{{ props.value }}</div>
  <HelloWorld msg="never test again!!"></HelloWorld>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { ElTree } from "element-plus";
import "element-plus/es/components/tree/style/css"
import HelloWorld from "./components/HelloWorld.vue";



const props = defineProps({
  value: String,
});
const emits = defineEmits(["firstClick"]);

const defaultProps = {
  children: "children",
  label: "label",
};
const data = [
  {
    id: 1,
    label: "Level one 1",
    children: [
      {
        id: 4,
        label: "Level two 1-1",
        children: [
          {
            id: 9,
            label: "Level three 1-1-1",
          },
          {
            id: 10,
            label: "Level three 1-1-2",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Level one 2",
    children: [
      {
        id: 5,
        label: "Level two 2-1",
      },
      {
        id: 6,
        label: "Level two 2-2",
      },
    ],
  },
  {
    id: 3,
    label: "Level one 3",
    children: [
      {
        id: 7,
        label: "Level two 3-1",
      },
      {
        id: 8,
        label: "Level two 3-2",
      },
    ],
  },
];
</script>
<style>
.testTree {
  background-color: yellowgreen !important;
  width: 100px;
}
</style>
