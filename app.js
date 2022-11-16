// required external modules

const express = require("express");
require("dotenv").config();
const path = require("path");

const stocksRouter = require("./routes/stocks");
const newsRouter = require("./routes/news");
const { count } = require("console");
//app variables
const app = express();
app.use(express.static("image"));
const port = process.env.PORT || "3000";

//load view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

const AWS = require("aws-sdk");
// Cloud Services Set-up
// Create s3 bucket with unique bucket name
const bucketName = "1109j-counter";
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
});
(async () => {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
  } catch (err) {
    // We will ignore 409 errors which indicate that the bucket already exists
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    }
  }
})();

//get count number from s3 bucket
const s3Key = `visit-counter`;
async function get_count() {
  const params = { Bucket: bucketName, Key: s3Key };
  try {
    const s3Result = await s3.getObject(params).promise();

    const s3JSON = JSON.parse(s3Result.Body);
    console.log();
    return s3JSON;
  } catch (err) {
    console.log(err);
    //if not found, creat an object as a counter with initial count number 0
    if (err.statusCode === 404) {
      const counter = { count: 0 };
      console.log(counter);
      return counter;
    }
  }
}
//to put updated count number back to s3 bucket
async function put_count(number) {
  const body = JSON.stringify({ count: number });
  const objectParams = { Bucket: bucketName, Key: s3Key, Body: body };
  await s3.putObject(objectParams).promise();
  console.log(`Successfully uploaded data to ${bucketName}/${s3Key}`);
}

//render views
app.get("/", async (req, res) => {
  //get visit count number from s3 bucket and update visit count number, then put new number back to bucket
  const count = await get_count();
  const update = count.count + 1;
  await put_count(update);
  console.log(count.count);

  res.status(200).render("index", { count: update }); //to show updated visit count in home page
});

//navigation with other routes
app.use("/search", stocksRouter);
app.use("/searchNews", newsRouter);

//handle 404 error
app.use((req, res, next) => {
  res.status(404).render("notfound");
});

//server activation
app.listen(3000, function () {
  console.log(`Server start on port ${port}...http://localhost:${port}/`);
});
