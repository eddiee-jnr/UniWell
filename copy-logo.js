const fs = require('fs');
const src = 'C:\\Users\\edmon\\.gemini\\antigravity\\brain\\b8025cef-e1dd-4223-88e5-1b89e0c1d6a0\\uniwell_logo_1777770528247.png';
const buf = fs.readFileSync(src);
fs.writeFileSync('assets/icon.png', buf);
fs.writeFileSync('assets/adaptive-icon.png', buf);
fs.writeFileSync('assets/splash.png', buf);
fs.writeFileSync('assets/favicon.png', buf);
console.log('✅ UniWell logo applied to all assets!');
