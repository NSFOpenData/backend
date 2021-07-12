const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const permissionSchema = new Schema({
    readLicenseInfo: [String],
    writeData: [String],
});

module.exports = permissionSchema;
