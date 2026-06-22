import { MAP_ZOOM_MIN, MAP_ZOOM_MAX } from "./constants.js";
import { dom } from "./state.js";
import { applyMapZoom } from "./map-zoom.js";

export function initMapLayer() {
  const wrap = document.getElementById("map-wrap");
  const svg = d3.select(wrap).append("svg");
  const defs = svg.append("defs");
  defs
    .append("filter")
    .attr("id", "pop-shadow")
    .attr("x", "-30%")
    .attr("y", "-30%")
    .attr("width", "160%")
    .attr("height", "160%")
    .append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 3)
    .attr("stdDeviation", 3)
    .attr("flood-color", "#1e40af")
    .attr("flood-opacity", 0.4);

  const gViewport = svg.append("g").attr("class", "map-viewport");
  const gRegion = gViewport.append("g");
  const gBorder = gViewport.append("g").style("pointer-events", "none");
  const gPop = gViewport
    .append("g")
    .attr("class", "pop-layer")
    .style("pointer-events", "none");
  const gLabel = gViewport.append("g").style("pointer-events", "none");

  const mapZoomBehavior = d3
    .zoom()
    .scaleExtent([MAP_ZOOM_MIN, MAP_ZOOM_MAX])
    .on("start", () => svg.classed("is-panning", true))
    .on("end", () => svg.classed("is-panning", false))
    .on("zoom", (event) => {
      gViewport.attr("transform", event.transform);
      applyMapZoom();
    });
  svg.call(mapZoomBehavior);

  dom.wrap = wrap;
  dom.svg = svg;
  dom.gViewport = gViewport;
  dom.gRegion = gRegion;
  dom.gBorder = gBorder;
  dom.gPop = gPop;
  dom.gLabel = gLabel;
  dom.mapZoomBehavior = mapZoomBehavior;
}
