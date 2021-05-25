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

    type Query {
        vehicles: [Vehicle!]
    }

    type Mutation {
        createVehicle(vehicle:VehicleInput): Vehicle
    }

    schema {
        query: Query
        mutation: Mutation
    }
`)
