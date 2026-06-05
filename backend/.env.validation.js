require('dotenv').config();

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'VITE_GEMINI_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file. Refer to .env.example for required variables.');
  process.exit(1);
}

console.log('✅ All required environment variables are configured');
