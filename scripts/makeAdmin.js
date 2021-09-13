const User = require("../models/user");
const mongoose = require("mongoose");
require("dotenv").config();

function printUsage() {
    console.log("Usage: node scripts/makeAdmin.js -- name@email.com,another@email.com");
    process.exit(0);
}

async function changeRole(email, role) {
    console.log(email);
    let user = await User.findOne({ email: email });
    if (!user) throw new Error(`User with email ${email} not found.`);
    user.role = role;
    await user.save();
    console.log(`User ${email} is now an admin :)`);
}

(async () => {
    const args = process.argv;
    if (!args.length || args.length !== 4) printUsage();

    try {
        const uri = process.env.DB;
        const options = { useNewUrlParser: true, useUnifiedTopology: true };
        await mongoose.connect(uri, options);
        await Promise.all(args[3].split(",").map(email => changeRole(email, "ADMIN")));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
