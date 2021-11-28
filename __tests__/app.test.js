import { connectTestDB, dropTestDB, closeDBConnection } from '../tests/connection';
const Neighborhood = require("../models/neighborhood");
const User = require("../models/user");
const resolvers = require("../graphql/resolvers");


const DOMAIN = "https://nsf-scc1.isis.vanderbilt.edu/graphql";

const user = {
  name: "salomon",
  email: "salomondushimirimana@gmail.com",
  neighborhood: "Sylvan Park",
  role: "USER"
}

const authUser = {
  [DOMAIN]: {
    email: 'salomondushimirimana@gmail.com',
    role: 'USER',
    neighborhood: 'Sylvan Park'
  },
  iat: 1637915380,
  exp: 1638520180,
  sub: '' // will populate before use
}

beforeEach(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await dropTestDB();
});

afterAll(async () => {
  await dropTestDB();
  await closeDBConnection();
});

// USER TESTS
describe('Tests queries and mutuations related to a user', () => {
  it('should register a new user', async () => {
  
    user.neighborhood = "Sylvan Park";
    const data = await resolvers.Mutation.register(null, { user });
    
    const userFromDB = await User.findOne({ name: user.name, email: user.email });
    
    // get user with given name
    expect(data.name).toBe(userFromDB.name);
    expect(data.email).toBe(userFromDB.email);
    expect(userFromDB.role).toBe("USER");
  });
  it ('requesting a user from the me resolver with authenticated user', async () => {
    const userFromDb = await User.findOne({ email: user.email });

    authUser.sub = userFromDb._id;
    const data = await resolvers.Query.me(null, null, { user: authUser });
    expect(data.name).toBe(user.name);
  });
  it ('requesting a user from the me resolver with unauthenticated throws error', async () => {
    
    try {
      await resolvers.Query.me(null, null, { user: {} });
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  });
});

// ANIMAL TESTS
describe('Tests all queries and mutations related to an Animal', () => {
    it('creating a partial animal with an authenticated user', async () => {
        
        const userFromDb = await User.findOne({ email: user.email });

        const partialAnimal = {
                neighborhood: "Sylvan Park",
                color: ["red"],
                breed: "Labrador Retriever",
                type: "Dog",
                files: [],
        }

        authUser.sub = userFromDb._id;
        const animal = await resolvers.Mutation.createPartialAnimal(null, { partial: partialAnimal }, { user: authUser });


        expect(animal.createdBy._id).toStrictEqual(userFromDb._id);
        expect(animal.neighborhood).toBe(partialAnimal.neighborhood);
        expect(animal.color).toStrictEqual(partialAnimal.color);
        expect(animal.breed).toBe(partialAnimal.breed);
        expect(animal.type).toBe(partialAnimal.type);       
    })
    it('creating a partial animal with a non authenticated user expects an error', async () => {

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
    it('creating an animal with a non authenticated user expects an error', async () => {
        
        const partialAnimal = {
          neighborhood: "Sylvan Park",
          color: ["red"],
          breed: "Labrador Retriever",
          type: "Dog",
          location: {
            lat: "36.1430",
            lon: "-86.8446",
            name: "Sylvan Park"
          }
          
        }
  
        try {
          await resolvers.Mutation.createAnimal(null, { animal: partialAnimal }, {});
        } catch (error) {
          expect(typeof error.message).toBe("string");
        }
    });
    it('creating an animal with an authenticated user', async () => {
          
          const userFromDb = await User.findOne({ email: user.email });
  
          const partialAnimal = {
                  neighborhood: "Sylvan Park",
                  color: "red",
                  breed: "Labrador Retriever",
                  type: "Dog",
                  location: {
                      lat: "36.1430",
                      lon: "-86.8446",
                      name: "Sylvan Park"
                  },
                  files: [],
          }
  
          authUser.sub = userFromDb._id;
          const animal = await resolvers.Mutation.createAnimal(null, { animal: partialAnimal }, { user: authUser });

          expect(animal.neighborhood).toBe(partialAnimal.neighborhood);
          expect(animal.color).toStrictEqual(partialAnimal.color);
          expect(animal.breed).toBe(partialAnimal.breed);
          expect(animal.type).toBe(partialAnimal.type);
    });
});
