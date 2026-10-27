const path = require('path');
const dotenv = require('dotenv');

// Check root .env first, then current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Harmonize Gemini key: if VITE_GEMINI_API_KEY is provided, mirror to GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
}

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (!process.env.GEMINI_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
  missingEnvVars.push('GEMINI_API_KEY (or VITE_GEMINI_API_KEY)');
}

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error(`⚠️ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file. Refer to .env.example for required variables.');
  process.exit(1);
}

if (process.env.NODE_ENV !== 'test') {
  console.log('✅ All required environment variables are configured');
}

