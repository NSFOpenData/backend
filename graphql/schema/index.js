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
        imagesID: String
        files: [String!]
    }

    input VehicleInput {
        location: LocationInput!
        neighborhood: String
        color: String
        make: String
        model: String
        license: String
        imagesID: String
        files: [String]
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
        imagesID: String
        files: [String]
    }

    input AnimalInput {
        location: LocationInput!
        neighborhood: String
        color: String
        breed: String
        type: String
        files: [String]
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
        neighborhood: String
    } 

    input userInput {
        """
        not sure how this will look like yet
        """
        _id: ID!
        name: String!
        email: String!
        neighborhood: String
        role: Role!
    }

    type LoginPayload {
        token: String!
        user: User
    }

    type Query {
        vehicles(user: userInput!): [Vehicle!]
        animals: [Animal!]
        neighborhoods: [Neighborhood!]
        nearestNeighborhood(location: LocationInput!): Neighborhood
        findVehicles(params: VehicleSearchInput!): [Vehicle!]
        findAnimals(params: AnimalSearchInput!): [Animal!]
        getUniqueID: String
        me: User
    }

    type loginStatus{
        status: String
        token: String!
        user: User!
    }

    type verifyToken{
        status: String
        user: User!
    }

    type Mutation {
        createVehicle(vehicle: VehicleInput): Vehicle
        createAnimal(animal: AnimalInput): Animal
        createNeighborhood(name: String!, location: LocationInput!, dataRetention: String!): Neighborhood!
        createPartialAnimal(partial: PartialAnimalInput!): PartialAnimal!
        createPartialVehicle(partial: PartialVehicleInput!): PartialVehicle!
        register(user: RegistrationInput): User!
        login(token: String): loginStatus
        addPrivilege(email: String!): String
        changePermissions(id: ID!): Neighborhood!
    }

    schema {
        query: Query
        mutation: Mutation
    }
`);
