const { MongoClient, ObjectID } = require("mongodb");
const faker = require("faker");
require("dotenv").config();

const url = process.env.DB;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const NUM_ENTRIES = 50; // entries to make in db

function generateVehicleEntry() {
  let [make, ...model] = faker.vehicle.vehicle().split(" ");
  model = model.join(" ");
  return {
    _id: new ObjectID(),
    time: faker.time.recent(),
    location: faker.address.nearbyGPSCoordinate(),
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
    time: faker.time.recent(),
    location: faker.address.nearbyGPSCoordinate(),
    color: faker.commerce.color(),
    breed: animals[animal](),
    type: animal,
  };
}

const addEntries = async (col_name, generator) => {
  await client.connect();
  const col = await client.db("test").collection(col_name);
  console.log("Connected to DB");
  const newEntries = [];
  for (let i = 1; i <= NUM_ENTRIES; i += 1) {
    if (i % 100 === 0) console.log(`Creating entry ${i}`);
    newEntries.push(generator());
  }

  console.log(`Adding entries to the DB...`);
  const { insertedCount } = await col.insertMany(newEntries);
  console.log(`Inserted ${insertedCount} new entries`);
  process.exit(0);
};

addEntries("Vehicles", generateVehicleEntry);
addEntries("Animals", generateAnimalEntry);
