<script setup lang="ts">
// import "!app/App.css";
import { ref, provide } from "vue";
import test1 from "!app/App";

defineProps({
  msg: String,
});
function test() {
  alert(1);
}
</script>

<template>
  <div class="a">from remote center</div>
  <test1 value="home value" @firstClick="test"></test1>
</template>

<style scoped>
a {
  color: #42b983;
}
.el-tree {
  background-color: transparent;
}
</style>
