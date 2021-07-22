const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const makeBody = item => {
    const model = item.constructor.modelName; // check if Animal or Vehicle
    console.log(delete item["files"]);
    console.log(delete item["_id"]);
    const { location, ...rest } = item;
    const locationURL = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`;

    const article = model === "Animal" ? "An" : "A";
    return `<p>${article} ${model} matching your description has been found with the following details:</p><br><p>Location: ${locationURL}</p><br><p>${rest}</p>`;
};

const sendEmail = (recipient, subject, bodyHtml) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.isis.vanderbilt.edu",
        port: 25,
        secure: false,
        tls: {
            rejectUnauthorized: false,
        },
    });

    transporter.sendMail(
        {
            from: "noreply-nsf-scc@vanderbilt.edu",
            to: recipient,
            subject: subject,
            html: bodyHtml,
        },
        function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(`Message sent to ${recipient}.`);
            }
        }
    );
};

const getLocation = (lat, lon) => {
    const url = "https://nominatim.openstreetmap.org/reverse?";
    const params = new URLSearchParams({
        lat,
        lon,
        format: "json",
    });
    return fetch(url + params)
        .then(resp => resp.json())
        .then(data => data.address.road);
};

module.exports = { getLocation, sendEmail, makeBody };
