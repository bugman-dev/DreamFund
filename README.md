# Dream Fund

Dream Fund is a personal savings tracker. You set goals, decide how much of your money belongs to each one, and watch the picture change as you add, withdraw, or move money between them.

The money stays in your real account. Dream Fund only records how you have set it aside. It does not hold money, connect to a bank, or make payments.

## What you can do

- Create a goal with a name, category, target amount, optional date, and photo.
- Add money toward a goal, withdraw some of it, or transfer it to another goal.
- See what is saved, what is still left, and which goals are finished. A goal is finished when the amount set aside matches its target.
- Look through every addition, withdrawal, and transfer, and edit a record later.
- Group goals with your own categories.
- Switch the app between Forest, Ocean, and Dusk.
- Show amounts as INR, USD, or AED. The number stays the same. Only the symbol and grouping change. Dream Fund does not convert currencies.
- Sign in with Google and use **Sync with cloud** on Profile to keep goals and photos in your Google Drive app data folder (hidden from normal Drive browsing). Guest mode stays on this device only.

Each person’s goals and transactions also stay in a local database on the device.

## Run it

From this folder:

```bash
npm install
npx expo start
```

Then open the project in Expo Go, an Android emulator, an iOS simulator, or the browser.

### Google sign-in and cloud sync

1. In Google Cloud, create OAuth client IDs (**Web** + **Android**) and enable the **Google Drive API**.
2. On the OAuth consent screen, add the scope `https://www.googleapis.com/auth/drive.appdata`.
3. For the **Android** client: package name `com.dreamfund.app`, and the SHA-1 of the keystore that signed your APK.
4. In that Android client → **Advanced settings** → enable **Custom URI scheme** (needed if Google shows `Error 400: invalid_request` / “Custom URI scheme is not enabled”).
5. Copy `.env.sample` to `.env` and set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.
6. Keep the token and Drive endpoint values from `.env.sample` (or change them if Google documents new URLs).
7. Restart Expo after changing `.env`. Rebuild the APK after changing client IDs so the OAuth redirect scheme is registered.

Without a web client id, the Google button stays off and guest sign-in still works.

```bash
npm test
```

runs the savings rules tests.
