import { Table } from "sst/node/table";

import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = ApiHandler(async () => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== "user") {
        throw new Error("Not authenticated");
    }

    const userID = session.properties.userID;

    const response = await documentClient.send(new GetCommand({
        TableName: Table.Chat.tableName,
        Key: {
            PK: `user:${userID}`,
            SK: "meta",
        },
    }));

    if (response.$metadata.httpStatusCode !== 200 || !response.Item) {
        throw new Error("Failed to get user");
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            userID: response.Item.PK.replace("user:", ""),
            sessionID: userID,
            languages: response.Item.languages,
        }),
    };
});