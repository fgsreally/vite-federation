<script setup lang="ts">
// import "!app/App.css";
import app from "!app/App.vue";

import { test } from "!app/test";

defineProps({
  msg: String,
});
function click() {
  test();
  alert("test click");
}
</script>

<template>
  <div class="a">from remote center</div>

  <app value="home value" @firstClick="click"></app>
</template>

<style scoped>
a {
  color: #42b983;
}
.el-tree {
  background-color: transparent;
}
</style>
