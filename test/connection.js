import  { ApolloServer } from 'apollo-server';
import resolvers from '../graphql/resolvers';
import typeDefs from '../graphql/schema';

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    mocks: true,
 });


server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
    });

export default server;