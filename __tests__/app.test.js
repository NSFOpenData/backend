import { connectTestDB, dropTestDB, closeDBConnection } from '../tests/connection';
const Neighborhood = require("../models/neighborhood");
const User = require("../models/user");
const resolvers = require("../graphql/resolvers");

const user = {
  name: "salomon",
  email: "salomondushimirimana@gmail.com",
  neighborhood: "Sylvan Park",
  role: "USER"
}
const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";


beforeAll(async () => {
  await connectTestDB();
  // await dropTestDB();
})

afterAll(async () => {
  await dropTestDB();
  await closeDBConnection();
});

// USER TESTS
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

    const data = await resolvers.Mutation.register(null, { user });
    
    const userFromDB = await User.findOne({ name: user.name, email: user.email });
    
    // get user with given name
    expect(data.name).toBe(userFromDB.name);
    expect(data.email).toBe(userFromDB.email);
    expect(userFromDB.role).toBe("USER");
  });
});

// ANIMAL TESTS
describe('Tests all queries and mutations related to an Animal', () => {
    it('creating a partial animal with an authenticated user', async () => {
        
        const userFromDb = await User.findOne({ email: user.email });

        const authUser = {
          [DOMAIN]: {
            email: 'salomondushimirimana@gmail.com',
            role: 'USER',
            neighborhood: 'Sylvan Park'
          },
          iat: 1637915380,
          exp: 1638520180,
          sub: userFromDb._id
        }

        const partialAnimal = {
                neighborhood: "Sylvan Park",
                color: ["red"],
                breed: "Labrador Retriever",
                type: "Dog",
                files: [],
        }

        const animal = await resolvers.Mutation.createPartialAnimal(null, { partial: partialAnimal }, { user: authUser });


        expect(animal.createdBy._id).toStrictEqual(userFromDb._id);
        expect(animal.neighborhood).toBe(partialAnimal.neighborhood);
        expect(animal.color).toStrictEqual(partialAnimal.color);
        expect(animal.breed).toBe(partialAnimal.breed);
        expect(animal.type).toBe(partialAnimal.type);       
    })
    it('creating an animal with a non authenticated user should expect an error', async () => {

      const partialAnimal = {
        neighborhood: "Sylvan Park",
        color: ["red"],
        breed: "Labrador Retriever",
        type: "Dog",
        files: [],
      }

      try {
        await resolvers.Mutation.createPartialAnimal(null, { partial: partialAnimal }, {});
      } catch (error) {
        expect(typeof error.message).toBe("string");
      }
    })
});
