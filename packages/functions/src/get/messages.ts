import { Table } from "sst/node/table";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const translateClient = new TranslateClient({});

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, QueryCommandInput, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient);


export const handler = ApiHandler(async (event: any) => {
    const session = useSession();

    // Check user is authenticated
    if (session.type !== "user") {
        throw new Error("Not authenticated");
    }

    // Get user language
    const userID = session.properties.userID;
    const user = await documentClient.send(new GetCommand({
        TableName: Table.Chat.tableName,
        Key: {
            PK: `user:${userID}`,
            SK: "meta",
        },
    }));

    // Default to English if languages is undefined or empty
    let languages: string[] = ["en"];
    if (user.Item?.languages && user.Item?.languages.length > 0) {
        languages = user.Item.languages;
    }
    const preferredLanguage = languages[0];

    // Get messages
    const group = event.pathParameters.group;
    const from = event.pathParameters.from;

    let response = await documentClient.send(new QueryCommand(getQuery(group, from)));
    const items = response.Items ?? [];
    while (response.LastEvaluatedKey) {
        const lastEvaluatedKey = response.LastEvaluatedKey;
        response = await documentClient.send(new QueryCommand(getQuery(group, from, lastEvaluatedKey)));
        items.push(...(response.Items ?? []));
    }

    // Process messages
    const messages = []
    for (const item of items) {
        let text;
        if (languages.includes(item.language)) {
            // Check if original message is already in the one of user's languages
            text = item.text;
        } else if (typeof item[`text:${preferredLanguage}`] === 'string') {
            // Check if message is already translated to user's preferred language
            text = item[`text:${preferredLanguage}`];
        } else {
            // Translate message to user's preferred language
            const response = await translateClient.send(new TranslateTextCommand({
                SourceLanguageCode: item.language,
                TargetLanguageCode: preferredLanguage,
                Text: item.text,
            }));


            // Save translated message
            await documentClient.send(new UpdateCommand({
                TableName: Table.Chat.tableName,
                Key: {
                    PK: item.PK,
                    SK: item.SK,
                },
                UpdateExpression: "SET #text = :text",
                ExpressionAttributeNames: {
                    "#text": `text:${preferredLanguage}`,
                },
                ExpressionAttributeValues: {
                    ":text": response.TranslatedText,
                },
            }));

            text = response.TranslatedText
        }

        messages.push({
            originalText: item.text,
            text,
            user: item.user,
            createdAt: item.SK.replace("message:", ""),
        });
    }

    // Sort messages from oldest to newest
    messages.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

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