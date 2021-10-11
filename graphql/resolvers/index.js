const jwt = require("jsonwebtoken");
const geolib = require("geolib");
const { GraphQLUpload } = require("graphql-upload");
const { getLocation, sendEmail, makeBody } = require("../../utils");
const { uploadFile } = require("../../swift");

const { Vehicle, PartialVehicle } = require("../../models/vehicle");
const { Animal, PartialAnimal } = require("../../models/animal");
const User = require("../../models/user");
const Neighborhood = require("../../models/neighborhood");
var admin = require("firebase-admin");

var uuid = require('uuid');

const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";

// import { initializeApp } from 'firebase/app';
// import {getAuth } from 'firebase/auth';
// import {getFirestore } from 'firebase/firestore';

// const firebaseApp = initializeApp({
//     apiKey: "AIzaSyBdtgJTpg8-pYIb7sMny70qeJICM-fiSqY",
//     authDomain: "nsfopendata.firebaseapp.com",
//     projectId: "nsfopendata",
//     storageBucket: "nsfopendata.appspot.com",
//     messagingSenderId: "534112304877",
//     appId: "1:534112304877:web:82adc6a18d014a931cd6e4",
//     measurementId: "G-67PGJ786CW"
// });

// const auth = getAuth(firebaseApp);
// const db = getFirestore(firebaseApp);

admin.initializeApp();

