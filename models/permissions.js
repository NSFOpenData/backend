const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const permissionSchema = new Schema(
    {
        neighborhood: { type: String, required: true }, // neighborhood name
        readLicenseInfo: [String],
        writeData: [String],
        dataRetention: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Permissions", permissionSchema, "Permissions"); // specify collection name
