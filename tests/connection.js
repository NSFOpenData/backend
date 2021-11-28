const mongoose = require('mongoose');
require("dotenv").config();

process.env.NODE_ENV = 'test';
const uri = process.env.DB_TEST;

const connectTestDB = async () => {
  await mongoose.connect(uri, {}).catch(err => console.log(err));
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

