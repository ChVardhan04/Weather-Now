import { useEffect, useState } from "react";

/**
 * Weather Now - Step 7
 * - Adds unit toggle (C / F), localStorage last search, and auto-load.
 * - Saves last successful place as 'wn_last' and unit as 'wn_unit' in localStorage.
 */

const WEATHER_CODE_MAP = {
  0: { text: "Clear sky", icon: "☀️" },
  1: { text: "Mainly clear", icon: "🌤️" },
  2: { text: "Partly cloudy", icon: "⛅" },
  3: { text: "Overcast", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Depositing rime fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌦️" },
  53: { text: "Moderate drizzle", icon: "🌦️" },
  55: { text: "Dense drizzle", icon: "🌧️" },
  56: { text: "Light freezing drizzle", icon: "🌧️❄️" },
  57: { text: "Dense freezing drizzle", icon: "🌧️❄️" },
  61: { text: "Slight rain", icon: "🌧️" },
  63: { text: "Moderate rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  66: { text: "Light freezing rain", icon: "🌧️❄️" },
  67: { text: "Heavy freezing rain", icon: "🌧️❄️" },
  71: { text: "Slight snow fall", icon: "❄️" },
  73: { text: "Moderate snow fall", icon: "❄️" },
  75: { text: "Heavy snow fall", icon: "❄️" },
  77: { text: "Snow grains", icon: "❄️" },
  80: { text: "Slight rain showers", icon: "🌦️" },
  81: { text: "Moderate rain showers", icon: "🌦️" },
  82: { text: "Violent rain showers", icon: "⛈️" },
  85: { text: "Slight snow showers", icon: "🌨️" },
  86: { text: "Heavy snow showers", icon: "🌨️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm with hail (small)", icon: "⛈️🧊" },
  99: { text: "Thunderstorm with hail (heavy)", icon: "⛈️🧊" },
};

function weatherText(code) {
  return WEATHER_CODE_MAP[code]?.text ?? "Unknown";
}
function weatherIcon(code) {
  return WEATHER_CODE_MAP[code]?.icon ?? "🌈";
}

function cToF(c) {
  return (c * 9) / 5 + 32;
}
function formatTemp(celsius, unit) {
  if (unit === "C") return `${roundTo(celsius, 1)}°C`;
  return `${roundTo(cToF(celsius), 1)}°F`;
}
function roundTo(n, digits = 0) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

export default function App() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState(null);
  const [selected, setSelected] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState(() => localStorage.getItem("wn_unit") || "C");

  // on mount: load last saved place (if any) and auto-fetch its weather
  useEffect(() => {
    const raw = localStorage.getItem("wn_last");
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj?.latitude && obj?.longitude) {
          setCity(obj.name || "");
          // set selected early to show place label; fetch weather afterwards
          setSelected(obj);
          // fetch weather for saved place
          fetchWeather(obj.latitude, obj.longitude, obj);
        }
      } catch {
        // ignore invalid data
      }
    }
    // ensure unit sync
    const savedUnit = localStorage.getItem("wn_unit");
    if (savedUnit) setUnit(savedUnit);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    localStorage.setItem("wn_unit", unit);
  }, [unit]);

  async function handleSearch(e) {
    e?.preventDefault();
    setError("");
    setWeather(null);
    setPlaces(null);
    setSelected(null);

    const q = city?.trim();
    if (!q) {
      setError("Enter a city name.");
      return;
    }

    setLoading(true);
    try {
      const enc = encodeURIComponent(q);
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${enc}&count=5&language=en&format=json`;
      const res = await fetch(geoUrl);
      if (!res.ok) throw new Error("Geocoding request failed");
      const data = await res.json();

      if (!data || !data.results || data.results.length === 0) {
        setError("No places found. Try a different query.");
        setPlaces([]);
      } else if (data.results.length === 1) {
        const p = data.results[0];
        const obj = {
          name: p.name,
          country: p.country,
          admin1: p.admin1,
          latitude: p.latitude,
          longitude: p.longitude,
        };
        setSelected(obj);
        // fetch weather
        await fetchWeather(obj.latitude, obj.longitude, obj);
      } else {
        const formatted = data.results.map((p) => ({
          id: `${p.latitude}_${p.longitude}_${p.name}`,
          name: p.name,
          country: p.country,
          admin1: p.admin1,
          latitude: p.latitude,
          longitude: p.longitude,
          population: p.population,
        }));
        setPlaces(formatted);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to look up the city. Check your network and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeather(lat, lon, place) {
    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      const data = await res.json();

      if (!data || !data.current_weather) {
        setError("Weather data unavailable for this location.");
      } else {
        const payload = {
          ...data.current_weather,
          place,
        };
        setWeather(payload);
        // persist this place for next load
        try {
          localStorage.setItem(
            "wn_last",
            JSON.stringify({
              name: place?.name ?? selected?.name ?? city,
              country: place?.country ?? selected?.country,
              admin1: place?.admin1 ?? selected?.admin1,
              latitude: lat,
              longitude: lon,
            })
          );
        } catch {
          // ignore storage errors
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch weather. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPlace(p) {
    const obj = {
      name: p.name,
      country: p.country,
      admin1: p.admin1,
      latitude: p.latitude,
      longitude: p.longitude,
    };
    setSelected(obj);
    setPlaces(null);
    // fetch weather for chosen place
    fetchWeather(obj.latitude, obj.longitude, obj);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-start justify-center p-6">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Weather Now</h1>
          <p className="text-sm text-gray-500">Get current weather for any city - fast.</p>
        </header>

        <form onSubmit={handleSearch} className="flex gap-3" role="search">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Enter city name, e.g. London"
            aria-label="City name"
          />
          <button
            type="submit"
            className="bg-sky-600 text-white px-4 py-2 rounded-lg disabled:opacity-60 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </form>

        <section className="mt-6">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {places && places.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">Multiple matches. Pick the right one:</div>
              <ul className="space-y-2">
                {places.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => handleSelectPlace(p)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-sky-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{p.name}{p.admin1 ? `, ${p.admin1}` : ""}</div>
                          <div className="text-xs text-gray-500">{p.country} {p.population ? `· pop ${p.population}` : ""}</div>
                        </div>
                        <div className="text-xs text-gray-400">lat {p.latitude.toFixed(2)}, lon {p.longitude.toFixed(2)}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {places && places.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
              No places found for that query.
            </div>
          )}

          {weather && (
            <div className="mt-4 p-4 bg-sky-50 rounded-lg border">
              <div className="flex items-start gap-4">
                <div className="text-5xl">{weatherIcon(weather.weathercode)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">
                        {selected?.name || weather.place?.name}{selected?.admin1 ? `, ${selected.admin1}` : ""} · {selected?.country || weather.place?.country}
                      </div>
                      <div className="text-sm text-gray-600">
                        {weatherText(weather.weathercode)} · {new Date(weather.time).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Temp</div>
                        <div className="text-lg font-medium">{formatTemp(weather.temperature, unit)}</div>
                      </div>

                      <div className="flex items-center bg-white p-1 rounded-full border shadow-sm">
                        <button
                          onClick={() => setUnit("C")}
                          className={`px-2 py-1 rounded-full text-xs ${unit === "C" ? "bg-sky-600 text-white" : "text-gray-600"}`}
                        >
                          C
                        </button>
                        <button
                          onClick={() => setUnit("F")}
                          className={`ml-1 px-2 py-1 rounded-full text-xs ${unit === "F" ? "bg-sky-600 text-white" : "text-gray-600"}`}
                        >
                          F
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                      <div className="text-xs text-gray-500">Wind</div>
                      <div className="text-lg font-medium">{weather.windspeed} km/h</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                      <div className="text-xs text-gray-500">Wind Dir</div>
                      <div className="text-lg font-medium">{Math.round(weather.winddirection)}°</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                      <div className="text-xs text-gray-500">Source</div>
                      <div className="text-xs text-gray-600">Open-Meteo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!weather && !places && !error && (
            <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
              No results yet. Search a city to get current weather.
            </div>
          )}
        </section>

        <footer className="mt-4 text-xs text-gray-400">
          Tip: Last successful search is saved and will load on next visit.
        </footer>
      </div>
    </div>
  );
}
