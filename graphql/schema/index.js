const { buildSchema } = require("graphql")

module.exports = buildSchema(`

    type Vehicle {
        _id: ID!
        createdAt: Float!
        location: [String!]!
        color: String
        make: String
        model: String
        license: String
    }

    input VehicleInput {
        location: [String!]!
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
    }

    input AnimalInput {
        location: [String!]!
        color: String
        breed: String
        type: String
    }

    type Query {
        vehicles: [Vehicle!]
        animals: [Animal!]
    }

    type Mutation {
        createVehicle(vehicle:VehicleInput): Vehicle
        createAnimal(animal:AnimalInput): Animal
    }

    schema {
        query: Query
        mutation: Mutation
    }
`)
