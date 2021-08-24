const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const geolib = require("geolib");
const { GraphQLUpload } = require("graphql-upload");
const { getLocation, sendEmail, makeBody } = require("../../utils");
const { uploadFile } = require("../../swift");

const { Vehicle, PartialVehicle } = require("../../models/vehicle");
const { Animal, PartialAnimal } = require("../../models/animal");
const User = require("../../models/user");
const Neighborhood = require("../../models/neighborhood");

const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";

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

    createVehicle: async ({ vehicle }, { user }) => {
        const { lat, lon, name } = vehicle.location;
        if (!name) vehicle.location.name = await getLocation(lat, lon);
        if (!vehicle.neighborhood) vehicle.neighborhood = user[DOMAIN].neighborhood;

        const { color, make, model, license, neighborhood } = vehicle;
        const partial = await PartialVehicle.find({
            color,
            make,
            model,
            ...(license && { license }), // include license only if supplied
            neighborhood,
        }).populate("createdBy");

        const vehicleDoc = new Vehicle(vehicle);
        if (partial.length)
            partial.forEach(p => {
                console.log(`match for partial found: ${p.createdBy.email}`);
                sendEmail(p.createdBy.email, "Vehicle hotlist description matched.", makeBody(vehicleDoc));
            });

        const newVehicle = await vehicleDoc.save();
        return newVehicle;
    },

    createPartialVehicle: async ({ partial }, { user }) => {
        if (!user) throw new Error("Authentication needed");
        const { neighborhood, role } = user[DOMAIN];
        if (role === "USER") throw new Error("Need to be at least a privileged user.");
        const partialVehicleDoc = new PartialVehicle({ createdBy: user.sub, neighborhood, ...partial });
        console.log(partialVehicleDoc);
        const partialVehicle = await partialVehicleDoc.save().then(a => a.populate("createdBy").execPopulate());
        console.log("created partial vehicle description", partialVehicle);
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
        const { name, email, password, neighborhood } = args.user;
        console.log(neighborhood);
        const neighborhoodFound = await Neighborhood.findOne({ name: neighborhood });
        console.log(neighborhoodFound);
        if (!neighborhoodFound) throw new Error(`Neighborhood with name ${neighborhood} not found`);

        const user = new User({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            role: "USER",
            neighborhood: neighborhoodFound.id,
        });
        const newUser = await user.save().then(u => u.populate("neighborhood").execPopulate());
        return newUser;
    },

    login: async ({ email, password }) => {
        const user = await User.findOne({ email: email }).populate("neighborhood");
        console.log("User logged in:", user, new Date());
        if (!user) throw new Error("User not found.");
        const { id, password: dbPassword, role, neighborhood } = user;

        const valid = await bcrypt.compare(password, dbPassword);
        if (!valid) throw new Error("Invalid password.");

        const token = jwt.sign(
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
        return { token, user };
    },
};
