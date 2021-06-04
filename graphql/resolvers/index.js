const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    createVehicle: async ({ vehicle }) => {
        const vehicleDoc = new Vehicle(vehicle);
        const newVehicle = await vehicleDoc.save();
        return newVehicle;
    },

    animals: async () => {
        return Animal.find();
    },

    createAnimal: async ({ animal }) => {
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
        if (!author || author.role !== "ADMIN")
            throw new Error("You are missing or have invalid credentials.");
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
                    email: email,
                    role: role,
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
