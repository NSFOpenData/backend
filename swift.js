const fetch = require("node-fetch");
require("dotenv").config();

const { SWIFT_USER, SWIFT_PASSWORD } = process.env;

let token = "";
let expiry = "";

const getAuthToken = async () => {
    // reuse token if not expired
    if (expiry && new Date() < new Date(expiry)) return token;

    const body = {
        auth: {
            identity: {
                methods: ["password"],
                password: {
                    user: {
                        name: SWIFT_USER,
                        domain: { id: "default" },
                        password: SWIFT_PASSWORD,
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

const uploadFile = async (prefix, filename, stream) => {
    const authToken = await getAuthToken();
    const url = `https://swift.isis.vanderbilt.edu/swift/v1/test/${prefix}/${filename}`;
    const data = await fetch(url, {
        method: "put",
        body: stream,
        headers: {
            "X-Auth-Token": authToken,
            "X-Detect-Content-Type": true,
            "X-Object-Meta-ID": prefix,
        },
    });
    return data.status;
};

const getFile = async (prefix, filename) => {
    console.log(`getting file ${filename} from api`);
    const authToken = await getAuthToken();
    const url = `https://swift.isis.vanderbilt.edu/swift/v1/test/${prefix}/${filename}`;
    const data = await fetch(url, {
        method: "get",
        headers: {
            "X-Auth-Token": authToken,
        },
    });
    console.log(data);
    if (data.status === 200) return data; // file contents
    throw new Error(`request errored: ${data.status}`);
};

module.exports = { uploadFile, getFile };
