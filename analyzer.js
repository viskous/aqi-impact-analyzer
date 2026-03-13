// Simple demo dataset of states / cities with coordinates.
// You can extend this list with more locations.
const CITY_DATA = {
    "California": [
        { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
        { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
        { name: "San Diego", lat: 32.7157, lon: -117.1611 }
    ],
    "New York": [
        { name: "New York City", lat: 40.7128, lon: -74.0060 },
        { name: "Buffalo", lat: 42.8864, lon: -78.8784 }
    ],
    "Texas": [
        { name: "Houston", lat: 29.7604, lon: -95.3698 },
        { name: "Dallas", lat: 32.7767, lon: -96.7970 },
        { name: "Austin", lat: 30.2672, lon: -97.7431 }
    ],
    "Maharashtra": [
        { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
        { name: "Pune", lat: 18.5204, lon: 73.8567 }
    ],
    "Delhi": [
        { name: "New Delhi", lat: 28.6139, lon: 77.2090 }
    ]
};

// TODO: Put your own OpenWeatherMap API key here.
// Sign up at `https://openweathermap.org/api/air-pollution` to get a free key.
const OPENWEATHER_API_KEY = "e8812826876eec398374396df226fe9e";

function populateStates() {
    const stateSelect = document.getElementById("stateSelect");
    const states = Object.keys(CITY_DATA);

    stateSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select State";
    placeholder.disabled = true;
    placeholder.selected = true;
    stateSelect.appendChild(placeholder);

    states.forEach((state) => {
        const opt = document.createElement("option");
        opt.value = state;
        opt.textContent = state;
        stateSelect.appendChild(opt);
    });
}

function populateCities() {
    const stateSelect = document.getElementById("stateSelect");
    const citySelect = document.getElementById("citySelect");
    const selectedState = stateSelect.value;

    citySelect.innerHTML = "";

    if (!selectedState || !CITY_DATA[selectedState]) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select City";
        placeholder.disabled = true;
        placeholder.selected = true;
        citySelect.appendChild(placeholder);
        return;
    }

    const cities = CITY_DATA[selectedState];

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select City";
    placeholder.disabled = true;
    placeholder.selected = true;
    citySelect.appendChild(placeholder);

    cities.forEach((city) => {
        const opt = document.createElement("option");
        opt.value = city.name;
        opt.textContent = city.name;
        citySelect.appendChild(opt);
    });
}

async function getAQIForSelectedCity() {
    const stateSelect = document.getElementById("stateSelect");
    const citySelect = document.getElementById("citySelect");
    const aqiResult = document.getElementById("aqiResult");
    const aqiText = document.getElementById("aqiText");

    const state = stateSelect.value;
    const cityName = citySelect.value;

    if (!state) {
        alert("Please select a state.");
        return;
    }

    if (!cityName) {
        alert("Please select a city.");
        return;
    }

    const cityEntry = CITY_DATA[state].find((c) => c.name === cityName);
    if (!cityEntry) {
        alert("Selected city not found in dataset.");
        return;
    }

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
        alert("Please set your OpenWeatherMap API key in analyzer.js.");
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${cityEntry.lat}&lon=${cityEntry.lon}&appid=${OPENWEATHER_API_KEY}`;

    try {
        aqiText.textContent = "Fetching live AQI...";
        aqiResult.style.display = "block";

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch AQI data.");
        }

        const data = await response.json();
        const aqiValue = data?.list?.[0]?.main?.aqi;

        if (!aqiValue) {
            aqiText.textContent = "No AQI data available for this location right now.";
            return;
        }

        const levelDescription = mapAQILevel(aqiValue);
        aqiText.textContent = `AQI for ${cityName}, ${state}: ${aqiValue} (${levelDescription}).`;
    } catch (error) {
        console.error(error);
        aqiText.textContent = "Error fetching AQI data. Please try again later.";
        aqiResult.style.display = "block";
    }
}

function mapAQILevel(aqiIndex) {
    // OpenWeatherMap AQI scale: 1–5
    switch (aqiIndex) {
        case 1:
            return "Good";
        case 2:
            return "Fair";
        case 3:
            return "Moderate";
        case 4:
            return "Poor";
        case 5:
            return "Very Poor";
        default:
            return "Unknown";
    }
}

function analyzeImpact() {
    const input = document.getElementById("userInput").value;

    if (input.trim() === "") {
        alert("Please describe your daily activities.");
        return;
    }

    document.getElementById("results").style.display = "block";
    document.getElementById("analysisText").innerText =
        "Analyzing your activities... AI extraction logic coming next.";
}

document.addEventListener("DOMContentLoaded", () => {
    populateStates();
    populateCities();
    const stateSelect = document.getElementById("stateSelect");
    if (stateSelect) {
        stateSelect.addEventListener("change", populateCities);
    }
});