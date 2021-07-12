const mongoose = require("mongoose");
const permissionSchema = require("./permissions");
const { locationSchema } = require("./location");

const Schema = mongoose.Schema;

const neighborhoodSchema = new Schema(
    {
        name: { type: String, required: true }, // neighborhood name
        location: locationSchema,
        dataRetention: String,
        permissions: permissionSchema,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Neighborhood", neighborhoodSchema, "Neighborhoods"); // specify collection name
