import {
  MAP_ZOOM_MIN,
  MAP_ZOOM_MAX,
  MAP_ZOOM_STEP,
  MAP_ZOOM_MIN_FOCUS,
  MAP_ZOOM_DRAW_IN_STEPS,
} from "./constants.js";
import { dom, state } from "./state.js";
import { refreshSelectedLabel } from "./map-styles.js";
import { redraw } from "./map-render.js";

export function getMapZoomMin() {
  return state.mapFocusCode ? MAP_ZOOM_MIN_FOCUS : MAP_ZOOM_MIN;
}

export function syncZoomExtent() {
  dom.mapZoomBehavior.scaleExtent([getMapZoomMin(), MAP_ZOOM_MAX]);
}

export function applyMapZoom() {
  const t = d3.zoomTransform(dom.svg.node());
  const minK = getMapZoomMin();
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomResetBtn = document.getElementById("zoom-reset-btn");
  const atMinZoom = t.k <= minK + 0.001;
  if (zoomOutBtn) zoomOutBtn.disabled = atMinZoom;
  if (zoomResetBtn) zoomResetBtn.disabled = atMinZoom;
  if (zoomInBtn) zoomInBtn.disabled = t.k >= MAP_ZOOM_MAX - 0.001;
  refreshSelectedLabel();
}

export function resetMapZoom() {
  syncZoomExtent();
  dom.svg.call(dom.mapZoomBehavior.transform, d3.zoomIdentity);
}

export function applyFocusZoomAt(k) {
  if (!state.mapFocusCode) return;
  syncZoomExtent();
  const { width: W, height: H } = dom.wrap.getBoundingClientRect();
  dom.svg.call(
    dom.mapZoomBehavior.transform,
    d3.zoomIdentity
      .translate((W * (1 - k)) / 2, (H * (1 - k)) / 2)
      .scale(k),
  );
  redraw();
  applyMapZoom();
}

export function applyFocusMinZoom() {
  applyFocusZoomAt(MAP_ZOOM_MIN_FOCUS);
}

export function applyFocusDrawZoom() {
  const k =
    MAP_ZOOM_MIN_FOCUS * Math.pow(MAP_ZOOM_STEP, MAP_ZOOM_DRAW_IN_STEPS);
  applyFocusZoomAt(k);
}

export function resetMapZoomHome() {
  if (state.mapFocusCode) {
    applyFocusMinZoom();
  } else {
    syncZoomExtent();
    dom.svg.call(dom.mapZoomBehavior.transform, d3.zoomIdentity);
  }
}

export function zoomMapBy(factor) {
  syncZoomExtent();
  dom.svg.call(dom.mapZoomBehavior.scaleBy, factor);
}

export function initZoomControls() {
  document.getElementById("zoom-in-btn").addEventListener("click", () => {
    zoomMapBy(MAP_ZOOM_STEP);
  });
  document.getElementById("zoom-out-btn").addEventListener("click", () => {
    zoomMapBy(1 / MAP_ZOOM_STEP);
  });
  document.getElementById("zoom-reset-btn").addEventListener("click", () => {
    resetMapZoomHome();
  });
}
