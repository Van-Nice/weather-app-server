const http = require('http');
const https=require('https')
const fetch = require('node-fetch');
require('dotenv').config();

const { IPinfoWrapper } = require("node-ipinfo");

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const openWeatherApiKey = process.env.OPEN_WEATHER_API_KEY;

const ipInfoApiKey = process.env.IP_INFO_API_KEY;
const ipinfo = new IPinfoWrapper(ipInfoApiKey);

async function fetchStartData(latitude, longitude) {
  try {
    const openWeatherApiResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&appid=${openWeatherApiKey}`);
    const data = await openWeatherApiResponse.json();

    if (!openWeatherApiResponse.ok) {
      throw new Error(`HTTP error! status: ${openWeatherApiResponse.status}`);
    }

    return data;
  } catch (error) {
    console.error('An error occurred while fetching the start data:', error);
    throw error; // re-throw the error to be handled by the caller
  }
}

function geocode(address) {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;
  
    https.get(url, (res) => {
      let data = '';
  
      res.on('data', (chunk) => {
        data += chunk;
      });
  
      res.on('end', () => {
        const apiResponse = JSON.parse(data);
  
        if (apiResponse.status == 'OK') {
          const lat = apiResponse.results[0].geometry.location.lat;
          const lng = apiResponse.results[0].geometry.location.lng;
          resolve({lat, lng});
        } else {
          console.error(`Geocoding error: ${apiResponse.status}`);
          reject(null);
        }
      });
    }).on('error', (error) => {
      console.error(`Geocoding error: ${error}`);
      reject(null);
    });
  })
}

async function getCoordinates(address) {
  try {
    const coordinates = await geocode(address);
    const latitude = coordinates.lat;
    const longitude = coordinates.lng;
    const openWeatherApiResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&appid=${openWeatherApiKey}`);
    return openWeatherApiResponse.json();
  } catch (error) {
    console.error('Error:', error);
    return;
  }
}

async function fetchWeatherData(address, res) {
  try {
    const weatherData = await getCoordinates(address);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(weatherData));
  } catch (error) {
    console.error('An error occurred while fetching the weather data:', error);
    res.writeHead(500, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ error: 'An error occurred while fetching the weather data' }));
  }
}

async function handleWeatherDataRequest(req, res) {
  if (req.url.startsWith('/start-weather-data')) {
    try {
      const coords = new URL(req.url, `http://${req.headers.host}`).searchParams.get('coords');
      const [latitude, longitude] = coords.split(',');
      const weatherData = await fetchStartData(latitude, longitude);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(weatherData));
    } catch (error) {
      console.error('An error occurred while handling the weather data request:', error);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: 'An error occurred while fetching the weather data' }));
    }
  }
}

async function handleIpDataRequest(req, res, ip) {
  if (req.url.startsWith('/ip-weather-data')) {
    if (!ip) {
      console.error('No IP address provided');
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: 'No IP address provided' }));
      return;
    }
    try {
      const response = await fetch(`https://ipinfo.io/${ip}?token=${ipInfoApiKey}`);
      const responseData = await response.json();
      console.log(responseData);
      const coords = responseData.loc;
      console.log(coords);
      const [latitude, longitude] = coords.split(",");
      console.log(latitude, longitude);
      const openWeatherApiResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&appid=${openWeatherApiKey}`);
      const weatherData = await openWeatherApiResponse.json();
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(weatherData));
    } catch (error) {
      console.error('Failed to fetch IP data:', error);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: 'Failed to fetch IP data' }));
    }
  }
}

const server = http.createServer((req, res) => {
    // Set for staging
    res.setHeader('Access-Control-Allow-Origin', 'https://weather-app-client-staging.netlify.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(ip);

    if (req.url.startsWith('/search-locations')) {
        const userInput = new URL(req.url, `http://${req.headers.host}`).searchParams.get('input');
        const googleApiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(userInput)}&types=(cities)&key=${googleMapsApiKey}`;

        https.get(googleApiUrl, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => {
                data += chunk;
            });
            apiRes.on('end', () => {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(data);
            });
        }).on('error', (error) => {
            console.error(error);
            res.writeHead(500);
            res.end('Error contacting Google API');
        });
    }

    if (req.url.startsWith('/weather-data')) {
      const address = new URL(req.url, `http://${req.headers.host}`).searchParams.get('input');
      fetchWeatherData(address, res);
    }

    if (req.url.startsWith('/start-weather-data')) {
      handleWeatherDataRequest(req, res);
    }

    if (req.url.startsWith('/ip-weather-data')){
      handleIpDataRequest(req, res, ip);
    }

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
