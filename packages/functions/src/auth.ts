import { AuthHandler, GoogleAdapter, Session } from "sst/node/auth";

declare module "sst/node/auth" {
    export interface SessionTypes {
        user: {
            userID: string;
        };
    }
}

// Google Client ID is public
const GOOGLE_CLIENT_ID = "174715472747-vlvaq3qg5au199l9ot2ceo3l1scf8nkt.apps.googleusercontent.com"

export const handler = AuthHandler({
    providers: {
        google: GoogleAdapter({
            mode: "oidc",
            clientID: GOOGLE_CLIENT_ID,
            onSuccess: async (tokenset) => {
                const claims = tokenset.claims()
                console.log("Google claims:", claims)

                // Save the user to the database if needed

                return Session.parameter({
                    redirect: process.env.SITE_URL!,
                    type: "user",
                    properties: {
                        userID: `google:${claims.sub}`
                    },
                })
            },
        }),
    },
});