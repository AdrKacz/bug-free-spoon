import { Table } from "sst/node/table";

import { AuthHandler, GoogleAdapter, Session } from "sst/node/auth";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

declare module "sst/node/auth" {
    export interface SessionTypes {
        user: {
            userID: string;
        };
    }
}

// Google Client ID is public
const GOOGLE_CLIENT_ID = "174715472747-vlvaq3qg5au199l9ot2ceo3l1scf8nkt.apps.googleusercontent.com"

export const handler = AuthHandler({
    providers: {
        google: GoogleAdapter({
            mode: "oidc",
            clientID: GOOGLE_CLIENT_ID,
            onSuccess: async (tokenset) => {
                const claims = tokenset.claims()
                console.log("Google claims:", claims)

                const userID = `google:${claims.sub}`

                // Save the user to the database
                await documentClient.send(new UpdateCommand({
                    TableName: Table.Chat.tableName,
                    Key: {
                        PK: `user:${userID}`,
                        SK: "meta",
                    }
                }));

                return Session.parameter({
                    redirect: process.env.SITE_URL!,
                    type: "user",
                    properties: { userID },
                })
            },
        }),
    },
});