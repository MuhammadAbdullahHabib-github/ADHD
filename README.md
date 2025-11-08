# HeyGen Interactive Avatar NextJS Demo

![HeyGen Interactive Avatar NextJS Demo Screenshot](./public/demo.png)

This is a sample project and was bootstrapped using [NextJS](https://nextjs.org/).
Feel free to play around with the existing code and please leave any feedback for the SDK [here](https://github.com/HeyGen-Official/StreamingAvatarSDK/discussions).

## Getting Started FAQ

### Setting up the demo

1. Clone this repo

2. Navigate to the repo folder in your terminal

3. Run `npm install` (assuming you have npm installed. If not, please follow these instructions: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)

4. Enter your HeyGen Enterprise API Token in the `.env` file. Replace `HEYGEN_API_KEY` with your API key. This will allow the Client app to generate secure Access Tokens with which to create interactive sessions.

   You can retrieve either the API Key by logging in to HeyGen and navigating to this page in your settings: [https://app.heygen.com/settings?from=&nav=Subscriptions%20%26%20API]. 

5. (Optional) If you would like to use the OpenAI features, enter your OpenAI Api Key in the `.env` file.

6. Run `npm run dev`

### Required environment variables

Create a `.env.local` file with the following entries:

```
HEYGEN_API_KEY=your_heygen_api_key
NEXT_PUBLIC_BASE_API_URL=https://api.heygen.com

# Billing / token gating
BILLING_API_BASE=https://adhdtoolsdaily.com/wp-json/adhd/v1
BILLING_API_BEARER=your_server_to_server_bearer_token
```

> `BILLING_API_BEARER` must stay on the server. Never expose it in the client-side bundle.

### Starting sessions

NOTE: Make sure you have enter your token into the `.env` file and run `npm run dev`.

To start your 'session' with a Interactive Avatar, first click the 'start' button. If your HeyGen API key is entered into the Server's .env file, then you should see our demo Interactive Avatar appear.

If you want to see a different Avatar or try a different voice, you can close the session and enter the IDs and then 'start' the session again. Please see below for information on where to retrieve different Avatar and voice IDs that you can use.

### Which Avatars can I use with this project?

By default, there are several Public Avatars that can be used in Interactive Avatar. (AKA Interactive Avatars.) You can find the Avatar IDs for these Public Avatars by navigating to [labs.heygen.com/interactive-avatar](https://labs.heygen.com/interactive-avatar) and clicking 'Select Avatar' and copying the avatar id.

You can create your own custom Interactive Avatars at labs.heygen.com/interactive-avatar by clicking 'create interactive avatar' on the top-left of the screen.

### Where can I read more about enterprise-level usage of the Interactive Avatar API?

Please read our Interactive Avatar 101 article for more information on pricing: https://help.heygen.com/en/articles/9182113-interactive-avatar-101-your-ultimate-guide

## Embedding the avatar via iframe

The deployment exposes a lightweight embed-friendly route at `/embed`. To place the avatar inside any HTML/React/WordPress page, add an iframe that includes the purchase token in the query string. Example:

```html
<iframe
  src="https://avatar.adhdtoolsdaily.com/embed?token=YOUR_PURCHASE_TOKEN"
  style="width: 100%; min-height: 700px; border: none; border-radius: 16px;"
  allow="microphone; camera"
  loading="lazy"
></iframe>
```

- Tokens are verified only when the user presses **Start Session**.
- While a session is active the app polls `/minutes_remaining` and automatically ends the avatar when time runs out, calling `/expire_token` behind the scenes.
- Closing the avatar manually is always allowed; customers can start another session later (token verification + minutes check will run again).
