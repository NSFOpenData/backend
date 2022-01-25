import { connectTestDB, dropTestDB, closeDBConnection } from '../tests_helper/connection';
const Neighborhood = require("../models/neighborhood");
const User = require("../models/user");
const { Animal }= require("../models/animal");
const { Vehicle }= require("../models/vehicle");
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
  it('registering a new user', async () => {
  
    user.neighborhood = "Sylvan Park";
    const data = await resolvers.Mutation.register(null, { user });
    
    const userFromDB = await User.findOne({ name: user.name, email: user.email });
    
    // get user with given name
    expect(data.name).toBe(userFromDB.name);
    expect(data.email).toBe(userFromDB.email);
    expect(userFromDB.role).toBe("USER");
  });
  it ('getting a user from the me resolver with authenticated user', async () => {
    const userFromDb = await User.findOne({ email: user.email });

    authUser.sub = userFromDb._id;
    const data = await resolvers.Query.me(null, null, { user: authUser });
    expect(data.name).toBe(user.name);
  });
  it ('getting a user from the me resolver with unauthenticated throws error', async () => {
    
    try {
      await resolvers.Query.me(null, null, { user: {} });
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  });
});

// ANIMAL TESTS
describe('Tests all mutations related to an Animal', () => {
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
  
          var newAnimal = {
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
describe('Tests all queries related to an Animal', () => {
    it('getting all animals from a neighborhood with authenticated users: DEVELOPER and non-developer', async () => {
      // add 3 animals to the database with same neighborhood
      var animalsInput = [
        {
          neighborhood: "Sylvan Park",
          color: "red",
          breed: "persian",
          type: "Dog",
          location: {
            lat: "36.1430",
            lon: "-86.8446",
            name: "Sylvan Park"
          },
          files: [],
        },
        {
          neighborhood: "Sylvan Park",
          color: "white",
          breed: "German Shepherd",
          type: "Dog",
          location: {
            lat: "36.1430",
            lon: "-86.8446",
            name: "Sylvan Park"
          },
          files: [],
        },
        {
          neighborhood: "12th South",
          color: "grey",
          breed: "bulldog",
          type: "Dog",
          location: {
            lat: "36.125382912389945",
            lon: "-86.78956484629505",
            name: "12th South"
          },
          files: [],
        }
      ]
        
      // insert animals into database
      for (let i = 0; i < animalsInput.length; i++) {
        await Animal.create(animalsInput[i]);
      }


      const userFromDb = await User.findOne({ email: user.email });

      // since the user's role is not a deveoper, they get animals within their neighborhood
      authUser.sub = userFromDb._id;
      const animals = await resolvers.Query.animals(null, {}, { user: authUser });
      expect(animals.length).toBe(2);

      // since the user's role is a developer, they get all animals within their neighborhood
      authUser[DOMAIN].role = "DEVELOPER";
      const animals2 = await resolvers.Query.animals(null, {}, { user: authUser });

      expect(animals2.length).toBe(3);
    });
    it('getting all animals from a neighborhood with an unauthenticated user', async () => {
      try {
        await resolvers.Query.animals(null, {}, {});
      } catch (error) {
        expect(typeof error.message).toBe("string");
      }
    });
    it("getting all animals with specific filters", async () => {

      var animalsInput = [
        {
          neighborhood: "Sylvan Park",
          color: "red",
          breed: "persian",
          type: "Dog",
          location: {
            lat: "36.1430",
            lon: "-86.8446",
            name: "Sylvan Park"
          },
          files: [],
        },
        {
          neighborhood: "Sylvan Park",
          color: "white",
          breed: "German Shepherd",
          type: "Dog",
          location: {
            lat: "36.1430",
            lon: "-86.8446",
            name: "Sylvan Park"
          },
          files: [],
        },
        {
          neighborhood: "12th South",
          color: "grey",
          breed: "bulldog",
          type: "Dog",
          location: {
            lat: "36.125382912389945",
            lon: "-86.78956484629505",
            name: "12th South"
          },
          files: [],
        }
      ]
        
      // insert animals into database
      for (let i = 0; i < animalsInput.length; i++) {
        await Animal.create(animalsInput[i]);
      }

      const userFromDb = await User.findOne({ email: user.email });
      authUser.sub = userFromDb._id;
      const animals = await resolvers.Query.findAnimals(null, {
        params : {
          neighborhood: "Sylvan Park",
          color: "white",
          breed: "German Shepherd",
          type: "Dog"
        }
      });

      expect(animals.length).toBe(1);
    });
  });
// VEHICLE TESTS
describe('Tests all mutations related to a Vehicle', () => {
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
describe('Tests all queries related to a Vehicle', () => {
  it('getting all vehicles from a neighborhood with authenticated users: DEVELOPER and non-developer', async () => {
    
    var vehiclesInput = [
      {
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
      },
      {
        neighborhood: "Sylvan Park",
        color: "yellow",
        make: "Range",
        model: "Evoque",
        files: [],
        location: {
          lat: "36.1430",
          lon: "-86.8446",
          name: "Sylvan Park"
        }
      },
      {
        neighborhood: "12th South",
        color: "grey",
        make: "Mercedez",
        model: "C300",
        files: [],
        location: {
          lat: "36.125382912389945",
          lon: "-86.78956484629505",
          name: "12th South"
        }
      }
    ]

    // insert vehicles into database
    for (let i = 0; i < vehiclesInput.length; i++) {
      await Vehicle.create(vehiclesInput[i]);
    }

    const userFromDb = await User.findOne({ email: user.email });
    authUser.sub = userFromDb._id;
    
    // since the user's role is not a deveoper, they get vehicles within their neighborhood
    authUser[DOMAIN].role = "PRIVILEGED";
    const vehicles = await resolvers.Query.vehicles(null, {}, { user: authUser });
    expect(vehicles.length).toBe(2);

    // since the user's role is a developer, they get all vehicles
    authUser[DOMAIN].role = "DEVELOPER";
    const vehicles2 = await resolvers.Query.vehicles(null, {}, { user: authUser });
    expect(vehicles2.length).toBe(3);
  }); 
  it('getting all vehicles from a neighborhood with non authenticated users: expects an error', async () => {
    try {
      await resolvers.Query.vehicles(null, {}, {});
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  });
  it('getting all vehicles with specific filters', async () => {
    var vehiclesInput = [
      {
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
      },
      {
        neighborhood: "Sylvan Park",
        color: "yellow",
        make: "Range",
        model: "Evoque",
        files: [],
        location: {
          lat: "36.1430",
          lon: "-86.8446",
          name: "Sylvan Park"
        }
      },
      {
        neighborhood: "12th South",
        color: "grey",
        make: "Mercedez",
        model: "C300",
        files: [],
        location: {
          lat: "36.125382912389945",
          lon: "-86.78956484629505",
          name: "12th South"
        }
      }
    ]

    // insert vehicles into database
    for (let i = 0; i < vehiclesInput.length; i++) {
      await Vehicle.create(vehiclesInput[i]);
    }

    const userFromDb = await User.findOne({ email: user.email });
    authUser.sub = userFromDb._id;

    const vehicles = await resolvers.Query.findVehicles(null, {
      params : {
        neighborhood: "12th South",
        color: "grey",
        make: "Mercedez",
        model: "C300"
      }
    });

    expect(vehicles.length).toBe(1);
  });
});


// NEIGHBORHOOD TESTS
describe('Tests all mutations and queries related to a Neighborhood', () => {
  it('creating a neighborhood with an authenticated user', async () => {
      
      const userFromDb = await User.findOne({ email: user.email });

      const newNeighborhood = {
              name: "Vanderbilt",
              location: {
                  lat: "36.14455",
                  lon: "-86.8026",
                  name: "Vanderbilt"
              },
              dataRetention: "7d",
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
describe("Tests all mutations made to the addPrivilege mutation", () => {
  it("adding a privilege with a non authenticated user throws an error", async () => {
    try {
      await resolvers.Mutation.addPrivilege(null, {}, {});
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  });
  it("adding a privilege with a non ADMIN user throws an error", async () => {
    const userFromDb = await User.findOne({ email: user.email });
    authUser.sub = userFromDb._id;
    authUser[DOMAIN].role = "PRIVILEGED";

    try {
      await resolvers.Mutation.addPrivilege(null, {}, { user: authUser });
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  });
  it("adding a privilege to a nonvalid user with an ADMIN user throws an error", async () => {
    const userFromDb = await User.findOne({ email: user.email });
    userFromDb.role = "ADMIN";
    await userFromDb.save();

    authUser.sub = userFromDb._id;
    authUser[DOMAIN].role = "ADMIN";

    try {
      await resolvers.Mutation.addPrivilege(null, {email: "nonvalidemail@gmail.com"}, { user: authUser });
    } catch (error) {
      expect(typeof error.message).toBe("string");
    }
  });
  it("adding a privilege with an ADMIN user works", async () => {
    const userFromDb = await User.findOne({ email: user.email });
    userFromDb.role = "ADMIN";
    await userFromDb.save();

    authUser.sub = userFromDb._id;
    authUser[DOMAIN].role = "ADMIN";

    // create a new user
    const newUser = await User.create({
      email: "facebookworker@fb.com",
      name: "fbworker",
      neighborhood: userFromDb.neighborhood,
      role: "USER"
    });

    await resolvers.Mutation.addPrivilege(null, { email: newUser.email }, { user: authUser });

    const updatedUser = await User.findOne({ email: newUser.email });
    expect(updatedUser.role).toBe("PRIVILEGED");
  });
});
// TODO: partials for vehicle and animal should not be empty