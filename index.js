const { error } = require('console');
const http = require('http');
const https = require('https');
require('dotenv').config();

const { IPinfoWrapper } = require("node-ipinfo");


const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const openWeatherApiKey = process.env.OPEN_WEATHER_API_KEY;

const ipInfoApiKey = process.env.IP_INFO_API_KEY;
const ipinfo = new IPinfoWrapper(ipInfoApiKey);

async function fetchStartData(latitude, longitude) {
  const openWeatherApiResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&appid=${openWeatherApiKey}`);
  return openWeatherApiResponse.json();
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
  const weatherData = await getCoordinates(address);
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(weatherData));
}

async function handleWeatherDataRequest(req, res) {
  if (req.url.startsWith('/start-weather-data')) {
    const coords = new URL(req.url, `http://${req.headers.host}`).searchParams.get('coords');
    const [latitude, longitude] = coords.split(',');
    const weatherData = await fetchStartData(latitude, longitude);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(weatherData));
  }
}

async function handleIpDataRequest(req, res) {
  if (req.url.startsWith('/ip-weather-data')) {
    const ip = new URL(req.url, `http://${req.headers.host}`).searchParams.get('ip');
    console.log(ip, 'this is where the ip address is supposed to be logged');
    const tempIp = '1.115.255.255';
    console.log(tempIp);
    ipinfo.lookupIp(tempIp).then(async (response) => {
      const coords = response.loc;
      const [latitude, longitude] = coords.split(',');
      const openWeatherApiResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&appid=${openWeatherApiKey}`);
      const weatherData = await openWeatherApiResponse.json();
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(weatherData));
    });
  }
}

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all domains
    res.setHeader('Access-Control-Allow-Methods', 'GET'); // Allowed methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allowed headers

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
      handleIpDataRequest(req, res);
    }

    // Create get ip function endpoint
    if (req.url.startsWith('/get-ip')) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(ip);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
