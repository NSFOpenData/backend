require("dotenv").config();
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const serviceAccountKey = require("./serviceAccountKey.json");
const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";

const User = require("../models/user");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
});

const generateToken = async (user) => {
    const token = jwt.sign(
        {
            [DOMAIN]: {
                email : user.email,
                role : user.role,
                neighborhood: user.neighborhood,
            },
        },
        process.env.JWT_SECRET,
        {
            algorithm: "HS256",
            subject: user._id.toString(),
            expiresIn: "7d",
        }
    );
    return token;
}

/**
 * 
 * @param {string} token 
 * @returns the status of the verification and the email of the user
 */
const verifySignInToken = async (token) =>{
    console.log(token);
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        try {
            const userRecord = await admin.auth().getUser(uid);
            const email = userRecord.email;
            return ({status: 'SUCCESS', email});
        } catch (e) {
            console.log(e);
            return ({status: 'ERROR'});
        }
    } catch (e) {
        console.log(e);
        return ({status: 'ERROR'});
    }
}

const verifyUser = async (email) => {
        const user = await User.findOne({ email: email }).populate("neighborhood").catch (e => {
            console.log(e);
            return ({status : "ERROR"});
        });
        if (!user){
            return ({status: 'NO_EXISTING_USER'});
        }
        return ({status: "VALID_USER", user});
}

module.exports = {
    verifySignInToken, generateToken, verifyUser
}