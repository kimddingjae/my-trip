import { visitSigun } from "./city.js";

export const state = {
  selectedCode: null,
  mapFocusCode: null,
  allFeatures: [],
  provFeatures: [],
  pathsByCode: new Map(),
  nameToCode: new Map(),
  codeToName: new Map(),
  provNameToCode: new Map(),
  provCityToCode: new Map(),
  visitCodes: new Set(
    Object.values(visitSigun).flatMap((list) => list.map((c) => c.code)),
  ),
  recLoadToken: 0,
  spinning: false,
};

export const dom = {
  wrap: null,
  svg: null,
  gViewport: null,
  gRegion: null,
  gBorder: null,
  gPop: null,
  gLabel: null,
  mapZoomBehavior: null,
  provSel: null,
  citySel: null,
  mainArea: null,
  resultIdle: null,
  resultPanel: null,
  resultRegion: null,
  resultBody: null,
  resultTabs: null,
  cntEl: null,
  aiLoadingOverlay: null,
};
