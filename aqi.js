const STORAGE_KEY = "openweather_api_key";
function getApiKey() {
  return (localStorage.getItem(STORAGE_KEY) || "").trim();
}

// State/UT -> cities (keep this list small/curated; OpenWeather will resolve coordinates)
const INDIA_STATE_CITIES = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh"],
  Bihar: ["Patna", "Gaya", "Bhagalpur"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Durg"],
  Goa: ["Panaji", "Margao"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurugram", "Faridabad", "Panipat"],
  "Himachal Pradesh": ["Shimla", "Dharamshala"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Manipur: ["Imphal"],
  Meghalaya: ["Shillong"],
  Mizoram: ["Aizawl"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  Tripura: ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"],
  Uttarakhand: ["Dehradun", "Haridwar", "Haldwani"],
  "West Bengal": ["Kolkata", "Siliguri", "Durgapur", "Asansol"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa"],
  Delhi: ["New Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh"],
  Lakshadweep: ["Kavaratti"],
  Puducherry: ["Puducherry"]
};

const stateSelect = document.getElementById("stateSelect");
const citySelect = document.getElementById("citySelect");
const fetchBtn = document.getElementById("fetchAqiBtn");

const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const clearKeyBtn = document.getElementById("clearKeyBtn");

const placeholderEl = document.getElementById("aqiPlaceholder");
const errorEl = document.getElementById("aqiError");
const resultEl = document.getElementById("aqiResult");
const pillEl = document.getElementById("aqiPill");
const valueEl = document.getElementById("aqiValue");
const titleEl = document.getElementById("aqiTitle");
const metaEl = document.getElementById("aqiMeta");
const pm25El = document.getElementById("pm25Value");
const pm10El = document.getElementById("pm10Value");
const pointerEl = document.getElementById("aqiScalePointer");
const weatherIconEl = document.getElementById("weatherIcon");
const weatherTempEl = document.getElementById("weatherTemp");
const weatherLabelEl = document.getElementById("weatherLabel");
const weatherHumidityEl = document.getElementById("weatherHumidity");
const weatherWindEl = document.getElementById("weatherWind");
const weatherPressureEl = document.getElementById("weatherPressure");
const hasAnalyzerDom =
  stateSelect &&
  citySelect &&
  fetchBtn &&
  apiKeyInput &&
  saveKeyBtn &&
  clearKeyBtn &&
  placeholderEl &&
  errorEl &&
  resultEl;

function setError(message) {
  if (!message) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
    return;
  }
  errorEl.style.display = "block";
  errorEl.textContent = message;
}

function setLoading(isLoading) {
  fetchBtn.disabled = isLoading || citySelect.disabled || !citySelect.value;
  fetchBtn.textContent = isLoading ? "Fetching..." : "Show AQI";
}

function aqiInfo(standardAqi) {
  if (typeof standardAqi !== "number" || Number.isNaN(standardAqi)) {
    return { label: "Unknown", cls: "aqi-unknown" };
  }
  if (standardAqi <= 50) return { label: "Good", cls: "aqi-good" };
  if (standardAqi <= 100) return { label: "Satisfactory", cls: "aqi-fair" };
  if (standardAqi <= 200) return { label: "Moderate", cls: "aqi-moderate" };
  if (standardAqi <= 300) return { label: "Poor", cls: "aqi-poor" };
  if (standardAqi <= 400) return { label: "Very Poor", cls: "aqi-very-poor" };
  return { label: "Severe", cls: "aqi-very-poor" };
}

const AQI_BREAKPOINTS = {
  pm2_5: [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, Number.POSITIVE_INFINITY, 401, 500]
  ],
  pm10: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 250, 101, 200],
    [251, 350, 201, 300],
    [351, 430, 301, 400],
    [431, Number.POSITIVE_INFINITY, 401, 500]
  ],
  no2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 180, 101, 200],
    [181, 280, 201, 300],
    [281, 400, 301, 400],
    [401, Number.POSITIVE_INFINITY, 401, 500]
  ],
  so2: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 380, 101, 200],
    [381, 800, 201, 300],
    [801, 1600, 301, 400],
    [1601, Number.POSITIVE_INFINITY, 401, 500]
  ],
  // OpenWeather CO is in µg/m³; convert to mg/m³ for Indian AQI breakpoints.
  co: [
    [0, 1, 0, 50],
    [1.1, 2, 51, 100],
    [2.1, 10, 101, 200],
    [10.1, 17, 201, 300],
    [17.1, 34, 301, 400],
    [34.1, Number.POSITIVE_INFINITY, 401, 500]
  ],
  o3: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 168, 101, 200],
    [169, 208, 201, 300],
    [209, 748, 301, 400],
    [749, Number.POSITIVE_INFINITY, 401, 500]
  ],
  nh3: [
    [0, 200, 0, 50],
    [201, 400, 51, 100],
    [401, 800, 101, 200],
    [801, 1200, 201, 300],
    [1201, 1800, 301, 400],
    [1801, Number.POSITIVE_INFINITY, 401, 500]
  ]
};

