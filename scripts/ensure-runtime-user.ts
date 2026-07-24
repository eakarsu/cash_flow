import 'dotenv/config';
import { bootstrapUser } from '../src/server/auth.js';
import { readRuntimeConfig } from '../src/server/config.js';
import { openDatabase } from '../src/server/database.js';

const email = String(process.env.BOOTSTRAP_EMAIL || '').trim().toLowerCase();
const password = String(process.env.BOOTSTRAP_PASSWORD || '');
if (!email.includes('@') || password.length < 12) throw new Error('Valid BOOTSTRAP_EMAIL and a 12+ character BOOTSTRAP_PASSWORD are required');
const config = readRuntimeConfig();
const database = openDatabase(config.databasePath, { initialize: true });
try {
  const existing = database.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').get(email);
  if (existing) console.log('Runtime administrator already exists');
  else console.log(`Created operator ${bootstrapUser(database, { email, password, role: 'operator' })}`);
} finally { database.close(); }
