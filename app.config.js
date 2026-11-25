const appJson = require('./app.json');

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';

function reverseClientScheme(clientId) {
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/i, '');
  if (!prefix || prefix === clientId) return null;
  return `com.googleusercontent.apps.${prefix}`;
}

const schemes = ['dreamfund'];
for (const clientId of [androidClientId, iosClientId]) {
  const scheme = reverseClientScheme(clientId);
  if (scheme && !schemes.includes(scheme)) schemes.push(scheme);
}

module.exports = {
  ...appJson.expo,
  scheme: schemes,
};
