const { buildSchema } = require("graphql");

module.exports = buildSchema(`

    type Vehicle {
        _id: ID!
        createdAt: Float!
        location: [String!]!
        color: String
        make: String
        model: String
        license: String
        files: [String!]
    }

    input VehicleInput {
        location: [String!]
        color: String
        make: String
        model: String
        license: String
    }

    type Animal {
        _id: ID!
        createdAt: Float!
        location: [String!]!
        color: String
        breed: String
        type: String
        files: [String!]
    }

    input AnimalInput {
        location: [String!]!
        color: String
        breed: String
        type: String
    }

    enum Role {
        ADMIN
        PRIVILEGED
        USER
    }

    type User {
        """
        there will be a password field in db but it will not be queried
        """
        _id: ID!
        createdAt: Float!
        name: String!
        email: String!
        role: Role!
    }

    input RegistrationInput {
        name: String!
        email: String!
        password: String!
    } 

    type Query {
        vehicles: [Vehicle!]
        findVehicles(params: VehicleInput!): [Vehicle!]
        animals: [Animal!]
        me: User
    }

    type Mutation {
        createVehicle(vehicle: VehicleInput): Vehicle
        createAnimal(animal: AnimalInput): Animal
        register(user: RegistrationInput): User!
        login(email: String!, password: String!): String
        addPrivilege(email: String!): String
    }

    schema {
        query: Query
        mutation: Mutation
    }
`);
