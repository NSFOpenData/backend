// one off script to modify all entries of a collection
const mongoose = require("mongoose");

const Neighborhood = require("../models/neighborhood");
const Vehicle = require("../models/vehicle");
const Animal = require("../models/animal");
const { animals } = require("../graphql/resolvers");

require("dotenv").config();
const { DB } = process.env;

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

const uri = DB;
const options = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true };
(async () => {
    await mongoose.connect(uri, options);
    const neighborhoods = await Neighborhood.find().select("name");
    const choices = neighborhoods.map(n => n.name);
    const animals = await Vehicle.find();
    animals.forEach(async element => {
        element.neighborhood = choices.random();
        await element.save();
    });
    console.log("made vehicles have random neighborhood");
})();
