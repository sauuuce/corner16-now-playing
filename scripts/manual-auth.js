const SPOTIFY_CLIENT_ID = 'ea6a84cb94eb45dab4d99b30b9676051';
const SPOTIFY_CLIENT_SECRET = '427048c82e8442d3a1689eeccbb668ef';
const SCOPES = 'user-read-currently-playing user-read-playback-state';

console.log('🎵 Spotify Manual Authorization Process\n');

console.log('STEP 1: Open this URL in your browser:');
console.log('=' .repeat(80));

// Use a secure public redirect URI that Spotify accepts
const REDIRECT_URI = 'https://developer.spotify.com/callback';

const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  response_type: 'code',
  client_id: SPOTIFY_CLIENT_ID,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  show_dialog: 'true'
})}`;

console.log(authUrl);
console.log('=' .repeat(80));

console.log('\n🔒 IMPORTANT: You need to add this redirect URI to your Spotify app first:\n');
console.log('STEP 1: Go to https://developer.spotify.com/dashboard');
console.log('STEP 2: Click on your app (Client ID: ea6a84cb94eb45dab4d99b30b9676051)');
console.log('STEP 3: Click "Edit Settings"');
console.log('STEP 4: In "Redirect URIs" section, add: https://developer.spotify.com/callback');
console.log('STEP 5: Click "Save"');
console.log('\nSTEP 6: Then click the authorization URL above');
console.log('STEP 7: After authorizing, copy the "code" from the redirect URL');
console.log('STEP 8: Run: node scripts/exchange-token.js YOUR_CODE_HERE');
console.log('\n📝 The redirect will show an error page (that\'s normal), just copy the code!');