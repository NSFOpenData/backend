const mongoose = require("mongoose");
const { locationSchema } = require("./location");

const Schema = mongoose.Schema;

const animalSchema = new Schema(
    {
        location: {
            type: locationSchema,
            required: true,
        },
        color: String,
        breed: String,
        type: String,
        files: [String],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Animal", animalSchema, "Animals");
