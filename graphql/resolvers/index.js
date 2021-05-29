const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const Vehicle = require("../../models/vehicle")
const Animal = require("../../models/animal")
const User = require("../../models/user")

module.exports = {
    vehicles: async (_, { user }) => {
        try {
            const vehiclesFetched = await Vehicle.find()
            return vehiclesFetched.map(vehicle => {
                let info = {
                    ...vehicle._doc,
                    _id: vehicle.id,
                    createdAt: new Date(vehicle._doc.createdAt),
                }
                if (!user || user["https://nsf-scc1.isis.vanderbilt.edu/graphql"].role !== "USER") 
                    info["license"] = null
                return info
            })
        } catch (error) {
            throw error
        }
    },

    createVehicle: async args => {
        try {
            const { location, color, make, model, license } = args.vehicle
            const vehicle = new Vehicle({
                location,
                color,
                make,
                model,
                license,
            })
            const newVehicle = await vehicle.save()
            return { ...newVehicle._doc, _id: newVehicle.id }
        } catch (error) {
            throw error
        }
    },

    animals: async () => {
        try {
            const animalsFetched = await Animal.find()
            return animalsFetched.map(animal => {
                return {
                    ...animal._doc,
                    _id: animal.id,
                    createdAt: new Date(animal._doc.createdAt),
                }
            })
        } catch (error) {
            throw error
        }
    },

    createAnimal: async args => {
        try {
            const { location, color, breed, type } = args.animal
            const animal = new Animal({
                location,
                color,
                breed,
                type,
            })
            const newAnimal = await animal.save()
            return { ...newAnimal._doc, _id: newAnimal.id }
        } catch (error) {
            throw error
        }
    },

    me: async (_, { user }) => {
        try {
            return await User.findById(user.sub)
        } catch (error) {
            throw error
        }
    },

    register: async args => {
        try {
            const { name, email, password } = args.user
            user = new User({
                name,
                email,
                password: await bcrypt.hash(password, 10),
                role: "USER",
            })
            const newUser = await user.save()
            return { ...newUser._doc, _id: newUser.id }
        } catch (error) {
            throw error
        }
    },

    login: async args => {
        const { email, password } = args
        console.log(email)
        console.log(password)
        const user = await User.findOne({"email": email})
        console.log(user)
        if (!user) throw new Error("User not found.")
        const { id, password: dbPassword, role } = user

        const valid = await bcrypt.compare(password, dbPassword)
        if (!valid) throw new Error("Invalid password.")

        return jwt.sign(
            {
                "https://nsf-scc1.isis.vanderbilt.edu/graphql": {
                    "email": email,
                    "role": role,
                }
            },
            process.env.JWT_SECRET,
            {
                "algorithm": "HS256",
                "subject": id,
                "expiresIn": "7d",
            }
        )
    }, 

}
