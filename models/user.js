const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        neighborhood: { type: Schema.Types.ObjectId, required: true, ref: "Neighborhood" },
        role: {
            type: String,
            enum: ["USER", "ADMIN", "PRIVILEGED", "DEVELOPER"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema, "Users"); // specify collection name
