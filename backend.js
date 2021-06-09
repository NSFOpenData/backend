const express = require("express");
const expressJWT = require("express-jwt");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const { uploadFile, getFile } = require("./swift");
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
        <input type="file" name="images">
        <input type="submit" value="upload">            
    </div>
    </form>
    </body>
</html>
`;

app.get("/", (req, res) => {
    res.send(html);
});

app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.array("images"), async function (req, res) {
    let summary = "";
    try {
        for (let file of req.files) {
            const status = await uploadFile(file.originalname, file.buffer);
            if (status === 201) summary += `${file.originalname} created successfully\n`;
            else summary += `${file.originalname} bugged with status ${status}\n`;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
    return res.send(summary);
});

app.get("/file/:filename", async (req, res) => {
    console.log(`${req.params.filename} requested to be served`)
    const file = await getFile(req.params.filename);
    res.send(await file.buffer());
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
