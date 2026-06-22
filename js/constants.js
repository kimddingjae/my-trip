export const METRO_SHORT_TO_CODE = {
  서울: "11",
  부산: "21",
  대구: "22",
  인천: "23",
  광주: "24",
  대전: "25",
  울산: "26",
  세종: "29",
};

export const METRO = new Set(Object.values(METRO_SHORT_TO_CODE));

export const MUNI_METRO = new Set(["11", "21", "22", "23", "24", "25", "26"]);

export const OLD_TO_NEW_PC = {
  31: "41",
  32: "42",
  33: "43",
  34: "44",
  35: "45",
  36: "46",
  37: "47",
  38: "48",
  39: "50",
};

export const GU_CITY = {
  3101: "수원시",
  3102: "성남시",
  3104: "안양시",
  3109: "안산시",
  3110: "고양시",
  3119: "용인시",
  3304: "청주시",
  3401: "천안시",
  3501: "전주시",
  3701: "포항시",
  3811: "창원시",
};

export const MAP_ZOOM_MIN = 1;
export const MAP_ZOOM_MAX = 5;
export const MAP_ZOOM_STEP = 1.35;
export const MAP_ZOOM_MIN_FOCUS = 0.15;
export const MAP_ZOOM_DRAW_IN_STEPS = 2;
export const MAP_FOCUS_FIT_SCALE = 0.72;

export const VISIT_PINK = "#f472b6";
export const VISIT_PINK_STROKE = "#db2777";

export const LABEL = {
  fontFamily: "Noto Sans KR, sans-serif",
  fontWeight: "700",
  fontSize: 9,
};

export const PROV_ALIASES = {
  경기도: "41",
  경기: "41",
  강원도: "42",
  강원: "42",
  강원특별자치도: "42",
  충청북도: "43",
  충북: "43",
  충청남도: "44",
  충남: "44",
  전라북도: "45",
  전북: "45",
  전북특별자치도: "45",
  전라남도: "46",
  전남: "46",
  경상북도: "47",
  경북: "47",
  경상남도: "48",
  경남: "48",
  제주특별자치도: "50",
  제주도: "50",
  제주: "50",
};

export const GEOJSON_CDN =
  "https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/";
export const GEOJSON_RAW =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/";