module.exports = {
    Upload: GraphQLUpload,

    vehicles: async (_, { user }) => {
        if (!user) throw new Error("Authentication needed");
        const { role, neighborhood } = user[DOMAIN];
        if (role === "DEVELOPER") return Vehicle.find();

        const vehiclesFetched = await Vehicle.find({ neighborhood });
        return vehiclesFetched.map(vehicle => {
            // check if role has permissions
            if (!user || !["PRIVILEGED", "ADMIN"].includes(role)) vehicle.license = null;
            return vehicle;
        });
    },

    animals: async (_, { user }) => {
        if (!user) throw new Error("Authentication needed");
        const { role, neighborhood } = user[DOMAIN];
        if (role === "DEVELOPER") return Animal.find();
        console.log(neighborhood);
        return Animal.find({ neighborhood });
    },

    neighborhoods: async () => {
        return Neighborhood.find();
    },

    findVehicles: async ({ params }) => {
        console.log("findVehicles called");
        console.dir(params);
        // remove falsey properties
        Object.keys(params).forEach(k => params[k] == false && delete params[k]);
        return Vehicle.find(params);
    },

    findAnimals: async ({ params }) => {
        console.log("findAnimals called");
        console.dir(params);
        // remove falsey properties
        Object.keys(params).forEach(k => params[k] == false && delete params[k]);
        return Animal.find(params);
    },

    nearestNeighborhood: async ({ location }) => {
        const locations = await Neighborhood.find();
        const points = locations.map(n => n.location); // create array of locations

        const nearest = geolib.findNearest(location, points);
        const neighborhood = locations.find(e => e.location === nearest);
        return neighborhood;
    },

    // a function that uploads a file given name and stream
    // uploadFile: async ({ stream, filename }) => {
    //     const path = `images/${shortid.generate()}-${filename}`;

    //     return new Promise((resolve, reject) => 
    //         stream
    //             .pipe(fs.createWriteStream(path))
    //             .on("finish", () => resolve({ path }))
    //             .on("error", reject),
    //     )
    // },
    getUniqueID: async () => { // generates unique ID's to save images
        return uuid.v4();
    },

    createVehicle: async ({ vehicle}, { user }) => {
        console.log("\ncreateVehicle called\n");
        const { lat, lon, name } = vehicle.location;
        if (!name) vehicle.location.name = await getLocation(lat, lon);
        if (!vehicle.neighborhood) vehicle.neighborhood = user[DOMAIN].neighborhood;

        const {neighborhood, color, make, model, license} = vehicle;
        const partial = await PartialVehicle.find({
            neighborhood,
            color,
            make,
            model,
            ...(license && { license }), // include license only if supplied
        }).populate("createdBy");

        // creates a Vehicle object from passed in vehicle info including images
        const vehicleDoc = new Vehicle(vehicle); 
        if (partial.length)
            partial.forEach(p => {
                sendEmail(p.createdBy.email, "Vehicle hotlist description matched.", makeBody(vehicleDoc));
            });


        // newVehicle.picture = await uploadFile(picture.createReadStream(), picture.filename);

        const newVehicle = await vehicleDoc.save();
        return newVehicle;
    },

    createPartialVehicle: async ({ partial }, { user }) => {
        if (!user) throw new Error("Authentication needed");
        const { neighborhood, role } = user[DOMAIN];
        if (role === "USER") throw new Error("Need to be at least a privileged user.");
        const partialVehicleDoc = new PartialVehicle({ createdBy: user.sub, neighborhood, ...partial });
        const partialVehicle = await partialVehicleDoc.save().then(a => a.populate("createdBy").execPopulate());

        return partialVehicle;
    },

    createNeighborhood: async (args, { user }) => {
        if (!user) throw new Error("authentication needed");
        const neighborhoodDoc = new Neighborhood(args);
        return neighborhoodDoc.save();
    },

    createAnimal: async ({ animal }, { user }) => {
        const { lat, lon, name } = animal.location;
        if (!name) animal.location.name = await getLocation(lat, lon);
        if (!animal.neighborhood) animal.neighborhood = user[DOMAIN].neighborhood;

        const { breed, color, type, neighborhood, files } = animal;
        const partial = await PartialAnimal.find({
            breed,
            color,
            type,
            neighborhood,
        }).populate("createdBy");

        const animalDoc = new Animal(animal);

        console.log(files);
        if (files) {
            animal.files = [];
            for (let file of files) {
                console.log("this is a file", file); // logging this shows file has a file object
                const { filename: name, stream } = file;
                const prefix = `{type}/${animalDoc._doc._id}`;
                const status = await uploadFile(prefix, name, stream);
                if (status === 201) {
                    console.log(`${prefix}/${name} created successfully`);
                    animal.files.push(name);
                } else console.log(`${name} bugged with status ${status}\n`);
            }
        }

        if (partial.length)
            partial.forEach(p => {
                console.log(`match for partial found: ${p.createdBy.email}`);
                sendEmail(p.createdBy.email, "Animal hotlist description matched.", makeBody(animalDoc));
            });

        const newAnimal = await animalDoc.save();
        return newAnimal;
    },

    // to create descriptions that can be matched against to alert the user
    createPartialAnimal: async ({ partial }, { user }) => {
        if (!user) throw new Error("Authentication needed");
        console.log(user);
        const { neighborhood } = user[DOMAIN];
        const partialAnimalDoc = new PartialAnimal({ createdBy: user.sub, neighborhood, ...partial });
        console.log(partialAnimalDoc);
        const partialAnimal = await partialAnimalDoc.save().then(a => a.populate("createdBy").execPopulate());
        console.log("created partial animal description", partialAnimal);
        return partialAnimal;
    },

    me: async (_, { user }) => {
        const found = await User.findById(user.sub).populate("neighborhood");
        if (!found) throw new Error("User not found.");
        return found;
    },

    addPrivilege: async ({ email }, { user }) => {
        console.log(email, user);
        const author = await User.findById(user.sub);
        if (!author || author.role !== "ADMIN") throw new Error("You are missing or have invalid credentials.");

        const found = await User.findOne({ email: email });
        if (!found) throw new Error("No user found for that email.");

        found.role = "PRIVILEGED";
        await found.save();
        return `${found.name} has been given access privileges.`;
    },

    register: async args => {
        const { name, email, neighborhood } = args.user;
        console.log(neighborhood);
        const neighborhoodFound = await Neighborhood.findOne({ name: neighborhood });
        console.log(neighborhoodFound);
        if (!neighborhoodFound) throw new Error(`Neighborhood with name ${neighborhood} not found`);

        const user = new User({
            name,
            email,
            role: "USER",
            neighborhood: neighborhoodFound.id,
        });
        const newUser = await user.save().then(u => u.populate("neighborhood").execPopulate());
        return newUser;
    },

    /**
     * Logs the user in or redirects if not registered.
     * Note: to pass in the actual idToken, call the user.getIdToken() method
     * @param {Object} args - idToken and email: 
     * @returns LoginPayload
     */
    login: async ({ idToken, email }) => {
        // verify the token
        // idToken comes from the client app
        var token = " "
        var isRegistered = true;

        admin
            .auth()
            .verifyIdToken(idToken)
            .then((decodedToken) => {
                const uid = decodedToken.uid;
                console.log("UID:  ", uid); // todo: delete this line after testing
            // ...
            })
            .catch((error) => {
                // Handle error
                
                throw new Error(error);
            });

        // if the user is in our database, log him in
        // else, redirect to sign up page to provide further information
        const user = await User.findOne({ email: email }).populate("neighborhood");

        // if the user is not registered, return empty token and false registration
        if (!user){
            isRegistered = false;
            return { isRegistered, token };
        } 

        console.log("User logged in:", user, new Date());
        const { id, role, neighborhood } = user;
        // eslint-disable-next-line no-const-assign
        token = jwt.sign(
            {
                [DOMAIN]: {
                    email,
                    role,
                    neighborhood: neighborhood.name,
                },
            },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                subject: id,
                expiresIn: "7d",
            }
        );
        return { isRegistered, token, user };
    },
};