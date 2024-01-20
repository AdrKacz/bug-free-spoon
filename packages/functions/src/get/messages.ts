import { Table } from "sst/node/table";
import { ApiHandler } from "sst/node/api";
import { useSession } from "sst/node/auth";

import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const translateClient = new TranslateClient({});

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommandOutput, GetCommand, QueryCommand, QueryCommandInput, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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
    const users: Record<string, GetCommandOutput> = { userID: user }
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
            try {
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
            } catch (error) {
                console.error(`Failed to translate message <${item.text}> from ${item.language} to ${preferredLanguage}`);
                text = item.text;
            }
        }

        if (typeof users[item.user] === 'undefined') {
            users[item.user] = await documentClient.send(new GetCommand({
                TableName: Table.Chat.tableName,
                Key: {
                    PK: `user:${item.user}`,
                    SK: "meta",
                },
            }));
        }

        messages.push({
            originalText: item.text,
            text,
            user: {
                userID: users[item.user].Item?.PK.replace('user:', ''),
                languages: users[item.user].Item?.languages,
                picture: users[item.user].Item?.picture ?? `https://api.dicebear.com/7.x/personas/svg?seed=${item.user}`
            },
            createdAt: item.SK.replace("message:", ""),
        });
    }

    // Sort messages from oldest to newest
    messages.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Check if at least one user is typing
    const typing = await documentClient.send(new QueryCommand({
        TableName: Table.Chat.tableName,
        KeyConditionExpression:
            "PK = :group AND begins_with(SK, :typing)",
        ExpressionAttributeValues: {
            ":group": `group:${group}`,
            ":typing": "typing:",
        },
    }));

    // Check if at least one user is typing in the last 5 seconds
    const now = (new Date()).getTime();
    let typingUsers = typing.Items?.filter((item) => {
        return (now - new Date(item.dt ?? 0).getTime()) < 5000;
    });
    // Filter out current user
    typingUsers = typingUsers?.filter((item) => {
        return item.SK.replace("typing:", "") !== userID;
    });
    const isTyping = typingUsers && typingUsers.length > 0;

    return {
        statusCode: 200,
        body: JSON.stringify({ messages, isTyping }),
    };
})

const getQuery = (group: string, from: string, lastEvaluatedKey?: Record<string, any>) => {
    const query: QueryCommandInput = {
        TableName: Table.Chat.tableName,
        KeyConditionExpression:
            "PK = :group AND SK BETWEEN :messages AND :max",
        ExpressionAttributeValues: {
            ":group": `group:${group}`,
            ":messages": `message:${from}`,
            ":max": 'message:9999', // Year 9999
        },
    }

    if (lastEvaluatedKey) {
        query["ExclusiveStartKey"] = lastEvaluatedKey;
    }

    return query;
}