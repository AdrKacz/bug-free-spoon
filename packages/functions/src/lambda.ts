import { Table } from "sst/node/table";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export async function handler() {
    const command = new GetCommand({
        // Get the table name from the environment variable
        TableName: Table.Counter.tableName,
        // Get the row where the counter is called "clicks"
        Key: {
            counter: "clicks",
        },
    });

    const response = await documentClient.send(command);

    // If there is a row, then get the value of the
    // column called "tally"
    let count = response.Item ? response.Item.tally : 0;

    return {
        statusCode: 200,
        body: count,
    };
}