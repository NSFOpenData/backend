const { MongoClient, ObjectID } = require("mongodb");
const faker = require("faker");
require("dotenv").config();

const url = process.env.DB;
const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const NUM_ENTRIES = 50; // entries to make in db

// generate fake locations around hardcoded vanderbilt coordinates
function fakeLocation() {
    return {
        lat: `${36.14458208600954 + Math.random() * (-1 * (Math.random() > 0.5))}`,
        lon: `${-86.80233323692445 + Math.random() * (-1 * (Math.random() > 0.5))}`,
    };
}

function generateVehicleEntry() {
    let [make, ...model] = faker.vehicle.vehicle().split(" ");
    model = model.join(" ");
    return {
        _id: new ObjectID(),
        createdAt: faker.time.recent(),
        location: fakeLocation(),
        color: faker.vehicle.color(),
        make: make,
        model: model,
        license: faker.vehicle.vrm(),
    };
}

function generateAnimalEntry() {
    const animals = {
        dog: faker.animal.dog,
        cat: faker.animal.cat,
    };
    // choose cat or dog
    const animal = Object.keys(animals)[faker.datatype.number(1)];
    return {
        _id: new ObjectID(),
        createdAt: faker.time.recent(),
        location: fakeLocation(),
        color: faker.commerce.color(),
        breed: animals[animal](),
        type: animal,
    };
}

function generator(entryMaker) {
    const newEntries = [];
    for (let i = 1; i <= NUM_ENTRIES; ++i) {
        if (i % 10 === 0) console.log(`Creating entry ${i}`);
        newEntries.push(entryMaker());
    }
    return newEntries;
}

const addEntries = async (col_name, entries) => {
    const col = client.db("test").collection(col_name);
    console.log("Connected to DB");

    console.log(`Adding entries to the DB...`);
    const { insertedCount } = await col.insertMany(entries);
    console.log(`Inserted ${insertedCount} new entries`);
};

module.exports = { addEntries };

(async () => {
    await client.connect();
    await addEntries("Vehicles", generator(generateVehicleEntry));
    await addEntries("Animals", generator(generateAnimalEntry));
    process.exit(0);
})();
