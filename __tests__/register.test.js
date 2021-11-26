import { gql } from 'apollo-server-express';
import { testClient, connectTestDB, dropTestDB, closeDBConnection } from '../test/helper';
const { ObjectId } = require('mongodb');
const Neighborhood = require("../models/neighborhood");


const {query, mutate} = testClient;

beforeAll(async () => {
  await connectTestDB();
  await dropTestDB();
})

afterAll(async () => {
  await dropTestDB();
  await closeDBConnection();
});

describe('Register a new user', () => {
  it('should register a new user', async () => {
    
    await Neighborhood.create({
      name: "Sylvan Park",
      location: {
        lat: "36.1430",
        lon: "-86.8446",
        name: "Sylvan Park"
      },
      dataRetention: "7d",
    });

    const user = {
      name: "salomon",
      email: "salomondushimirimana@gmail.com",
      neighborhood: "Sylvan Park",
    }
    
    const REGISTER_USER = gql`
      mutation register($name: String!
        $email: String!
        $neighborhood: String) {
        register(
          user: {
            name: $name
            email: $email
            neighborhood: $neighborhood
          }
        ) {
          email
          name
          neighborhood {
            name
          }
        }
      } 
    `;

    const { data } = await mutate({
      mutation: REGISTER_USER,
      variables: user
    })

    expect(data.register.name).toBe(user.name);
    expect(data.register.email).toBe(user.email);
    expect(data.register.neighborhood.name).toBe(user.neighborhood);
  });
});


// todo: - figure out a way to setup a test database
// todo: - to run the tests without running the backend
// todo: - then we can write more tests.