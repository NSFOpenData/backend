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

const addVehicles = async () => {
  await client.connect();
  const col = await client.db("test").collection("Vehicles");
  console.log("Connected to DB");
  const newVehicles = [];
  for (let i = 1; i <= NUM_ENTRIES; i += 1) {
    if (i % 100 === 0) console.log(`Creating vehicle ${i}`);
    newVehicles.push(generateVehicleEntry());
  }

  console.log(`Adding vehicles to the DB...`);
  const { insertedCount } = await col.insertMany(newVehicles);
  console.log(`Inserted ${insertedCount} new vehicles`);
  process.exit(0);
};

addVehicles();
