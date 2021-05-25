const mongoose = require("mongoose")

const Schema = mongoose.Schema

const vehicleSchema = new Schema(
    {
        location: {
            type: [String],
            required: true,
        },
        color: String,
        make: String,
        model: String,
        license: String
    }, 
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Vehicle", vehicleSchema)
