const express = require("express");
const expressJWT = require("express-jwt");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const cors = require("cors");
const mongoose = require("mongoose");
const expressPlayground = require("graphql-playground-middleware-express").default; // for testing auth

require("dotenv").config();

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World! This is a GraphQL API. Check out /graphql or /playground");
});

app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

app.use(cors());

app.use(
    expressJWT({
        secret: process.env.JWT_SECRET,
        algorithms: ["HS256"],
        credentialsRequired: false,
    })
);

app.use(
    "/graphql",
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolvers,
        graphiql: true,
    })
);

const uri = process.env.DB;
const options = { useNewUrlParser: true, useUnifiedTopology: true };
mongoose
    .connect(uri, options)
    .then(() => app.listen(3000, console.log("Server is running")))
    .catch((error) => {
        throw error;
    });
