const mongoose = require('mongoose');
require("dotenv").config();

process.env.NODE_ENV = 'test';

const dropTestDB = async () => {
  if (process.env.NODE_ENV === 'test') { // todo: do not understand NODE_ENV
    await mongoose.connection.db.dropDatabase().catch(err => console.log(err));
  }
}

const closeDBConnection = async () => {
  await mongoose.connection.close().catch(err => console.log(err));
}

module.exports = async () => {
    await dropTestDB();
    await closeDBConnection();
    console.log("Running global Tear Down");

}