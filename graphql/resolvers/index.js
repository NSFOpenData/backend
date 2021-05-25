const Vehicle = require("../../models/vehicle")

module.exports = {
    vehicles: async () => {
        try {
            const vehiclesFetched = await Vehicle.find()
            return vehiclesFetched.map(vehicle => {
                return {
                    ...vehicle._doc,
                    _id: vehicle.id,
                    createdAt: new Date(vehicle._doc.createdAt),
                }
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
}
