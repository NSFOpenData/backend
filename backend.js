const express = require("express");
const expressJWT = require("express-jwt");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const { uploadFile, getFile } = require("./swift");
const cors = require("cors");
const mongoose = require("mongoose");
const Animal = require("./models/animal");
const Vehicle = require("./models/vehicle");
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
        <input type="text" placeholder="Object ID" name="id">
        <input type="text" placeholder="Type: vehicle or animal" name="type">
        <input type="file" name="images" multiple>
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

const checkValidID = async (id, item) => {
    item = item.toLowerCase();
    const object = {
        vehicle: Vehicle,
        animal: Animal,
    };
    if (!Object.prototype.hasOwnProperty.call(object, item)) return false;

    const found = await object[item].findById(id);
    console.log(found);
    if (!found) return false;
    return true;
};

app.post("/upload", upload.array("images"), async (req, res) => {
    let summary = "";
    let item = "";
    const { id, type } = req.body;

    // check valid id
    item = await checkValidID(id, type);
    if (!item) res.status(404).send(`no ${type} with that id found, type or id might be incorrect`);

    // do the uploads
    try {
        let uploads = [];
        for (let file of req.files) {
            const { originalname: name, buffer } = file;
            const prefix = `${type}/${id}`;
            const status = await uploadFile(prefix, name, buffer);
            if (status === 201) {
                summary += `${prefix}/${name} created successfully<br>`;
                uploads.push(name);
            } else summary += `${name} bugged with status ${status}\n`;
        }
        if (item.files) item.files.push(...uploads);
        else item.files = uploads;
        console.log(item);
        await item.save(); // update db object
    } catch (error) {
        console.log(error);
        throw error;
    }
    return res.send(summary);
});

app.get("/file/:type/:id/:filename", async (req, res) => {
    const { type, id, filename } = req.params;
    console.log(`${filename} requested to be served`);

    // check valid id
    const item = await checkValidID(id, type);
    if (!item) res.status(404).send(`no ${type} with that id found, type or id might be incorrect`);

    try {
        const prefix = `${type}/${id}`;
        const file = await getFile(prefix, filename);
        res.send(await file.buffer());
    } catch (error) {
        console.log(error);
        res.sendStatus(error);
    }
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
