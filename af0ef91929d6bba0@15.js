function _1(md){return(
md`# Exposing d3 require to use in closures`
)}

function _d3Require(require){return(
require("d3-require")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3Require")).define("d3Require", ["require"], _d3Require);
  return main;
}
