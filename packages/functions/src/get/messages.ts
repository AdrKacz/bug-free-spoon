import { Table } from "sst/node/table";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = ApiHandler(async (event: any) => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== "user") {
        throw new Error("Not authenticated");
    }

    // const userID = session.properties.userID;

    const group = event.pathParameters.group;
    const from = event.pathParameters.from;

    let response = await documentClient.send(new QueryCommand(getQuery(group, from)));
    const items = response.Items ?? [];
    while (response.LastEvaluatedKey) {
        const lastEvaluatedKey = response.LastEvaluatedKey;
        response = await documentClient.send(new QueryCommand(getQuery(group, from, lastEvaluatedKey)));
        items.push(...(response.Items ?? []));
    }

    const messages = items.map((item) => ({
        text: item.text,
        user: item.user,
        createdAt: item.SK.replace("message:", ""),
    }));

    return {
        statusCode: 200,
        body: JSON.stringify(messages),
    };
})

const getQuery = (group: string, from: string, lastEvaluatedKey?: Record<string, any>) => {
    const query: QueryCommandInput = {
        TableName: Table.Chat.tableName,
        KeyConditionExpression:
            "PK = :group AND SK >= :messages",
        ExpressionAttributeValues: {
            ":group": `group:${group}`,
            ":messages": `message:${from}`,
        },
    }

    if (lastEvaluatedKey) {
        query["ExclusiveStartKey"] = lastEvaluatedKey;
    }

    return query;
}