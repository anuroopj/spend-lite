# SpendLite

A minimalist Android expense tracker built with Expo Router, Clerk, and an independent Spring Boot/PostgreSQL API.

## Repositories

- `spend-lite`: Expo React Native mobile app.
- `../spendlite-api`: Java 21 / Spring Boot REST API.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from Clerk. The API URL defaults to Android emulator host `10.0.2.2`; use your computer's LAN address for a physical Android device.
3. Configure Clerk email/password. Google sign-in appears only when native Google OAuth is enabled for the Clerk instance.
4. Start the API and PostgreSQL using the API repo README, then run `npx expo start`.
5. Build a development client for Clerk native authentication and SQLCipher; Expo Go is not sufficient.

## Commands

- `npx expo lint`
- `npx tsc --noEmit`
- `npm test -- --runInBand`
- `npx expo-doctor`

EAS development and Android production build profiles are defined in `eas.json`. A GitHub Actions workflow can create Android production builds; publishing to Google Play remains a manual staged rollout.

## Dependency audit

The current SDK 58 dependency tree reports high-severity advisories in transitive Expo CLI packages (`node-forge` and `zod`). `npm audit fix --force` proposes downgrading the SDK-compatible date picker to a breaking version, so do not apply that automatic change. Recheck the audit when Expo publishes compatible dependency patches.
