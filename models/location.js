const mongoose = require("mongoose");

const { Schema } = mongoose;

const locationSchema = new Schema({
    lat: { type: String, required: true },
    lon: { type: String, required: true },
    name: String,
});

module.exports = { locationSchema };
