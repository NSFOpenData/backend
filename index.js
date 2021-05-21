const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const port = 3000;

require("dotenv").config();

const url = process.env.DB;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const getData = async (col_name) => {
  await client.connect();
  const cursor = client.db("test").collection(col_name).find({}); // get all entries
  if ((await cursor.count()) === 0) {
    console.log("No documents found");
  }
  let ret = "";
  await cursor.forEach((d) => (ret += JSON.stringify(d)));
  return ret;
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/data", async (req, res) => {
  const data = await getData("Vehicles");
  res.send(data);
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
