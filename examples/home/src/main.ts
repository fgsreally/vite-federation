import { createApp } from "vue";
import App from "./App.vue";

import ElementPlus from "element-plus";
import { vueDev } from "vite-federation/helper";
// import "!app/style.css";
let app = createApp(App);

app.use(vueDev()).use(ElementPlus).mount("#app");
