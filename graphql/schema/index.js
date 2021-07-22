const { buildSchema } = require("graphql");

module.exports = buildSchema(`

    scalar Upload 
    
    type Location {
        lat: String!
        lon: String!
        name: String
    }

    input LocationInput {
        lat: String!
        lon: String!
        name: String
    }

    type Vehicle {
        _id: ID!
        createdAt: Float!
        location: Location!
        neighborhood: String!
        color: String
        make: String
        model: String
        license: String
        files: [String!]
    }

    input VehicleInput {
        location: LocationInput!
        neighborhood: String
        color: String
        make: String
        model: String
        license: String
    }

    input VehicleSearchInput {
        location: LocationInput
        neighborhood: [String!]
        color: [String!]
        make: [String!]
        model: [String!]
        license: [String!]
    }

    type PartialVehicle {
        _id: ID!
        createdAt: Float!
        neighborhood: String!
        color: [String!]!
        make: String!
        model: String!
        license: String
        createdBy: User!
    }

    input PartialVehicleInput {
        color: [String!]!
        make: String!
        model: String!
        license: String
    }

    type Animal {
        _id: ID!
        createdAt: Float!
        location: Location!
        neighborhood: String!
        color: String
        breed: String
        type: String
        files: [String!]
    }

    input AnimalInput {
        location: LocationInput!
        neighborhood: String
        color: String
        breed: String
        type: String
        files: [Upload!]
    }

    input AnimalSearchInput {
        location: LocationInput
        neighborhood: [String!]
        color: [String!]
        breed: [String!]
        type: [String!]
    }

    type PartialAnimal {
        _id: ID!
        createdAt: Float!
        neighborhood: String!
        color: [String!]!
        breed: String!
        type: String!
        createdBy: User!
    }

    input PartialAnimalInput {
        color: [String!]!
        breed: String!
        type: String!
    }

    enum Role {
        DEVELOPER   
        ADMIN
        PRIVILEGED
        USER
    }

    type Permissions {
        readLicenseInfo: [Role!]
        writeData: [Role!]
    }

    type Neighborhood {
        _id: ID!
        name: String!
        location: Location!
        dataRetention: String
        permissions: Permissions!
    }

    type User {
        """
        there will be a password field in db but it will not be queried
        """
        _id: ID!
        createdAt: Float!
        name: String!
        email: String!
        neighborhood: Neighborhood!
        role: Role!
    }

    input RegistrationInput {
        name: String!
        email: String!
        password: String!
        neighborhood: String
    } 

    type LoginPayload {
        token: String!
        user: User!
    }

    type Query {
        vehicles: [Vehicle!]
        animals: [Animal!]
        neighborhoods: [Neighborhood!]
        nearestNeighborhood(location: LocationInput!): Neighborhood
        findVehicles(params: VehicleSearchInput!): [Vehicle!]
        findAnimals(params: AnimalSearchInput!): [Animal!]
        me: User
    }

    type Mutation {
        createVehicle(vehicle: VehicleInput): Vehicle
        createAnimal(animal: AnimalInput): Animal
        createNeighborhood(name: String!, location: LocationInput!, dataRetention: String!): Neighborhood!
        createPartialAnimal(partial: PartialAnimalInput!): PartialAnimal!
        createPartialVehicle(partial: PartialVehicleInput!): PartialVehicle!
        register(user: RegistrationInput): User!
        login(email: String!, password: String!): LoginPayload!
        addPrivilege(email: String!): String
        changePermissions(id: ID!): Neighborhood!
    }

    schema {
        query: Query
        mutation: Mutation
    }
`);
