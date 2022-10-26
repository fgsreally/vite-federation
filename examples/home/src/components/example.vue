<script setup lang="ts">
// import "!app/App.css";
import app from "!app/app.vue";
import { h, ref } from "vue";
import { test } from "!app/test";
import HelloWorld from "./HelloWorld.vue";
defineProps({
  msg: String,
});
let dom = ref(null);
function click() {
  test();
  alert("test click");
}
</script>

<template>
  <div class="a">from remote center</div>
  <HelloWorld msg="home value" ref="dom"></HelloWorld>

  <app  @firstClick="click" value="msg from home "></app>
</template>

<style scoped>
a {
  color: #42b983;
}
.el-tree {
  background-color: transparent;
}
</style>
