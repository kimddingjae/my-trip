// main.js
let map, geocoder, marker, circle;

const VERCEL_URL = "https://trip-backend-sable.vercel.app/api/chat";
window.onload = function () {
  const mapContainer = document.getElementById("map");
  const mapOption = {
    center: new kakao.maps.LatLng(36.5, 127.5),
    level: 13,
  };

  map = new kakao.maps.Map(mapContainer, mapOption);
  geocoder = new kakao.maps.services.Geocoder();

  document.getElementById("spinBtn").addEventListener("click", spin);
  document.getElementById("resetBtn").addEventListener("click", reset);
};

document.addEventListener("DOMContentLoaded", function () {
  const doSelect = document.getElementById("do");

  // city.js에 regions라는 객체가 있다고 가정 (예: const regions = { "서울특별시": [...], ... })
  if (typeof regions !== "undefined") {
    // 객체의 키(광역시도 명칭)들을 가져와서 옵션 생성
    const regionNames = regions;

    regionNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      doSelect.appendChild(option);
    });
  }

  // 선택이 변경될 때의 로직 (필요 시)
  doSelect.addEventListener("change", function () {
    clear();
  });
});

async function spin() {
  showLoading();
  const doElem = document.getElementById("do");
  const sigunElem = document.getElementById("sigun");
  const selectedDo = doElem.value;

  const doList = regions;
  let randDo = "";
  let randSigun = "";

  if (selectedDo == "전국") {
    randDo = doList[Math.floor(Math.random() * doList.length)];
    doElem.value = randDo;
  } else {
    randDo = selectedDo;
  }

  let sigunList = regions[randDo];
  let keys = Object.keys(sigun); //키를 가져옵니다. 이때, keys 는 반복가능한 객체가 됩니다.

  for (var i = 0; i < keys.length; i++) {
    let key = keys[i];

    if (key == randDo) {
      sigunList = sigun[key];
      break;
    }
  }

  randSigun = sigunList[Math.floor(Math.random() * sigunList.length)];

  sigunElem.innerText = randSigun;

  const fullName = randDo + " " + randSigun;
  
  // 2. AI 결과창 초기화
  const aiResultElem = document.getElementById("aiResult");
  if (aiResultElem) aiResultElem.innerText = "AI가 맛집과 여행지를 찾고 있습니다...";

  // 3. Gemini 호출 (chat.js 실행)
  const prompt = `${fullName} 여행지 3곳, 맛집 3곳 추천해줘.`;
  const aiResponse = await callGemini(prompt); // 아래 작성한 함수 호출
console.log(prompt)
  console.log(aiResponse)
  // 4. 화면에 결과 출력
  if (aiResultElem) {
    aiResultElem.innerText = aiResponse;
  }
  
  geocoder.addressSearch(fullName, function (result, status) {
    if (status === kakao.maps.services.Status.OK && result && result.length) {
      const lat = parseFloat(result[0].y);
      const lng = parseFloat(result[0].x);
      const coords = new kakao.maps.LatLng(lat, lng);

      //map.panTo(coords);
      map.setLevel(13); // 지역이 잘 보이도록 확대

      if (marker) marker.setMap(null);
      if (circle) circle.setMap(null);

      marker = new kakao.maps.Marker({
        map: map,
        //position: coords
      });

      circle = new kakao.maps.Circle({
        center: coords,
        radius: 3000,
        strokeWeight: 3,
        strokeColor: "#FF3DE5",
        strokeOpacity: 1,
        fillColor: "#FF8FE5",
        fillOpacity: 1,
        map: map,
      });
    } else {
      alert("위치를 찾을 수 없습니다: " + fullName);
    }
  });
  hideLoading();
}

function clear() {
  const mapContainer = document.getElementById("map");
  const mapOption = {
    center: new kakao.maps.LatLng(36.5, 127.5),
    level: 13,
  };

  map = new kakao.maps.Map(mapContainer, mapOption);
  geocoder = new kakao.maps.services.Geocoder();

  
}

function reset() {
  clear();
  const doElem = document.getElementById("do");
  const sigunElem = document.getElementById("sigun");
  const aiResultElem = document.getElementById("aiResult"); // 💡 추가
  
  doElem.value = "전국";
  sigunElem.innerText = "시/군/구";
  
  if (aiResultElem) {
    aiResultElem.innerText = "여기에 AI 추천 결과가 나타납니다."; // 💡 초기화 메시지
  }
}

function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

// chat.js를 실제로 호출하는 통신 함수
async function callGemini(text) {
  try {
    const response = await fetch(VERCEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    
    const result = await response.json();
    // Gemini의 응답 구조에 맞춰 텍스트 추출
    console.log(result)
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "답변을 가져오지 못했습니다.";
  } catch (err) {
    console.error("연결 에러:", err);
    return "서버와 통신하는 중 오류가 발생했습니다.";
  }
}
