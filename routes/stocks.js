express = require("express");
const axios = require("axios");
const { json } = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  //get the search term
  const searchTerm = req.query.searchterm;
  //stock&company api for getting company's information(symbol, price, country, city, logo, description...)
  const BASE_URL = "https://financialmodelingprep.com";
  const API_KEY = process.env.STOCK_COMPANY_API_KEY;
  let url = `${BASE_URL}/api/v3/profile/${searchTerm}?apikey=${API_KEY}`;
  //get stock&company data from stock api
  axios
    .get(url)
    .then(async (response) => {
      console.log(response.data); //check returned data
      console.log(response.data.length == 0); //check if have any data return
      //if there are data return them and mashup with another two APIs
      if (response.data.length != 0) {
        weatherData = await getWeather(response.data[0]["city"]); //mashup with weather api to get weather data
        holidayData = await getHolidays(response.data[0]["country"]); //mashup with holiday api to get public holiday data
        //categorise all the data into each three cluster:stock, weather, holidays
        return {
          holidays: holidayData,
          weather: {
            city: weatherData["name"],
            weather: weatherData["weather"][0]["main"],
            temp: weatherData["main"]["temp"],
            humidity: weatherData["main"]["humidity"],
          },
          stock: {
            symbol: response.data[0]["symbol"],
            price: response.data[0]["price"],
            changes: response.data[0]["changes"],
            company: response.data[0]["companyName"],
            country: response.data[0]["country"],
            city: response.data[0]["city"],
            address: response.data[0]["address"],
            industry: response.data[0]["industry"],
            exchangeShortName: response.data[0]["exchangeShortName"],
            description: response.data[0]["description"],
            website: response.data[0]["website"],
            image: response.data[0]["image"],
          },
        };
      }
      //if no data just return response.data
      else {
        return response.data;
      }
    })
    .then((data) => {
      //if got data render stocks pug file
      if (JSON.stringify(data) !== "[]") {
        //pass data to stocks pug file
        console.log(data);
        console.log(JSON.stringify(data));
        console.log(JSON.stringify(data).length);
        res.render("stocks", {
          holidaysData: data.holidays,
          weatherData: data.weather,
          stockData: data.stock,
        });
      } else {
        //if no data render invalidSearch pug file
        res.render("invalidSearch");
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

//an async function to get weather data for mashup purpose
async function getWeather(city) {
  //wetaher api
  const BASE_URL = "https://api.openweathermap.org";
  const API_KEY = process.env.WEATHER_API_KEY;
  let url = `${BASE_URL}/data/2.5/weather?q=${city}&appid=${API_KEY}`;
  const response = await axios.get(url); //get data from weather api
  return response.data;
}

//an async function to get holiday data from public holiday api for mashup purpose
async function getHolidays(country) {
  let currentYear = new Date().getFullYear(); //get current year
  //public holiday api
  let url = `https://date.nager.at/api/v3/publicholidays/${currentYear}/${country}`;
  const response = await axios.get(url); //get data from api
  let holidayData = [];
  //preprocess data for further usage
  response.data.map((data) => {
    holidayData.push({ date: data["date"], name: data["name"] });
  });
  console.log(holidayData); //to check the preprocessed data before returning it
  return holidayData;
}

module.exports = router;
