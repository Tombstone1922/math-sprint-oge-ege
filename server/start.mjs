import { createAssistantServer } from './assistant.mjs';

let tokenHashes;
try {
  tokenHashes = JSON.parse(process.env.ASSISTANT_TOKEN_HASHES ?? '[]');
  if (!Array.isArray(tokenHashes) || !tokenHashes.length || !tokenHashes.every(h => typeof h === 'string' && /^[a-f0-9]{64}$/.test(h))) throw new Error();
} catch { throw new Error('Set ASSISTANT_TOKEN_HASHES to a JSON array of SHA-256 hashes. Run node server/issue-token.mjs.'); }
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) throw new Error('OPENAI_API_KEY and OPENAI_MODEL must be set on the server.');
const port = Number(process.env.PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const server = createAssistantServer({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL, tokenHashes, limitFile: process.env.ASSISTANT_LIMIT_FILE ?? './server/data/limits.json' });
server.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`Math assistant listening on port ${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 35000).unref(); });
