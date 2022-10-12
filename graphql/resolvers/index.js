const jwt = require("jsonwebtoken");
const geolib = require("geolib");
const { GraphQLUpload } = require("graphql-upload");
const { getLocation, sendEmail, makeBody } = require("../../utils");

const { Vehicle, PartialVehicle } = require("../../models/vehicle");
const { Animal, PartialAnimal } = require("../../models/animal");
const User = require("../../models/user");
const Neighborhood = require("../../models/neighborhood");
// var admin = require("firebase-admin");
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = require ('../../lib/constants');
const {generateToken, verifyToken} = require ('../../lib/auth');
const client = new OAuth2Client(CLIENT_ID.id);


var uuid = require("uuid");

const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";

// admin.initializeApp({
//     apiKey: "AIzaSyBdtgJTpg8-pYIb7sMny70qeJICM-fiSqY",
//     authDomain: "nsfopendata.firebaseapp.com",
//     projectId: "nsfopendata",
//     storageBucket: "nsfopendata.appspot.com",
//     messagingSenderId: "534112304877",
//     appId: "1:534112304877:web:82adc6a18d014a931cd6e4",
//     measurementId: "G-67PGJ786CW",
// });

module.exports = {
    Upload: GraphQLUpload,

    Query: {
        vehicles: async (_, args, { user }) => {
            if (!user) throw new Error("Authentication needed");
            const { role, neighborhood } = user[DOMAIN];
            if (role === "DEVELOPER") return Vehicle.find({});

            const vehiclesFetched = await Vehicle.find({ neighborhood });
            return vehiclesFetched.map(vehicle => {
                // check if role has permissions
                if (!user || !["PRIVILEGED", "ADMIN"].includes(role)) vehicle.license = null;
                return vehicle;
            });
        },

        animals: async (_, args, { user }) => {
            console.log("animals called");
            if (!user) throw new Error("Authentication needed");
            const { role, neighborhood } = user[DOMAIN];
            if (role === "DEVELOPER") return Animal.find({});
            return Animal.find({ neighborhood });
        },

        neighborhoods: async () => {
            return Neighborhood.find();
        },

        findVehicles: async (_, { params }) => {
            Object.keys(params).forEach(k => params[k] == false && delete params[k]);
            return Vehicle.find(params);
        },

        findAnimals: async (_, { params }) => {
            Object.keys(params).forEach(k => params[k] == false && delete params[k]);
            return Animal.find(params);
        },

        nearestNeighborhood: async (_, { location }) => {
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
        getUniqueID: async () => {
            return uuid.v4();
        },

        me: async (_, args, { user }) => {
            const found = await User.findById(user.sub).populate("neighborhood");
            if (!found) throw new Error("User not found.");
            return found;
        },
    },

    Mutation: {
        createVehicle: async (_, { vehicle }, { user }) => {
            console.log("input vehicle ", vehicle);

            if (!user) throw new Error("Authentication needed");

            const { lat, lon, name } = vehicle.location;
            if (!name) vehicle.location.name = await getLocation(lat, lon);
            if (!vehicle.neighborhood) vehicle.neighborhood = user[DOMAIN].neighborhood;

            const { neighborhood, color, make, model, license } = vehicle;
            const partial = await PartialVehicle.find({
                neighborhood,
                color,
                make,
                model,
                ...(license && { license }), // include license only if supplied
            }).populate("createdBy");

            // creates a Vehicle object from passed in vehicle info including images
            const vehicleDoc = new Vehicle(vehicle);
            console.log("partial", partial);
            if (partial.length)
                partial.forEach(async p => {
                    var body = await makeBody(vehicleDoc);
                    if (process.env.NODE_ENV !== "test")
                        sendEmail(p.createdBy.email, "Vehicle hotlist description matched.", body);
                });

            const newVehicle = await vehicleDoc.save();
            return newVehicle;
        },

        createPartialVehicle: async (_, { partial }, { user }) => {
            if (!user) throw new Error("Authentication needed");
            const { neighborhood, role } = user[DOMAIN];
            if (role === "USER") throw new Error("Need to be at least a privileged user.");
            const partialVehicleDoc = new PartialVehicle({ createdBy: user.sub, neighborhood, ...partial });
            const partialVehicle = await partialVehicleDoc.save().then(a => a.populate("createdBy"));

            return partialVehicle;
        },

        createNeighborhood: async (_, args, { user }) => {
            if (!user) throw new Error("authentication needed");
            const neighborhoodDoc = await Neighborhood.create(args.neighborhood);
            return neighborhoodDoc;
        },

        createAnimal: async (_, { animal }, { user }) => {
            console.log("input animal ", animal);
            if (!user) throw new Error("Authentication needed");
            const { lat, lon, name } = animal.location;
            if (!name) animal.location.name = await getLocation(lat, lon);
            if (!animal.neighborhood) animal.neighborhood = user[DOMAIN].neighborhood;

            const { breed, color, type, neighborhood } = animal;
            const partial = await PartialAnimal.find({
                breed,
                color,
                type,
                neighborhood,
            }).populate("createdBy");

            const animalDoc = new Animal(animal);

            if (partial.length)
                partial.forEach(async p => {
                    var body = await makeBody(animalDoc);
                    if (process.env.NODE_ENV !== "test")
                        sendEmail(p.createdBy.email, "Animal hotlist description matched.", body);
                });

            const newAnimal = await animalDoc.save();
            return newAnimal;
        },

        // to create descriptions that can be matched against to alert the user
        createPartialAnimal: async (_, { partial }, { user }) => {
            console.log("input partial animal ", partial);
            if (!user) throw new Error("Authentication needed");
            const { neighborhood } = user[DOMAIN];
            const partialAnimalDoc = new PartialAnimal({ createdBy: user.sub, neighborhood, ...partial });
            const partialAnimal = await partialAnimalDoc.save().then(a => a.populate("createdBy"));
            return partialAnimal;
        },

        addPrivilege: async (_, { email }, { user }) => {
            if (!user) throw new Error("Authentication needed");
            const author = await User.findById(user.sub);
            if (!author || author.role !== "ADMIN") throw new Error("You are missing or have invalid credentials.");

            const found = await User.findOne({ email: email });
            if (!found) throw new Error("No user found for that email.");

            found.role = "PRIVILEGED";
            await found.save();
            return `${found.name} has been given access privileges.`;
        },

        register: async (_, args) => {
            const { name, email, neighborhood } = args.user;
            const neighborhoodFound = await Neighborhood.findOne({ name: neighborhood });
            if (!neighborhoodFound) return {status: "INVALID_NEIGHBORHOOD"};
            const userFound = await User.findOne({ email: email }).populate("neighborhood");
            if (userFound) return {status: "USER_EXISTS"}

            const user = new User({
                name,
                email,
                role: "USER",
                neighborhood: neighborhoodFound.id,
            });

            const newUser = await user.save().then(u => u.populate("neighborhood"));
            const newToken = await generateToken(newUser);
            return {status: "SUCCESS", user: newUser, token: newToken};
        },

        /**
         * Logs the user in or redirects if not registered.
         * Note: to pass in the actual idToken, call the user.getIdToken() method
         * @param {Object} args - idToken
         * @returns status and user info
         */
        login: async (_, {token}) => {
            //verify token
            const verify  = await verifyToken(token).catch(e => console.log(e));
            if (verify.status !== "VALID_USER"){
                return verify;
            }
            const user = verify.user;
            //generate token
            const newToken = await generateToken(user);
            return {status: "SUCCESS", user: user, token : newToken };
        },
    },
};
