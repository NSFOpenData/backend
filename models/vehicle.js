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

const partialVehicleSchema = new Schema(
    {
        neighborhood: String,
        color: [String],
        make: String,
        model: String,
        license: String,
        createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    },
    {
        timestamps: true,
    }
);

module.exports = {
    Vehicle: mongoose.model("Vehicle", vehicleSchema, "Vehicles"),
    PartialVehicle: mongoose.model("PartialVehicle", partialVehicleSchema, "PartialVehicles"),
};
