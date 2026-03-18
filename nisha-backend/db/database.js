import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.join(__dirname, 'db.json');

const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { messages: [] });

await db.read();

// Ensure default structure
db.data.messages ??= [];
await db.write();

export default db;
