const express = require("express");
const expressJWT = require("express-jwt");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const { uploadFile } = require("./swift");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const multer = require("multer");
const expressPlayground = require("graphql-playground-middleware-express").default; // for testing auth

require("dotenv").config();

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World! This is a GraphQL API. Check out /graphql or /playground");
});

app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), async function (req, res) {
    const status = await uploadFile(req.originalname, req.buffer);
    if (status === 201) return res.send("file created successfully");
    if (status === 503) return res.send("service unavailable 503");
    return res.send(status);
});

app.use(cors());

app.use(helmet());

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
    .catch(error => {
        throw error;
    });