function interpolateAqi(value, ranges) {
  for (const [cLow, cHigh, iLow, iHigh] of ranges) {
    if (value >= cLow && value <= cHigh) {
      if (!Number.isFinite(cHigh)) return iHigh;
      const ratio = (value - cLow) / (cHigh - cLow || 1);
      return iLow + ratio * (iHigh - iLow);
    }
  }
  return null;
}

function computeStandardAqi(components) {
  const subIndices = [];
  for (const [pollutant, ranges] of Object.entries(AQI_BREAKPOINTS)) {
    const raw = components?.[pollutant];
    if (typeof raw !== "number" || Number.isNaN(raw) || raw < 0) continue;
    const value = pollutant === "co" ? raw / 1000 : raw;
    const sub = interpolateAqi(value, ranges);
    if (typeof sub === "number" && !Number.isNaN(sub)) {
      subIndices.push(sub);
    }
  }
  if (!subIndices.length) return null;
  return Math.round(Math.min(500, Math.max(...subIndices)));
}

function fmt(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function fmtInt(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return Math.round(n).toString();
}

function pointerLeftPercent(aqi) {
  if (typeof aqi !== "number" || Number.isNaN(aqi)) return 0;
  return Math.max(0, Math.min(100, (aqi / 500) * 100));
}

function renderWeather(weather) {
  const temp = weather?.main?.temp;
  const humidity = weather?.main?.humidity;
  const wind = weather?.wind?.speed;
  const pressure = weather?.main?.pressure;
  const condition = weather?.weather?.[0]?.main || "—";
  const icon = weather?.weather?.[0]?.icon;

  weatherTempEl.textContent = fmtInt(temp);
  weatherLabelEl.textContent = condition;
  weatherHumidityEl.textContent = typeof humidity === "number" ? `${humidity}%` : "—";
  weatherWindEl.textContent = typeof wind === "number" ? `${wind.toFixed(1)} m/s` : "—";
  weatherPressureEl.textContent = typeof pressure === "number" ? `${pressure} hPa` : "—";

  if (icon) {
    weatherIconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    weatherIconEl.style.display = "block";
  } else {
    weatherIconEl.style.display = "none";
  }
}

function renderAqiDashboard({ standardAqi, info, components, cityName, state, updatedAt, owAqi, weather }) {
  pillEl.textContent = "AQI (IN)";
  valueEl.textContent = standardAqi;
  titleEl.textContent = info.label;
  titleEl.className = `aqi-status-text aqi-status-${info.cls.replace("aqi-", "")}`;
  pm25El.textContent = fmt(components?.pm2_5);
  pm10El.textContent = fmt(components?.pm10);
  pointerEl.style.left = `${pointerLeftPercent(standardAqi)}%`;
  metaEl.textContent = `${cityName}, ${state} • Updated ${updatedAt} • OpenWeather ${owAqi}/5`;
  renderWeather(weather);
}

async function geoToLatLon({ city, state }) {
  const apiKey = getApiKey();
  const q = encodeURIComponent(`${city}, ${state}, IN`);
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=1&appid=${encodeURIComponent(
    apiKey
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("City not found by OpenWeather.");
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
}

async function fetchAirQuality({ lat, lon }) {
  const apiKey = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AQI fetch failed (${res.status})`);
  const data = await res.json();
  const first = data?.list?.[0];
  if (!first?.main?.aqi) throw new Error("AQI data unavailable for this location.");
  return first;
}

async function fetchWeather({ lat, lon }) {
  const apiKey = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&units=metric&appid=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);
  return res.json();
}

async function onFetchAqi() {
  setError("");
  placeholderEl.style.display = "none";
  resultEl.style.display = "none";

  if (!getApiKey()) {
    placeholderEl.style.display = "block";
    setError("Missing OpenWeather API key. Paste it above and click “Save Key”.");
    return;
  }

  const state = stateSelect.value;
  const city = citySelect.value;
  if (!state || !city) return;

  setLoading(true);
  try {
    const { lat, lon, name } = await geoToLatLon({ city, state });
    const [air, weather] = await Promise.all([fetchAirQuality({ lat, lon }), fetchWeather({ lat, lon })]);

    const standardAqi = computeStandardAqi(air.components);
    if (typeof standardAqi !== "number") {
      throw new Error("Standard AQI could not be computed from available pollutant data.");
    }
    const info = aqiInfo(standardAqi);
    pillEl.className = "aqi-main-unit";

    const ts = air.dt ? new Date(air.dt * 1000) : null;
    const when = ts ? ts.toLocaleString() : "—";
    renderAqiDashboard({
      standardAqi,
      info,
      components: air.components,
      cityName: name,
      state,
      updatedAt: when,
      owAqi: air.main.aqi,
      weather
    });
    resultEl.style.display = "block";
  } catch (e) {
    placeholderEl.style.display = "block";
    setError(e?.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

function populateStates() {
  if (!stateSelect || !citySelect || !fetchBtn) return;
  const states = Object.keys(INDIA_STATE_CITIES).sort((a, b) => a.localeCompare(b));
  stateSelect.innerHTML = `<option value="">Select state / UT</option>${states
    .map((s) => `<option value="${s}">${s}</option>`)
    .join("")}`;
  citySelect.innerHTML = `<option value="">Select city</option>`;
  citySelect.disabled = true;
  fetchBtn.disabled = true;
}

function populateCitiesForState(state) {
  if (!citySelect || !fetchBtn || !placeholderEl || !resultEl) return;
  const cities = INDIA_STATE_CITIES[state] || [];
  citySelect.innerHTML = `<option value="">Select city</option>${cities
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("")}`;
  citySelect.disabled = cities.length === 0;
  fetchBtn.disabled = true;
  placeholderEl.style.display = "block";
  resultEl.style.display = "none";
  setError("");
}

if (hasAnalyzerDom) {
  stateSelect.addEventListener("change", () => {
    populateCitiesForState(stateSelect.value);
  });

  citySelect.addEventListener("change", () => {
    fetchBtn.disabled = citySelect.disabled || !citySelect.value;
    placeholderEl.style.display = "block";
    resultEl.style.display = "none";
    setError("");
  });

  fetchBtn.addEventListener("click", onFetchAqi);

function syncKeyUi() {
  const key = getApiKey();
  apiKeyInput.value = key ? "••••••••••••••••" : "";
}

  saveKeyBtn.addEventListener("click", () => {
    const raw = (apiKeyInput.value || "").trim();
    if (!raw || raw.includes("•")) {
      setError("Paste your real API key, then click “Save Key”.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, raw);
    setError("");
    syncKeyUi();
  });

  clearKeyBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    apiKeyInput.value = "";
    setError("");
    placeholderEl.style.display = "block";
    resultEl.style.display = "none";
  });

  populateStates();
  syncKeyUi();
}

