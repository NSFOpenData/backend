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


const html = `
<!DOCTYPE html>
    <head><title>nsf open data</title></head>
    <body>
    Hello World! This is a GraphQL API. Check out /graphql or /playground<br>
    <form action="/upload" enctype="multipart/form-data" method="post">
    <div>
        <input type="file" name="file">
        <input type="submit" value="upload">            
    </div>
    </form>
    </body>
</html>
`

app.get("/", (req, res) => {
    res.send(html);
});

app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), async function (req, res) {
    const status = await uploadFile(req.file.originalname, req.file.buffer);
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
