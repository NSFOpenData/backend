const User = require("../models/user");
const mongoose = require("mongoose");
require("dotenv").config();

function printUsage() {
    console.log("hello");
}

async function changeRole(email, role) {
    console.log(email);
    let user = await User.find({email: email});
    if (!user) throw new Error(`User with email ${email} not found.`);
    console.log(user);
}


(async () => {
    const args = process.argv.splice(process.execArgv.length);
    console.log(args);
    if (!args.length || args.length > 4) printUsage();

    try {
        const uri = process.env.DB;
        const options = { useNewUrlParser: true, useUnifiedTopology: true };
        await mongoose.connect(uri, options);
        await Promise.all(
            args[3].split(',').map(email => changeRole(email, "ADMIN"))
        );
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
