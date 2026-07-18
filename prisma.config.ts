import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    seed: 'tsx --env-file=.env prisma/seed.ts'
  },
  datasource: {
    url: "postgresql://postgres:crypto_arb_2026@localhost:5432/crypto_arbitrage"
  }
});
