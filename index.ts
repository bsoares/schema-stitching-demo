import * as express from 'express';
import { createProxySchema, HttpGraphQLClient } from 'graphql-weaver';
import * as graphqlHTTP from 'express-graphql';
import { GraphQLSchema, DocumentNode } from 'graphql';

// function getAuthTokenFromGraphQLContext(context: any) {
//   if (!context) {
//     console.log("not valid", context)
//     return undefined
//   }
//   // console.log('context', context);
//   console.log('headers', context.headers);
//   return context.headers['authorization'];
// }

class AuthForwardingGraphQLClient extends HttpGraphQLClient {
  protected async getHeaders(document: DocumentNode, variables?: { [name: string]: any }, context?: any, introspect?: boolean): Promise<{ [index: string]: string }> {
    console.log('pass', context);
    const headers = await super.getHeaders(document, context, introspect);
    return {
      ...headers,
      'GN-APIKEY': 'dev_apikey'
    };
  }
}

async function run() {
  const schema: GraphQLSchema = await createProxySchema({
    endpoints: [{
      namespace: 'scorpion',
      client: new AuthForwardingGraphQLClient({url: 'http://graphql.lvh.me:4000/'})
    }, {
      namespace: 'kitana',
      typePrefix: 'Kitana',
      client: new AuthForwardingGraphQLClient({url: 'http://graphql-pagamento.lvh.me:3001/'}),
      fieldMetadata: {
        'Payer.profile': {
          link: {
            field: 'scorpion.profile',
            argument: 'id',
            batchMode: false,
          }
        }
      }
    }]
  })

  const app = express();

  app.use('/graphql', graphqlHTTP(request => {
    console.log(request.headers);
    return {
      schema: schema,
      context: request,
      graphiql: true
    }
  }));


  app.listen(3210);
  console.log('Server running. Open http://localhost:3210/graphql to run queries.');
}

run()
.then(a => {
  console.log(a)
})
.catch(e => {
  console.log(e)
})
;
