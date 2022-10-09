export function loadCss(url: string) {
  let css = document.createElement("link");
  css.href = url;
  css.rel = "stylesheet";
  css.type = "text/css";
  document.head.appendChild(css);
}
