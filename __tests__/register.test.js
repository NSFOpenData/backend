import 'cross-fetch/polyfill'
import { gql } from 'apollo-boost'
import { getClient } from '../test/utils'
import { setupTest } from '../test/helper'

const client = getClient();
// let authenticatedClient;

beforeAll(async () => await setupTest());
// beforeAll(async () => {
//   const registerUser = gql`
//     mutation {
//       register(
//         user: {
//           name: "Salomon",
//           email: "salomondushimirimana@gmail.com",
//           neighborhood: "Sylvan Park"
//         }
//       ) {
//         email
//         name
//         role
//         neighborhood {
//           name
//         }
//       }
//     }
//   `;

//   const authenticatedUser = await client.mutate({
//     mutation: register,
//   });

describe('Register a new user', () => {
  it('should register a new user', async () => {
    const registerUser = gql`
      mutation {
        register(
          user: {
            name: "Eric",
            email: "ericdushimirimana@gmail.com",
            neighborhood: "Sylvan Park"
          }
        ) {
          email
          name
          role
          neighborhood {
            name
          }
        }
      }
    `;

    const authenticatedUser = await client.mutate({
      mutation: registerUser,
    });

    expect(authenticatedUser.data.register.email).toBe('ericdushimirimana@gmail.com');
    expect(authenticatedUser.data.register.name).toBe('Eric');
    expect(authenticatedUser.data.register.role).toBe('USER');
    expect(authenticatedUser.data.register.neighborhood.name).toBe('Sylvan Park');
  }, 20000);
});

// todo: - figure out a way to setup a test database
// todo: - to run the tests without running the backend
// todo: - then we can write more tests.