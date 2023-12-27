export async function handler(event: any) {
    const user = event.pathParameters.user;

    return {
        statusCode: 200,
        body: JSON.stringify({
            user,
        }),
    };
}