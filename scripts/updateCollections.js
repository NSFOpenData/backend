// one off script to modify all entries of a collection
const mongoose = require("mongoose");

const Neighborhood = require("../models/neighborhood");
const Vehicle = require("../models/vehicle");
const Animal = require("../models/animal");

require("dotenv").config();
const { DB } = process.env;

// don't do this in prod tbh
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

const updateCollection = async collection => {
    const neighborhoods = await Neighborhood.find().select("name");
    const choices = neighborhoods.map(n => n.name);
    const items = await collection.find();
    // add a neighborhood field to each item
    items.forEach(async element => {
        element.neighborhood = choices.random();
        await element.save();
    });
    console.log("made items have random neighborhood");
};

const uri = DB;
const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };
(async () => {
    await mongoose.connect(uri, options);
    await updateCollection(Vehicle);
    await updateCollection(Animal);
    process.exit(0);
})();
