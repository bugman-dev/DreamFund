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

Sign in with Google, or continue as a guest. Each person’s goals and transactions stay on the device, in a local database.

## Run it

From this folder:

```bash
npm install
npx expo start
```

Then open the project in Expo Go, an Android emulator, an iOS simulator, or the browser.

Google sign-in needs a web OAuth client id. Copy `.env.sample` to `.env` and set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Restart Expo after changing it. Without that value, the Google button stays off and guest sign-in still works.

```bash
npm test
```

runs the savings rules tests.
