import { Table } from "sst/node/table";

import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

    const response = await documentClient.send(new UpdateCommand({
        TableName: Table.Chat.tableName,
        Key: {
            PK: `user:${userID}`,
            SK: "meta",
        },
        UpdateExpression: "SET languages = :languages",
        ExpressionAttributeValues: {
            ":languages": data.languages,
        },
    }));

    if (response.$metadata.httpStatusCode !== 200) {
        throw new Error("Failed to update user");
    }
    return { statusCode: 200 };
})