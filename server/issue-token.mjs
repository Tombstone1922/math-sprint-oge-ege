import { randomBytes, createHash } from 'node:crypto';
const token = randomBytes(32).toString('base64url');
console.log(`Код ученика (сохраните и передайте лично):\n${token}\n\nSHA-256 для ASSISTANT_TOKEN_HASHES:\n${createHash('sha256').update(token).digest('hex')}`);
