const fetch = require("node-fetch");
require("dotenv").config();

let token = "";
let expiry = "";

const getAuthToken = async () => {
    if (expiry && new Date() < new Date(expiry)) return token;
    const body = {
        auth: {
            identity: {
                methods: ["password"],
                password: {
                    user: {
                        name: process.env.SWIFT_USER,
                        domain: { id: "default" },
                        password: process.env.SWIFT_PASSWORD,
                    },
                },
            },
        },
    };
    return await fetch("https://keystone.isis.vanderbilt.edu:5000/v3/auth/tokens", {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    })
        .then(resp => {
            token = resp.headers.get("X-Subject-Token");
            return resp.json();
        })
        .then(data => {
            expiry = data.token.expires_at;
            return token;
        });
};

(async () => {
    console.log(await getAuthToken());
    console.log(await getAuthToken());
})();
