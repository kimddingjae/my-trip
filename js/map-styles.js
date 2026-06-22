import { LABEL, VISIT_PINK, VISIT_PINK_STROKE } from "./constants.js";
import { dom, state } from "./state.js";

function getZoomScale() {
  return d3.zoomTransform(dom.svg.node()).k;
}

function getLabelFontSize() {
  return LABEL.fontSize / getZoomScale();
}

export function applyVisitLabelStyle(el) {
  el.attr("font-size", getLabelFontSize())
    .attr("font-family", LABEL.fontFamily)
    .attr("font-weight", LABEL.fontWeight)
    .attr("fill", "#ffffff")
    .attr("stroke", "#831843")
    .attr("stroke-width", 2 / getZoomScale())
    .attr("paint-order", "stroke");
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

export function applyVisitedStyle(el) {
  el.attr("fill", VISIT_PINK)
    .attr("fill-opacity", 0.55)
    .attr("stroke", VISIT_PINK_STROKE)
    .attr("stroke-width", 1.2);
}

export function styleByCode(code) {
  if (state.visitCodes.has(code)) return applyVisitedStyle;
  return applyDefaultStyle;
}

export function restoreStyle(code) {
  if (state.visitCodes.has(code)) return applyVisitedStyle;
  return applyDefaultStyle;
}

export function refreshSelectedLabel() {
  dom.gLabel.selectAll("text[data-code]").each(function () {
    const el = d3.select(this);
    const code = el.attr("data-code");
    if (code === state.selectedCode) applySelectedLabelStyle(el);
    else if (state.visitCodes.has(code)) applyVisitLabelStyle(el);
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
  else if (state.visitCodes.has(code)) applyVisitLabelStyle(text);
  else applyDefaultLabelStyle(text);
}
