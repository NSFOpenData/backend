const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const { getFile } = require("./swift");
const fs = require("fs");

/**
 * Create html body to send in emails
 * @param {*} obj Animal or Vehicle object to get info from
 * @returns formatted html string email body
 */
const makeBody = async obj => {
    let item = { ...obj }; // objects are passed by ref in js so we make a copy
    const model = item._doc.make; // get the model name
    const locationURL = "https://www.google.com/maps/search/?api=1&query=" + item._doc.location.lat + "," + item._doc.location.lon;

    const article = model === "Animal" ? "An" : "A";

    const buildImages = async allFiles => {
        let images = "";
        for (let i = 0; i < allFiles.length; i++) {
            let file = allFiles[i];
            // get file from swift
            var fileArr = file.split("/");
            var fileName = fileArr[2];
            var prefix = fileArr[0] + "/" + fileArr[1];

            // get image and buffer it
            const response = await getFile(prefix, fileName);
            console.log("buffer", response.body._readableState.buffer);
            console.log("content Type: ", response.headers["content-type"])
            console.log("Buffer head", response.body._readableState.buffer.head); // todo: remove
            console.log("Buffer tail", response.body._readableState.buffer.tail); // todo: remove
           
            const base64Image = Buffer.from(response.body._readableState.buffer.head.data, 'base64');

            // write image to file
            // const filePath = "./images/" + fileName;
            fs.writeFile("image.png", base64Image, function (err) {
                if (err) {
                    console.log("There was an error: ", err);
                } else {
                    console.log("The file was saved!");
                }
            });

            // add image to html
            images += `<img src="data:image/png;base64,${base64Image}" alt="${fileName}" width="100" height="100"/>`;
        }
        return images;
    };

    // return html with image and info
    // build htmls images from files
    let images = "";
    if (item._doc.files) {
        images = await buildImages(item._doc.files);
    }
    return `
        <h1>${article} ${model} matching your description has been found with the following details</h1><br>
        ${images} <br>
        <p>Location: <a href="${locationURL}">${item._doc.location.name}</a></p>
        `;
};

/**
 * Send email to user
 * @param {String} recipient email of the user
 * @param {String} subject the email subject
 * @param {String} bodyHtml html body
 */
const sendEmail = (recipient, subject, bodyHtml) => {
    console.log("Sending email to " + recipient);
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
