# Weather Now ☀️🌧️🌩️

A simple weather application built with **React + Vite** and styled with **Tailwind CSS**.  
It uses the free [Open-Meteo APIs](https://open-meteo.com/) to provide **current weather conditions** for any city in the world.

Live Demo: [Weather Now on Vercel](https://weather-now-one-theta.vercel.app/)

---

## ✨ Features
- Search weather by **city name** (via Open-Meteo Geocoding API).
- Handles ambiguous cities with a **list of possible matches**.
- Displays:
  - Temperature (Celsius / Fahrenheit toggle)
  - Weather condition + emoji icon
  - Wind speed & direction
  - Local timestamp
- Saves **last searched city** and preferred **unit** in localStorage.
- Clean, responsive UI with Tailwind CSS.
- Deployed on Vercel for a stable, public URL.

---

## 🛠️ Tech Stack
- **React + Vite** — fast build & dev server.
- **Tailwind CSS** — utility-first styling.
- **Open-Meteo APIs** — free geocoding + weather data (no key required).
- **Vercel** — hosting & deployment.
- **LocalStorage** — persistence for city + unit.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22+ (recommended)  
- npm v9+

### Setup
Clone the repository:
```bash
git clone https://github.com/<your-username>/weather-now.git
cd weather-now
