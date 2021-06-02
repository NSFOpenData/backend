const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Vehicle = require("../../models/vehicle");
const Animal = require("../../models/animal");
const User = require("../../models/user");

module.exports = {
    vehicles: async (_, { user }) => {
        const vehiclesFetched = await Vehicle.find();
        return vehiclesFetched.map((vehicle) => {
            let info = {
                ...vehicle._doc,
                _id: vehicle.id,
                createdAt: new Date(vehicle._doc.createdAt),
            };
            if (!user || user["https://nsf-scc1.isis.vanderbilt.edu/graphql"].role !== "USER") info["license"] = null;
            return info;
        });
    },

    createVehicle: async (args) => {
        const { location, color, make, model, license } = args.vehicle;
        const vehicle = new Vehicle({
            location,
            color,
            make,
            model,
            license,
        });
        const newVehicle = await vehicle.save();
        return { ...newVehicle._doc, _id: newVehicle.id };
    },

    animals: async () => {
        const animalsFetched = await Animal.find();
        return animalsFetched.map((animal) => {
            return {
                ...animal._doc,
                _id: animal.id,
                createdAt: new Date(animal._doc.createdAt),
            };
        });
    },

    createAnimal: async (args) => {
        const { location, color, breed, type } = args.animal;
        const animal = new Animal({
            location,
            color,
            breed,
            type,
        });
        const newAnimal = await animal.save();
        return { ...newAnimal._doc, _id: newAnimal.id };
    },

    me: async (_, { user }) => {
        return await User.findById(user.sub);
    },

    register: async (args) => {
        const { name, email, password } = args.user;
        const user = new User({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            role: "USER",
        });
        const newUser = await user.save();
        return { ...newUser._doc, _id: newUser.id };
    },

    login: async (args) => {
        const { email, password } = args;
        console.log(email);
        console.log(password);
        const user = await User.findOne({ email: email });
        console.log(user);
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
