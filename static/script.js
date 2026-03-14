const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city");
const statusLocation = document.getElementById("status-location");
const statusDescription = document.getElementById("status-description");
const currentTemp = document.getElementById("current-temp");
const currentFeels = document.getElementById("current-feels");
const currentWind = document.getElementById("current-wind");
const currentDesc = document.getElementById("current-desc");
const currentTimezone = document.getElementById("current-timezone");
const forecastList = document.getElementById("forecast-list");

const formatTemp = (value) => (value === null || value === undefined ? "--" : `${Math.round(value)}°C`);
const formatNumber = (value, unit) =>
  value === null || value === undefined ? "--" : `${Math.round(value)} ${unit}`.trim();

const setLoading = (message) => {
  statusLocation.textContent = message;
  statusDescription.textContent = "Fetching the latest data...";
  currentTemp.textContent = "--";
  currentFeels.textContent = "--";
  currentWind.textContent = "--";
  currentDesc.textContent = "--";
  currentTimezone.textContent = "--";
  forecastList.innerHTML = "<div class='forecast-placeholder'>Loading forecast...</div>";
};

const setError = (message) => {
  statusLocation.textContent = "Unable to load weather.";
  statusDescription.textContent = message;
  forecastList.innerHTML = "<div class='forecast-placeholder'>No forecast available.</div>";
};

const renderForecast = (days) => {
  if (!Array.isArray(days) || days.length === 0) {
    forecastList.innerHTML = "<div class='forecast-placeholder'>No forecast available.</div>";
    return;
  }

  forecastList.innerHTML = "";
  days.forEach((day) => {
    const item = document.createElement("div");
    item.className = "forecast-item";

    const info = document.createElement("div");
    const date = new Date(day.date);
    info.innerHTML = `
      <h3>${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</h3>
      <p>High ${formatTemp(day.temp_max)} · Low ${formatTemp(day.temp_min)}</p>
      <p>Precip ${formatNumber(day.precipitation, "mm")} · UV ${formatNumber(day.uv_index, "")}</p>
    `;

    const chip = document.createElement("div");
    chip.className = "forecast-chip";
    chip.innerHTML = `
      <div>H ${formatTemp(day.temp_max)}</div>
      <div>L ${formatTemp(day.temp_min)}</div>
    `;

    item.appendChild(info);
    item.appendChild(chip);
    forecastList.appendChild(item);
  });
};

const updateUI = (data) => {
  statusLocation.textContent = data.location;
  statusDescription.textContent = `Lat ${data.latitude.toFixed(2)}, Lon ${data.longitude.toFixed(2)}`;
  currentTemp.textContent = formatTemp(data.current.temperature);
  currentFeels.textContent = formatTemp(data.current.feels_like);
  currentWind.textContent = formatNumber(data.current.wind_speed, "km/h");
  currentDesc.textContent = `Code ${data.current.weather_code}`;
  currentTimezone.textContent = data.timezone;
  renderForecast(data.daily);
};

const fetchWeather = async (city) => {
  setLoading(`Checking ${city}...`);
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to fetch weather.");
    }
    updateUI(data);
  } catch (error) {
    setError(error.message || "Something went wrong.");
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setError("Please enter a city name.");
    return;
  }
  fetchWeather(city);
});
