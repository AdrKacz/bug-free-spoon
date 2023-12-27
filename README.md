# bug-free-spoon
## Configure Authentication
### Google

> [Check SST tutorial](https://sst.dev/examples/how-to-add-google-login-to-your-sst-apps.html)


You will need to **add your API URI** to the **authorise URL** in **Google Cloud**.

Once your API is deployed:
1. Go to Google Cloud Console
2. Go to "APIs & Services"
3. Go to "Credentials"
4. Select your client under "OAuth 2.0 Client IDs"
5. Click "ADD URI" under "Authorized redirect URIs"
6. Enter your callback API URI: `https://API_ID.execute-api.REGION.amazonaws.com/auth/google/callback`
7. Hit "Save"
