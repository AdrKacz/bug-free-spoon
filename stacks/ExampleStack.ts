import { Api, StaticSite, StackContext, Table, Auth } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib";

function getLocalAddress() {
  const interfaces = require('os').networkInterfaces();
  const results: Record<string, string[]> = {}

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      const { address, family, internal } = iface;
      if ((family === 'IPv4' || family === 4) && !internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(address);
      }
    }
  }
  console.log('\nNetwork Interfaces:\n', results)
  return results['en0'][0]
}

export function ExampleStack({ stack }: StackContext) {
  // Create the table
  const table = new Table(stack, "Chat", {
    fields: {
      PK: "string",
      SK: "string",
    },
    primaryIndex: { partitionKey: "PK", sortKey: "SK" },
    // will delete all objects when stack is destroyed and will not enable point in time recovery
    cdk: {
      table: {
        removalPolicy: RemovalPolicy.DESTROY,
        pointInTimeRecovery: false
      }
    },
  });

  // Create the HTTP API
  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        // Bind the table name to our API
        bind: [table],
      },
    },
    routes: {
      "GET /session": "packages/functions/src/get/session.handler",

      "POST /user": "packages/functions/src/post/user.handler",

      "POST /user/typing": "packages/functions/src/post/user-typing.handler",

      "GET /messages/{group}/{from}": {
        function: {
          handler: "packages/functions/src/get/messages.handler",
          permissions: ['translate:TranslateText'],
        },
      },
      "POST /message/{group}": {
        function: {
          handler: "packages/functions/src/post/message.handler",
          permissions: ['comprehend:DetectDominantLanguage'],
        },
      }
    },
  });

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      environment: {
        SITE_URL: process.env.SITE_URL ?? `http://${getLocalAddress()}:3000/`,
      },
    },
  });

  auth.attach(stack, {
    api,
    prefix: "/auth", // optional
  });

  // Deploy our React app
  const site = new StaticSite(stack, "ReactSite", {
    path: "packages/frontend",
    buildCommand: "npm run build",
    buildOutput: "build",
    environment: {
      REACT_APP_API_URL: api.url,
    },
  });

  // Show the URLs in the output
  stack.addOutputs({
    SiteUrl: site.url,
    ApiEndpoint: api.url
  });
}