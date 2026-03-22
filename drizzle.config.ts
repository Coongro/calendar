import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/schema/calendar.ts', './src/schema/event-type.ts', './src/schema/event.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
