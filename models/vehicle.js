const mongoose = require("mongoose");
const { locationSchema } = require("./location");

const Schema = mongoose.Schema;

const vehicleSchema = new Schema(
    {
        location: {
            type: locationSchema,
            required: true,
        },
        neighborhood: String,
        color: String,
        make: String,
        model: String,
        license: String,
        files: [String],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Vehicle", vehicleSchema, "Vehicles"); // specify collection name
