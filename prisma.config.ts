import { defineConfig } from '@prisma/config';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  for (const file of ['.env', '.env.local']) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?([^"'\r\n]+)["']?/);
        if (match) {
          process.env[match[1]] = match[2].trim();
        }
      });
    }
  }
}

loadEnv();

export default defineConfig({
  migrations: {
    seed: 'tsx --env-file=.env prisma/seed.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL
  }
});
