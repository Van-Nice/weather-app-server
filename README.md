# Wilson's Weather App - Backend

This repository contains the backend service for Wilson's Weather, a web application that provides real-time weather updates. This service handles requests to fetch weather data based on user location or a specific location input, using various APIs.

## Features

- **Weather Data Fetching**: Retrieves weather information using the OpenWeather API based on coordinates or IP address.
- **Geolocation**: Converts a user-provided address to geographic coordinates using Google's Geocoding API.
- **IP-based Location Fetching**: Determines the user's location from their IP address using the IPinfo API.

## APIs Used

- **OpenWeather API**: For fetching current, hourly, and weekly weather data.
- **Google Geocoding API**: For translating addresses into geographic coordinates.
- **IPinfo API**: For obtaining location information from IP addresses.

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourgithubusername/weather-app-backend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd weather-app-backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file and fill in your API keys:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   OPEN_WEATHER_API_KEY=your_openweather_api_key
   IP_INFO_API_KEY=your_ipinfo_api_key
   ```
5. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

Ensure you have the following environment variables set up in your `.env` file:
- `GOOGLE_MAPS_API_KEY`: API key for Google Maps services.
- `OPEN_WEATHER_API_KEY`: API key for OpenWeather services.
- `IP_INFO_API_KEY`: API key for IPinfo services.

## Running the Server

To run the server, use:
```bash
npm start
```
This will start the server on the port specified in your `.env` file or default to 3000.

## API Endpoints

- `/start-weather-data?coords=[latitude],[longitude]`: Returns weather data for specified coordinates.
- `/ip-weather-data`: Returns weather data based on the user's IP address.
- `/search-locations?input=[userInput]`: Returns autocomplete location suggestions based on user input.
- `/weather-data?input=[location]`: Returns weather data for a specified location.

## Contributing

Contributions to improve the backend are welcome. Please fork the repository and submit a pull request with your changes.

---
