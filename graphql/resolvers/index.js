const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getLocation } = require("../../utils");

const Vehicle = require("../../models/vehicle");
const Animal = require("../../models/animal");
const User = require("../../models/user");

module.exports = {
    vehicles: async (_, { user }) => {
        const vehiclesFetched = await Vehicle.find();
        return vehiclesFetched.map(vehicle => {
            // check if role has permissions
            if (!user || !["PRIVILEGED", "ADMIN"].includes(user["https://nsf-scc1.isis.vanderbilt.edu/graphql"].role))
                vehicle.license = null;
            return vehicle;
        });
    },

    findVehicles: async ({ params }) => {
        console.log("findVehicles called");
        console.dir(params);
        // remove falsey properties
        Object.keys(params).forEach(k => params[k] == false && delete params[k]);
        return Vehicle.find(params);
    },

    createVehicle: async ({ vehicle }) => {
        const { lat, lon, name } = vehicle.location;
        if (!name) vehicle.location.name = getLocation(lat, lon);
        const vehicleDoc = new Vehicle(vehicle);
        const newVehicle = await vehicleDoc.save();
        return newVehicle;
    },

    animals: async () => {
        return Animal.find();
    },

    findAnimals: async ({ params }) => {
        console.log("findAnimals called");
        console.dir(params);
        // remove falsey properties
        Object.keys(params).forEach(k => params[k] == false && delete params[k]);
        return Animal.find(params);
    },

    createAnimal: async ({ animal }) => {
        const { lat, lon, name } = animal.location;
        if (!name) animal.location.name = getLocation(lat, lon);
        const animalDoc = new Animal(animal);
        const newAnimal = await animalDoc.save();
        return newAnimal;
    },

    me: async (_, { user }) => {
        const found = await User.findById(user.sub);
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
        const { name, email, password } = args.user;
        const user = new User({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            role: "USER",
        });
        const newUser = await user.save();
        return newUser;
    },

    login: async ({ email, password }) => {
        const user = await User.findOne({ email: email });
        console.log("User logged in:", user, new Date());
        if (!user) throw new Error("User not found.");
        const { id, password: dbPassword, role } = user;

        const valid = await bcrypt.compare(password, dbPassword);
        if (!valid) throw new Error("Invalid password.");

        return jwt.sign(
            {
                "https://nsf-scc1.isis.vanderbilt.edu/graphql": {
                    email,
                    role,
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
