express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", (req, res) => {
  //get the searchterm
  const searchTerm = req.query.searchterm;
  //stock api for getting peer stocks' symbols
  const BASE_URL = "https://finnhub.io";
  const API_KEY = process.env.STOCK_NEWS_API_KEY;
  let url = `${BASE_URL}/api/v1/stock/peers?symbol=${searchTerm}&token=${API_KEY}`;
  // get data from api
  axios
    .get(url)
    .then(async (response) => {
      //because the returned peer stocks' symbols includes searched stock syboml so that need to filter it out
      let peers = response.data.filter(function (x) {
        return x !== searchTerm;
      });
      //only choose 4 peer stocks to get their news
      peersSelected = [
        peers[0],
        peers[1],
        peers[peers.length - 1],
        peers[peers.length - 2],
      ];
      //mashup with another api to query and get news data for each stock
      let news = await getNews(searchTerm);
      let peer1news = await getNews(peersSelected[0]);
      let peer2news = await getNews(peersSelected[1]);
      let peer3news = await getNews(peersSelected[2]);
      let peer4news = await getNews(peersSelected[3]);
      //using console.log to check if turned data is correct
      console.log(response.data);
      console.log(peers);
      console.log(peersSelected);
      //preprocess returned data
      return {
        peersSelected: peersSelected,
        news: news,
        peer1news: peer1news,
        peer2news: peer2news,
        peer3news: peer3news,
        peer4news: peer4news,
      };
    })
    .then((data) => {
      //pass news data to news pug file
      res.render("news", {
        stock: searchTerm,
        peerStock: data.peersSelected,
        news: data.news,
        peer1news: data.peer1news,
        peer2news: data.peer2news,
        peer3news: data.peer3news,
        peer4news: data.peer4news,
      });
    })

    .catch((error) => {
      console.error(error);
    });
});

//an async funtion to get news data
async function getNews(symbol) {
  const BASE_URL = process.env.STOCK_NEWS_BASE_RUL;
  const API_KEY = process.env.STOCK_NEWS_API_KEY;

  //to fetch current 3 days news of chosen stock, so generate start time and end time for querying
  let d = new Date();
  let currentDate = d.toISOString().slice(0, 10);
  let threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo = threeDaysAgo.toISOString().slice(0, 10);

  let url = `${BASE_URL}/api/v1/company-news?symbol=${symbol}&from=${threeDaysAgo}&to=${currentDate}&token=${API_KEY}`;
  //get new data from stock new api
  const response = await axios.get(url);

  let newsData = [];
  //preprocess news data for further usage
  response.data.map((data) => {
    newsData.push({
      symbol: data["related"],
      headline: data["headline"],
      image: data["image"],
      summary: data["summary"],
      url: data["url"],
      source: data["source"],
    });
  });
  //return preprocessed news data
  return newsData;
}

module.exports = router;
