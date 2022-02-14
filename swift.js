const fetch = require("node-fetch");
require("dotenv").config();

const { SWIFT_USER, SWIFT_PASSWORD } = process.env;

// global variables to store tokens and expiry at
let token = "";
let expiry = "";

/**
 *
 * @returns an auth token, either reused or a new generated one if old one expired
 */
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

/**
 * uploads given file to the swift cluster
 * @param {String} prefix the prefix to namespace the file by
 * @param {String} filename original name of the file
 * @param {*} stream the buffer contents of the file
 * @returns status code of the request
 */
const uploadFile = async (prefix, filename, stream) => {
    try {
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
    } catch (err) {
        console.log(err);
    }
};

/**
 * Retrieve a file from the swift cluster
 * @param {String} prefix the prefix the file is stored under
 * @param {String} filename the name of the file to retrieve
 * @returns file contents
 */
const getFile = async (prefix, filename) => {
    console.log(`getting file ${filename} from api`);
    const authToken = await getAuthToken();
    const url = `https://swift.isis.vanderbilt.edu/swift/v1/test/${prefix}/${filename}`;
    const data = await fetch(url, {
        method: "get",
        encoding: null,
        headers: {
            "X-Auth-Token": authToken,
        },
    });
    console.log(data);
    if (data.status === 200) return data; // file contents
    throw data.status;
};

module.exports = { uploadFile, getFile };
