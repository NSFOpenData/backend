const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const geolib = require("geolib");
const { getLocation } = require("../../utils");

const Vehicle = require("../../models/vehicle");
const Animal = require("../../models/animal");
const User = require("../../models/user");
const Neighborhood = require("../../models/neighborhood");

module.exports = {
    vehicles: async (_, { user }) => {
        if (!user) throw new Error("Authentication needed");
        const { role, neighborhood } = user["https://nsf-scc1.isis.vanderbilt.edu/graphql"];
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
        const { role, neighborhood } = user["https://nsf-scc1.isis.vanderbilt.edu/graphql"];
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
        if (!vehicle.neighborhood)
            vehicle.neighborhood = user["https://nsf-scc1.isis.vanderbilt.edu/graphql"].neighborhood;
        const vehicleDoc = new Vehicle(vehicle);
        const newVehicle = await vehicleDoc.save();
        return newVehicle;
    },

    createNeighborhood: async (args, { user }) => {
        if (!user) throw new Error("authentication needed");
        const neighborhoodDoc = new Neighborhood(args);
        return neighborhoodDoc.save();
    },

    createAnimal: async ({ animal }, { user }) => {
        const { lat, lon, name } = animal.location;
        if (!name) animal.location.name = getLocation(lat, lon);
        if (!animal.neighborhood)
            animal.neighborhood = user["https://nsf-scc1.isis.vanderbilt.edu/graphql"].neighborhood;
        const animalDoc = new Animal(animal);
        const newAnimal = await animalDoc.save();
        return newAnimal;
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
        const newUser = await user.save();
        return await newUser.populate("neighborhood");
    },

    login: async ({ email, password }) => {
        const user = await User.findOne({ email: email }).populate("neighborhood");
        console.log("User logged in:", user, new Date());
        if (!user) throw new Error("User not found.");
        const { id, password: dbPassword, role, neighborhood } = user;

        const valid = await bcrypt.compare(password, dbPassword);
        if (!valid) throw new Error("Invalid password.");

        return jwt.sign(
            {
                "https://nsf-scc1.isis.vanderbilt.edu/graphql": {
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
    },
};
