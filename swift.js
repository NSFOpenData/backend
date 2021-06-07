const fetch = require("node-fetch");
require("dotenv").config();

const getAuthToken = async () => {
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
    await fetch("https://keystone.isis.vanderbilt.edu:5000/v3/auth/tokens", {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    })
        .then(resp => {
            console.log(resp.headers.get("X-Subject-Token"));
            return resp.json();
        })
        .then(data => console.log(data.expires_at));
};


getAuthToken();
