<script setup lang="ts">
import Example from "./components/example.vue";
// import Example from "!app/hello";
import { provide, ref } from "vue";
</script>

<template>
  <Example />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 40px;
}
</style>
