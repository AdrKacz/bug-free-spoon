import { Api, StaticSite, StackContext, Table, Auth } from "sst/constructs";
import { RemovalPolicy } from "aws-cdk-lib";

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
      "GET /messages/{group}/{from}": "packages/functions/src/get/messages.handler",
      "GET /user/{user}": "packages/functions/src/get/user.handler",
      "GET /session": "packages/functions/src/get/session.handler",
      "POST /message/{group}": "packages/functions/src/post/message.handler",
    },
  });

  const auth = new Auth(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      environment: {
        SITE_URL: process.env.SITE_URL ?? "http://127.0.0.1:3000/",
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