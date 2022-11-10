<script setup lang="ts">
import { h, ref } from "vue";
defineProps({
  msg: String,
});
let dom = ref(null);
// function click() {
//   r_app_test_test(); //import { test } from "!app/test";
//   alert("test click");
// }
</script>

<template>
  {{ msg }}
  <div class="a">from remote center</div>
  <r-app-hello ref="dom" msg="test"></r-app-hello>
  <!-- // import hello from "!app/hello";
 -->

  <!-- <r-app-app @firstClick="click" value="msg from home "></r-app-app> -->
  <!-- import app from "!app/app.v";
 -->
</template>

<style scoped>
a {
  color: #42b983;
}
.el-tree {
  background-color: transparent;
}
</style>
