import { LABEL } from "./constants.js";
import { visitedCodes } from "./city.js";
import { dom, state } from "./state.js";

const visitedSet = new Set(visitedCodes);

function getZoomScale() {
  return d3.zoomTransform(dom.svg.node()).k;
}

function getLabelFontSize() {
  return LABEL.fontSize / getZoomScale();
}

export function applyDefaultLabelStyle(el) {
  el.attr("font-size", getLabelFontSize())
    .attr("font-family", LABEL.fontFamily)
    .attr("font-weight", LABEL.fontWeight)
    .attr("fill", "#000000")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2.5 / getZoomScale())
    .attr("paint-order", "stroke");
}

function applyVisitedLabelStyle(el) {
  el.attr("font-size", getLabelFontSize())
    .attr("font-family", LABEL.fontFamily)
    .attr("font-weight", LABEL.fontWeight)
    .attr("fill", "#ffffff")
    .attr("stroke", "#db2777")
    .attr("stroke-width", 2 / getZoomScale())
    .attr("paint-order", "stroke");
}

export function applySelectedLabelStyle(el) {
  el.attr("font-size", getLabelFontSize())
    .attr("font-family", LABEL.fontFamily)
    .attr("font-weight", LABEL.fontWeight)
    .attr("fill", "#ffffff")
    .attr("stroke", "#1e3a8a")
    .attr("stroke-width", 2 / getZoomScale())
    .attr("paint-order", "stroke");
}

export function applyDefaultStyle(el) {
  el.attr("fill", "#ffffff")
    .attr("fill-opacity", 0)
    .attr("stroke", "#999")
    .attr("stroke-width", 0.8);
}

function applyVisitedStyle(el) {
  el.attr("fill", "#f472b6")
    .attr("fill-opacity", 0.52)
    .attr("stroke", "#db2777")
    .attr("stroke-width", 1.1);
}

export function styleByCode(code) {
  return visitedSet.has(String(code)) ? applyVisitedStyle : applyDefaultStyle;
}

export function restoreStyle(code) {
  return visitedSet.has(String(code)) ? applyVisitedStyle : applyDefaultStyle;
}

export function refreshSelectedLabel() {
  dom.gLabel.selectAll("text[data-code]").each(function () {
    const el = d3.select(this);
    const code = el.attr("data-code");
    if (code === state.selectedCode) applySelectedLabelStyle(el);
    else if (visitedSet.has(code)) applyVisitedLabelStyle(el);
    else applyDefaultLabelStyle(el);
  });
}

export function appendLabel(code, x, y, label) {
  const text = dom.gLabel
    .append("text")
    .attr("data-code", code)
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("pointer-events", "none")
    .text(label);
  if (code === state.selectedCode) applySelectedLabelStyle(text);
  else if (visitedSet.has(String(code))) applyVisitedLabelStyle(text);
  else applyDefaultLabelStyle(text);
}
