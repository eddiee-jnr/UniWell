const https = require('https');
const fs = require('fs');
const path = require('path');

// A beautiful, modern wellness/meditation image from Unsplash
const url = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1080&auto=format&fit=crop";

console.log("Downloading beautiful splash screen...");

https.get(url, (res) => {
  const data = [];
  res.on('data', (chunk) => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    
    // Save to all required asset files
    fs.writeFileSync(path.join(__dirname, 'assets/splash.png'), buffer);
    fs.writeFileSync(path.join(__dirname, 'assets/icon.png'), buffer);
    fs.writeFileSync(path.join(__dirname, 'assets/adaptive-icon.png'), buffer);
    fs.writeFileSync(path.join(__dirname, 'assets/favicon.png'), buffer);
    
    console.log("✅ Beautiful assets installed successfully!");
  });
}).on('error', (err) => {
  console.error("Failed to download image:", err.message);
});
