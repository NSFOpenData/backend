import mongoose from 'mongoose';
// import { server } from './connection';

const { ObjectId } = mongoose.Types;

const uri = process.env.DB_TEST || 'mongodb://localhost/jest';

const config = {
  db: {
    test: uri,
  },
  connection: null,
};

function connect() {
    try {
        mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

function clearDatabase() {
    return mongoose.connection.dropDatabase();
}

// export async function start() {
//     global.httpServer = server;
//     await global.httpServer.listen(process.env.PORT || 3000);
// }

// export async function stop() {
//     await global.httpServer.close();
// }

export async function setupTest() {
  connect();
//   await clearDatabase();
}