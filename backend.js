const express = require("express");
const expressJWT = require("express-jwt");
const Sentry = require("@sentry/node");
const { graphqlHTTP } = require("express-graphql");
const { graphqlUploadExpress } = require("graphql-upload");
const helmet = require("helmet");
const multer = require("multer");
const expressPlayground = require("graphql-playground-middleware-express").default; // for testing auth
const cors = require("cors");
const mongoose = require("mongoose");

const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");
const { uploadFile, getFile } = require("./swift");
const { Animal } = require("./models/animal");
const { Vehicle } = require("./models/vehicle");
const uuid = require('uuid');

require("dotenv").config();
const { DB, JWT_SECRET, NODE_ENV, SENTRY_URL } = process.env;

Sentry.init({ dsn: SENTRY_URL });

const app = express();

app.use(Sentry.Handlers.requestHandler());

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

app.get("/debug-sentry", function mainHandler() {
    throw new Error("My first Sentry error!");
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * validate if item with given id exists, used in uploads and downloads of files
 * @param {String} id the id of item to check
 * @param {String} item animal / vehicle to fetch the object from
 * @returns the object if found else null
 */
const checkValidID = async (id, item) => {
    console.log(`checking valid id for id: ${id} and item: ${item}`);
    item = item.toLowerCase();
    // map to the database model
    const object = {
        vehicle: Vehicle,
        animal: Animal,
    };
    // check if it is in the object
    if (!Object.prototype.hasOwnProperty.call(object, item)) return false;

    const found = await object[item].findById(id);
    console.log(found);
    return found;
};

// TODO: NOT FINISHED YET
app.post("/upload_new", upload.array("images"), async (req, res) => {
    let summary = "";
    let item = ""; 

    const { id, type } = req.body;

    if (!id || !type) res.status(400).send("both type and id fields required");

    // check valid id
    item = await uuid.validate(id);
    if (!item) res.status(404).send(`Invalid uuid provided`);

    // do the uploads
    let uploads = [];
    try {
        console.log("\nfiles: ", req.files);
        for (let file of req.files) {
            const { originalname: name, buffer } = file;
            const prefix = `${type}/${id}`;
            // if (item.files.includes(name)) { // FIXME: Logic not relevant for now
            //     summary += `file exists with name: ${prefix}/${name}, skipping... <br>`;
            //     continue;
            // }
            const status = await uploadFile(prefix, name, buffer);
            if (status === 201) {
                summary += `${prefix}/${name} created successfully<br>`;
                uploads.push(name);
            } else summary += `${name} bugged with status ${status}\n`;
        }

        console.log("summary: ", summary);
        // if (type == "vehicle"):

        // todo: create new object including files

        // // update the files field in the object
        // if (item.files) item.files.push(...uploads);
        // else item.files = uploads;
        // console.log(item);
        // await item.save();
    } catch (error) {
        console.log(error);
        throw error;
    }
    console.log("uploads", uploads);
    

    // send successfull response // todo: not finished yet
    res.status(200).send(uploads);
});

// endpoint to get images from the server
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

app.use(Sentry.Handlers.errorHandler());

app.use(cors());

app.use(helmet());

app.use(
    expressJWT({
        secret: JWT_SECRET,
        algorithms: ["HS256"],
        credentialsRequired: false,
    })
);

app.use(
    "/graphql",
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolvers,
        graphiql: true,
    })
);

const uri = DB;
const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };
mongoose
    .connect(uri, options)
    .then(() => app.listen(3000, console.log(`Server is running, env: ${NODE_ENV || "development"}`)))
    .catch(error => {
        throw error;
    });
