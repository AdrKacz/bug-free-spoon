import { Table } from "sst/node/table";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export async function handler(event: any) {
    const group = event.pathParameters.group;

    const data = JSON.parse(event.body);

    const response = await documentClient.send(new PutCommand({
        TableName: Table.Chat.tableName,
        Item: {
            PK: `group:${group}`,
            SK: `message:${(new Date()).toISOString()}`,
            text: data.text,
            user: data.user,
        },
    }));

    if (response.$metadata.httpStatusCode !== 200) {
        throw new Error("Failed to save message");
    }
    return { statusCode: 200 };

}