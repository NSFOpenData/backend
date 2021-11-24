import ApolloClient from 'apollo-boost'

export const getClient = (token) => {
    return new ApolloClient({
        uri: 'http://localhost:3000/graphql',
        request: operation => {
            operation.setContext({
                headers: {
                    "Authorization" : token ? `Bearer ${token}` : ''
                }
            })
        }, 
        onError: (e) => {
            console.log(e);
        }
})};