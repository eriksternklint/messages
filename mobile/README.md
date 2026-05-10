# Prism Mobile (Expo)

React Native mobile app for Prism news, built with Expo Router.

## Setup

```bash
cd mobile
npm install
```

Set the API URL to your deployed web backend:

```bash
# .env
EXPO_PUBLIC_API_URL=https://your-prism-deployment.vercel.app
# For local dev:
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000  # your local IP
```

## Run

```bash
npm start          # Expo Go (scan QR)
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

## Architecture

The mobile app is a thin client — it fetches all data from the shared Next.js API backend:

- `GET /api/feed` → personalized story feed
- `GET /api/article/:id` → full article with AI summary
- `POST /api/profile` → user stats (sends localStorage interactions)

All AI processing, RSS ingestion, and personalization runs server-side.
