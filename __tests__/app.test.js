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
    role: 'PRIVILEGED',
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
    it('creating a partial animal with a non privileged user expects an error', async () => {
      const userFromDb = await User.findOne({ email: user.email });

      const partialAnimal = {
        neighborhood: "Sylvan Park",
        color: ["red"],
        breed: "Labrador Retriever",
        type: "Dog",
        files: [],
      }
      authUser.sub = userFromDb._id;
      authUser.role = "USER";
      try {
        await resolvers.Mutation.createPartialAnimal(null, { partial: partialAnimal }, {user: authUser});
      } catch (error) {
        expect(typeof error.message).toBe("string");
      }
    })
    it('creating an animal with a non authenticated user expects an error', async () => {
        
        const newAnimal = {
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
          await resolvers.Mutation.createAnimal(null, { animal: newAnimal }, {});
        } catch (error) {
          expect(typeof error.message).toBe("string");
        }
    });
    it('creating an animal with an authenticated user', async () => {
          
          const userFromDb = await User.findOne({ email: user.email });
  
          const newAnimal = {
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
          const animal = await resolvers.Mutation.createAnimal(null, { animal: newAnimal }, { user: authUser });

          expect(animal.neighborhood).toBe(newAnimal.neighborhood);
          expect(animal.color).toStrictEqual(newAnimal.color);
          expect(animal.breed).toBe(newAnimal.breed);
          expect(animal.type).toBe(newAnimal.type);
    });
});

// VEHICLE TESTS
describe('Tests all queries and mutations related to a Vehicle', () => {
  it('creating a partial vehicle with an authenticated user', async () => {
      
      const userFromDb = await User.findOne({ email: user.email });

      const partialVehicle = {
              neighborhood: "Sylvan Park",
              color: ["red"],
              make: "Toyota",
              model: "Corolla",
              files: [],
      }

      authUser.sub = userFromDb._id;
      const vehicle = await resolvers.Mutation.createPartialVehicle(null, { partial: partialVehicle }, { user: authUser });


      expect(vehicle.createdBy._id).toStrictEqual(userFromDb._id);
      expect(vehicle.neighborhood).toBe(partialVehicle.neighborhood);
      expect(vehicle.color).toStrictEqual(partialVehicle.color);
      expect(vehicle.make).toBe(partialVehicle.make);
      expect(vehicle.model).toBe(partialVehicle.model);
  })
  it('creating a partial vehicle with a non authenticated user expects an error', async () => {
      
      const partialVehicle = {
        neighborhood: "Sylvan Park",
        color: ["red"],
        make: "Toyota",
        model: "Corolla",
        files: [],
      }
  
      try {
        await resolvers.Mutation.createPartialVehicle(null, { partial: partialVehicle }, {});
      } catch (error) {
        expect(typeof error.message).toBe("string");
      }
  })
  it('creating a partial vehicle with a non privileged user expects an error', async () => {
    const userFromDb = await User.findOne({ email: user.email });

    const partialVehicle = {
      neighborhood: "Sylvan Park",
      color: ["red"],
      make: "Toyota",
      model: "Corolla",
      files: [],
    }
    authUser.sub = userFromDb._id;
    authUser.role = "USER";
    try {
      await resolvers.Mutation.createPartialVehicle(null, { partial: partialVehicle }, {user: authUser});
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  })
  it('creating a vehicle with a non authenticated user expects an error', async () => {
        
        const newVehicle = {
          neighborhood: "Sylvan Park",
          color: ["red"],
          make: "Toyota",
          model: "Corolla",
          files: [],
        }
    
        try {
          await resolvers.Mutation.createVehicle(null, { vehicle: newVehicle }, {});
        } catch (error) {
          expect(typeof error.message).toBe("string");
        }
  });
  it('creating a vehicle with an authenticated user', async () => {
          // todo: partial in this resolver should not be empty
          const userFromDb = await User.findOne({ email: user.email });
      
          const newVehicle = {
            neighborhood: "Sylvan Park",
            color: "red",
            make: "Toyota",
            model: "Corolla",
            files: [],
            location: {
              lat: "36.1430",
              lon: "-86.8446",
              name: "Sylvan Park"
            }
          }
      
          authUser.sub = userFromDb._id;
          const vehicle = await resolvers.Mutation.createVehicle(null, { vehicle: newVehicle }, { user: authUser });
      
          expect(vehicle.neighborhood).toBe(newVehicle.neighborhood);
          expect(vehicle.color).toStrictEqual(newVehicle.color);
          expect(vehicle.make).toBe(newVehicle.make);
          expect(vehicle.model).toBe(newVehicle.model);
    });
});

// NEIGHBORHOOD TESTS
describe('Tests all queries and mutations related to a Neighborhood', () => {
  it('creating a neighborhood with an authenticated user', async () => {
      
      const userFromDb = await User.findOne({ email: user.email });

      const newNeighborhood = {
              name: "Vanderbilt",
              location: {
                  lat: "36.14455609440181",
                  lon: "-86.80260145836806",
                  name: "Vanderbilt"
              },
              dataRetention: "7d"
      }

      authUser.sub = userFromDb._id;
      const neighborhood = await resolvers.Mutation.createNeighborhood(null, { neighborhood: newNeighborhood }, { user: authUser });

      expect(neighborhood.name).toBe(newNeighborhood.name);
      expect(neighborhood.location.lat).toBe(newNeighborhood.location.lat);
      expect(neighborhood.location.lon).toBe(newNeighborhood.location.lon);
      expect(neighborhood.location.name).toBe(newNeighborhood.location.name);
  })
  it('creating a neighborhood with a non authenticated user expects an error', async () => {
      
      const newNeighborhood = {
        name: "Sylvan Park",
        location: {
            lat: "36.1430",
            lon: "-86.8446",
            name: "Sylvan Park"
        }
    }

    try {
      await resolvers.Mutation.createNeighborhood(null, { neighborhood: newNeighborhood }, {});
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  })
});


// TODO: partials for vehicle and animal should not be empty

