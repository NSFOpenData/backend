const Vehicle = require("../../models/vehicle")
const Animal = require("../../models/animal")

module.exports = {
    vehicles: async (_, context) => {
        try {
            const vehiclesFetched = await Vehicle.find()
            return vehiclesFetched.map(vehicle => {
                let info = {
                    ...vehicle._doc,
                    _id: vehicle.id,
                    createdAt: new Date(vehicle._doc.createdAt),
                }
                const { authorization: token } = context.headers;
                if (!token || token.split(" ")[1] !== process.env.PASSWORD) 
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

}
