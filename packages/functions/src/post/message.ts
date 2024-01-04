import { Table } from "sst/node/table";

import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { ComprehendClient, DetectDominantLanguageCommand } from "@aws-sdk/client-comprehend";

const comprehendClient = new ComprehendClient({ region: "us-east-1" }); // language detection is not available in eu-west-3

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamodbClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamodbClient);

export const handler = ApiHandler(async (event: any) => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== "user") {
        throw new Error("Not authenticated");
    }

    const userID = session.properties.userID;

    const group = event.pathParameters.group;

    const data = JSON.parse(event.body);

    // Get text original language
    const languages = await comprehendClient.send(new DetectDominantLanguageCommand({
        Text: data.text,
    }));

    // Throw if no language detected
    if (typeof languages.Languages?.[0]?.LanguageCode !== 'string') {
        throw new Error("Failed to detect language");
    }

    const language = languages.Languages[0].LanguageCode;

    const response = await documentClient.send(new PutCommand({
        TableName: Table.Chat.tableName,
        Item: {
            PK: `group:${group}`,
            SK: `message:${(new Date()).toISOString()}`,
            text: data.text,
            user: userID,
            language,
        },
    }));

    if (response.$metadata.httpStatusCode !== 200) {
        throw new Error("Failed to save message");
    }
    return { statusCode: 200 };
})