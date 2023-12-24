import { Table } from "sst/node/table";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export async function handler() {
    const response = await documentClient.send(new GetCommand({
        // Get the table name from the environment variable
        TableName: Table.Counter.tableName,
        // Get the row where the counter is called "clicks"
        Key: {
            counter: "clicks",
        },
    }));

    // If there is a row, then get the value of the
    // column called "tally"
    let count = response.Item ? response.Item.tally : 0;

    await documentClient.send(new UpdateCommand({
        TableName: Table.Counter.tableName,
        Key: {
            counter: "clicks",
        },
        // Update the "tally" column
        UpdateExpression: "SET tally = :count",
        ExpressionAttributeValues: {
            // Increase the count
            ":count": ++count,
        },
    }));

    return {
        statusCode: 200,
        body: count,
    };
}