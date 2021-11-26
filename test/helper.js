const { createTestClient } = require('apollo-server-testing');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
require("dotenv").config();
import ourResolvers from '../graphql/resolvers';
import ourSchema from '../graphql/schema';
// const jwt = require("jsonwebtoken");


const { User } = require('../models/user');


const  { makeExecutableSchema } =  require('@graphql-tools/schema');


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

// const schemaWithResolvers = makeExecutableSchema({
//   typeDefs: ourSchema,
//   resolvers: ourResolvers
// });

const server = new ApolloServer({ 
  typeDefs: ourSchema,
  resolvers: ourResolvers,
  context: ({
    req,
    res,
  }) => ({ 
    req, 
    res,
    User,
  }),

});

module.exports = {
  testClient: createTestClient(server),
  connectTestDB,
  dropTestDB,
  closeDBConnection,
};