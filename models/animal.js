const mongoose = require("mongoose");
const { locationSchema } = require("./location");

const Schema = mongoose.Schema;

const animalSchema = new Schema(
    {
        location: {
            type: locationSchema,
            required: true,
        },
        neighborhood: String,
        color: String,
        breed: String,
        type: String,
        files: [String],
    },
    {
        timestamps: true,
    }
);

const partialAnimalSchema = new Schema(
    {
        neighborhood: String,
        color: String,
        breed: String,
        type: String,
        createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    },
    {
        timestamps: true,
    }
);

module.exports = {
    Animal: mongoose.model("Animal", animalSchema, "Animals"),
    PartialAnimal: mongoose.model("PartialAnimal", partialAnimalSchema, "PartialAnimals"),
};
