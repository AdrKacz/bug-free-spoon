import { Table } from "sst/node/table";

import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);


export const handler = ApiHandler(async (event: any) => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== "user") {
        throw new Error("Not authenticated");
    }

    const userID = session.properties.userID;

    const data = JSON.parse(event.body);


    if (typeof data.group !== 'string') {
        throw new Error("Invalid group");
    }

    if (typeof data.isTyping !== 'boolean') {
        throw new Error("Invalid typing status");
    }

    let response;
    if (data.isTyping) {
        response = await documentClient.send(new UpdateCommand({
            TableName: Table.Chat.tableName,
            Key: {
                PK: `group:${data.group}`,
                SK: `typing:${userID}`,
            },
            UpdateExpression: "SET dt = :dt",
            ExpressionAttributeValues: {
                ":dt": (new Date()).toISOString(),
            },
        }));
    } else {
        response = await documentClient.send(new DeleteCommand({
            TableName: Table.Chat.tableName,
            Key: {
                PK: `group:${data.group}`,
                SK: `typing:${userID}`,
            },
        }));
    }

    if (response.$metadata.httpStatusCode !== 200) {
        throw new Error("Failed to update typing status");
    }
    return { statusCode: 200 };
});