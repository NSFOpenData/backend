// script to delete data based on the data retention policy of neighborhoods
const mongoose = require("mongoose");

const Neighborhood = require("../models/neighborhood");
const Vehicle = require("../models/vehicle");
const Animal = require("../models/animal");

require("dotenv").config();
const { DB } = process.env;

const parseTimeString = timestring => {
    // slice something like 7d to 7 and d
    const modifier = {
        d: 24 * 60 * 60 * 1000, // number of ms in a day
        h: 60 * 60 * 1000,
    };
    const duration = timestring.slice(-1);
    const number = Number(timestring.slice(0, -1));
    return number * modifier[duration];
};

async function deleteData() {
    const neighborhoods = await Neighborhood.find();
    neighborhoods.forEach(async n => {
        const delta = parseTimeString(n.dataRetention);
        const current = new Date();
        // get current time - data retention time to check if object creation time is past it
        const subtracted = new Date(current.getTime() - delta);

        const deletedVehicles = await Vehicle.deleteMany({ neighborhood: n.name, createdAt: { $lte: subtracted } });
        if (deletedVehicles.ok) console.log(`deleted ${deletedVehicles.deletedCount} vehicles`);

        const deletedAnimals = await Animal.deleteMany({ neighborhood: n.name, createdAt: { $lte: subtracted } });
        if (deletedAnimals.ok) console.log(`deleted ${deletedAnimals.deletedCount} animals`);
    });
}

const uri = DB;
const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };
(async () => {
    await mongoose.connect(uri, options);
    await deleteData();
    process.exit(0);
})();
