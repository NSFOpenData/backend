const mongoose = require("mongoose")

const Schema = mongoose.Schema

const animalSchema = new Schema(
    {
        location: {
            type: [String],
            required: true,
        },
        color: String,
        breed: String,
        type: String,
    }, 
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Animal", animalSchema, "Animals")
