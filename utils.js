const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

/**
 * Create html body to send in emails
 * @param {*} obj Animal or Vehicle object to get info from
 * @returns formatted html string email body
 */
const makeBody = obj => {
    let item = { ...obj }; // objects are passed by ref in js so we make a copy
    const model = item.constructor.modelName; // check if Animal or Vehicle
    // console.log(delete item._doc.files);
    // console.log(delete item._doc._id);
    // const { location } = item._doc.location;
    const locationURL = "https://www.google.com/maps/search/?api=1&query=" + item._doc.location.lat + "," + item._doc.location.lon;

    const article = model === "Animal" ? "An" : "A";
    return `<p>${article} ${model} matching your description has been found with the following details:</p><br><p>Location: ${locationURL}</p><br><p>${item}</p>`;
};

/**
 * Send email to user
 * @param {String} recipient email of the user
 * @param {String} subject the email subject
 * @param {String} bodyHtml html body
 */
const sendEmail = (recipient, subject, bodyHtml) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.isis.vanderbilt.edu",
        port: 25,
        secure: false,
        tls: {
            rejectUnauthorized: false, // https://stackoverflow.com/a/46752426/9044659
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

/**
 * reverse coordinate lookup to figure out an approximate street
 * @param {*} lat latitude of coordinate
 * @param {*} lon longitude of coordinate
 * @returns the street from the lookup
 */
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
