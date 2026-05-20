# Personal Dashboard

A sleek, minimalistic dashboard that provides a quick, beautiful overview of the day's essential information, from weather conditions to air quality and daylight tracking.

## Why this exists (Motivation)

I created this project because I wanted a **nice, clutter-free way of viewing essential daily information**. Most weather apps and dashboards are overloaded with ads, dense data, or unnecessary social features. I just wanted a clean, visually appealing summary of my environment—current weather, air quality, when the sun is setting, and how the day is progressing.

This dashboard serves as a calm, distraction-free glance at everything going on around me, precisely tailored without the visual noise.

## Features

- **Automatic Geolocation:** Automatically fetches your location to deliver localized weather and air quality data.
- **Real-Time Weather & Conditions:** Current temperature, 'feels like' temperature, humidity, UV index, wind speed/direction, and atmospheric pressure.
- **Air Quality Monitoring:** Clear display of AQI (Air Quality Index), PM2.5, PM10, and NO2 levels.
- **Sun Arc Tracking:** A beautiful visualization of sunrise, sunset, and the sun's current position throughout the day.
- **Daylight & Time Countdowns:** Radial countdown rings tracking the progression of the current minute, hour, and day.
- **Customizable Themes:** Integrated theme panel to switch appearances based on your preferences or the time of day.
- **Responsive Design:** Looks great on desktop, tablet, and mobile.

## Tech Stack

This project is built with modern, performant web technologies:

- **[React 19](https://react.dev/)** - UI Library
- **[TypeScript](https://www.typescriptlang.org/)** - Static typing for safer code
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling and bundler
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons

## Data Sources

- Weather and Air Quality data are proudly and seamlessly provided by the free, open-source **[Open-Meteo API](https://open-meteo.com)**.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or your preferred package manager (yarn, pnpm, bun)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/JayDubyaEey/dashboard.git
   cd dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

In the project directory, you can run:

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Type-checks and builds the app for production.
- `npm run preview` - Boots up a local web server to preview the production build.
- `npm run lint` - Lints the codebase using ESLint.
- `npm run format` - Formats the code using Prettier.

## License

This project is open-source and available under standard open source licensing.
