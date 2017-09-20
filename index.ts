import * as express from 'express';
import { createProxySchema, HttpGraphQLClient } from 'graphql-weaver';
import * as graphqlHTTP from 'express-graphql';
import { GraphQLSchema, DocumentNode } from 'graphql';

function getAuthTokenFromGraphQLContext(context: any) {
  if (!context) {
    console.log("not valid", context)
    return undefined
  }
  // console.log('context', context);
  console.log('headers', context.headers);
  return context.headers['authorization'];
}

class AuthForwardingGraphQLClient extends HttpGraphQLClient {
  protected async getHeaders(document: DocumentNode, variables?: { [name: string]: any }, context?: any, introspect?: boolean): Promise<{ [index: string]: string }> {
    console.log('pass', context)
    const headers = await super.getHeaders(document, context, introspect);
    return {
        ...headers,
        Authorization: getAuthTokenFromGraphQLContext(context)
    };
  }
}

async function run() {
  const schema: GraphQLSchema = await createProxySchema({
    endpoints: [{
        client: new AuthForwardingGraphQLClient({url: 'https://www.universe.com/graphql/beta'})
    }, {
        namespace: 'library',
        typePrefix: 'Zone',
        client: new AuthForwardingGraphQLClient({url: 'https://5rrx10z19.lp.gql.zone/graphql'})
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
