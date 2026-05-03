const fs = require('fs');
const path = require('path');

const sourcePath = 'C:\\Users\\edmon\\.gemini\\antigravity\\brain\\3bbe7206-b835-499b-9b49-484e5ec71c3e\\uniwell_logo_v2_1777777769581.png';

const targets = [
  'assets/icon.png',
  'assets/favicon.png',
  'assets/splash.png',
  'assets/adaptive-icon.png'
];

try {
  if (fs.existsSync(sourcePath)) {
    targets.forEach(target => {
      const fullPath = path.join(__dirname, target);
      fs.copyFileSync(sourcePath, fullPath);
      console.log(`✅ Successfully updated ${target}`);
    });
    console.log('\n🎉 Logo and Splash Screen updated! Restart your Expo server to see the changes.');
  } else {
    console.error('❌ Could not find the generated image file.');
  }
} catch (err) {
  console.error('Error applying assets:', err);
}
