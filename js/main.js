import { initMapLayer } from "./map-layer.js";
import { initZoomControls } from "./map-zoom.js";
import { initRecommendations } from "./recommendations.js";
import { initControls, initDomRefs } from "./controls.js";
import { loadMapData } from "./data-loader.js";

function init() {
  initDomRefs();
  initMapLayer();
  initZoomControls();
  initRecommendations();
  initControls();
  loadMapData();
}

init();
