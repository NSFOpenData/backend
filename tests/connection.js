const mongoose = require('mongoose');
require("dotenv").config();
const Neighborhood = require("../models/neighborhood");
const User = require("../models/user");

const user = {
  name: "salomon",
  email: "salomondushimirimana@gmail.com",
  neighborhood: "Sylvan Park",
  role: "USER"
}

process.env.NODE_ENV = 'test';
const uri = process.env.DB_TEST;

const connectTestDB = async () => {
  await mongoose.connect(uri, {}).catch(err => console.log(err));
  const neighborhood = await Neighborhood.create({
    name: "Sylvan Park",
    location: {
      lat: "36.1430",
      lon: "-86.8446",
      name: "Sylvan Park"
    },
    dataRetention: "7d",
  });

  user.neighborhood = neighborhood._id;
  await User.create(user);
};

const dropTestDB = async () => {
  if (process.env.NODE_ENV === 'test') { // todo: do not understand NODE_ENV
    await mongoose.connection.db.dropDatabase().catch(err => console.log(err));
  }
}

const closeDBConnection = async () => {
  await mongoose.connection.close().catch(err => console.log(err));
}


module.exports = {
  connectTestDB,
  dropTestDB,
  closeDBConnection,
};

