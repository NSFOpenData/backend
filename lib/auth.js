const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID  = require('constants');
const client = new OAuth2Client(CLIENT_ID.id);

const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";

const generateToken = async (user) => {
    console.log(user)
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

const verifyToken = async (token) =>{
    const ticket = await client.verifyIdToken({
        idToken: token,
        requiredAudience: CLIENT_ID,
    }).catch (console.error);
    
    const payload = ticket.getPayload();
    if (!payload['email_verified']){
        return {status: 'INVALID_TOKEN'};
    }
    const email = payload['email'];
    const user = await User.findOne({ email: email }).populate("neighborhood");

    if (!user){
        return {status: 'NO_EXISTING_USER'};
    }

    return {status: "VALID_USER", user: user};
}

module.exports = {
    generateToken, verifyToken
}