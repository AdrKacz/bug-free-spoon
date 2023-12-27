import { Table } from "sst/node/table";

import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = ApiHandler(async (event: any) => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== "user") {
        throw new Error("Not authenticated");
    }

    const userID = session.properties.userID;

    const group = event.pathParameters.group;

    const data = JSON.parse(event.body);

    const response = await documentClient.send(new PutCommand({
        TableName: Table.Chat.tableName,
        Item: {
            PK: `group:${group}`,
            SK: `message:${(new Date()).toISOString()}`,
            text: data.text,
            user: userID,
        },
    }));

    if (response.$metadata.httpStatusCode !== 200) {
        throw new Error("Failed to save message");
    }
    return { statusCode: 200 };

})