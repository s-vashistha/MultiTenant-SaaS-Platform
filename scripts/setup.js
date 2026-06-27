const fs = require('fs');
const path = require('path');

const envExample = path.join(__dirname, '../backend/.env.example');
const envTarget  = path.join(__dirname, '../backend/.env');

if (!fs.existsSync(envTarget)) {
  fs.copyFileSync(envExample, envTarget);
  console.log('✅ Created backend/.env from .env.example');
  console.log('⚠️  Update DB_PASSWORD in backend/.env before running!');
} else {
  console.log('ℹ️  backend/.env already exists, skipping.');
}
