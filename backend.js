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
const uuid = require("uuid");

const { makeExecutableSchema } = require("@graphql-tools/schema");

require("dotenv").config();
const { DB, JWT_SECRET, NODE_ENV, SENTRY_URL } = process.env;

Sentry.init({ dsn: SENTRY_URL });

const app = express();

app.use(Sentry.Handlers.requestHandler());

app.use(cors());

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

const schema = makeExecutableSchema({
    typeDefs: graphqlSchema,
    resolvers: graphqlResolvers,
});

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
// const checkValidID = async (id, item) => {
//     item = item.toLowerCase();
//     // map to the database model
//     const object = {
//         vehicle: Vehicle,
//         animal: Animal,
//     };
//     // check if it is in the object
//     if (!Object.prototype.hasOwnProperty.call(object, item)) return false;

//     const found = await object[item].findById(id);
//     return found;
// };

// endpoint to get images from the server
app.get("/file/:type/:id/:filename", async (req, res) => {
    const { type, id, filename } = req.params;
    console.log(`${filename} requested to be served`);

    // verify uuid
    if (!uuid.validate(id)) res.status(404).send(`no ${type} with that id found, type or id might be incorrect`);

    try {
        const prefix = `${type}/${id}`;
        const file = await getFile(prefix, filename);
        res.send(await file.buffer());
    } catch (error) {
        console.log(error);
        res.sendStatus(error);
    }
});

app.post("/upload", upload.array("images"), async (req, res) => {
    //setFileName(`vehicle/${imagesID}/${fileChangeEvent.target.files[0].name}`);

    const id = uuid.v4();

    const { type } = req.body;

    if (!type) res.status(400).send("Id field required");

    // do the uploads
    let uploads = [];
    try {
        for (let file of req.files) {
            console.log(file);
            var { originalname: name, buffer } = file;
            // console.log("original buffer: ", buffer);
            const prefix = `${type}/${id}`;
            console.log(prefix);

            // remove all spaces from name
            name = name.replaceAll(" ", "");

            const status = await uploadFile(prefix, name, buffer).catch(error => {
                console.log(error);
                throw error;
            });
            if (status === 201) {
                console.log(status);
                uploads.push(`${prefix}/${name}`);
            } else {
                console.log(status);
            }
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    console.log("uploads: ", uploads);

    res.status(200).send(uploads);
});

app.use(Sentry.Handlers.errorHandler());

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
        schema: schema,
        graphiql: true,
    })
);

const uri = DB;
const options = {};
mongoose
    .connect(uri, options)
    .then(() => app.listen(3000, console.log(`Server is running, env: ${NODE_ENV || "development"}`)))
    .catch(error => {
        throw error;
    });
