import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { ASSISTANT_INSTRUCTIONS, canonicalExplanationContext, validateExplainRequest } from '../src/assistant-contract.ts';
import { createLimits } from './limits.mjs';

const FORMAT = { type: 'json_schema', name: 'math_explanation', strict: true, schema: { type: 'object', properties: { explanation: { type: 'string' }, check: { type: 'string' } }, required: ['explanation', 'check'], additionalProperties: false } };
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export function createAssistantServer({ apiKey, model, tokenHashes = [], limitFile, fetchImpl = fetch, now = Date.now, limits = {} } = {}) {
  const allowed = new Set(tokenHashes);
  const reserve = createLimits({ file: limitFile, now, ...limits });
  let inFlight = 0;
  const server = createServer(async (req, res) => {
    function reply(status, data) {
      if (res.destroyed) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(data));
    }
    if (req.method === 'GET' && req.url === '/health') return reply(200, { ok: true });
    if (req.method !== 'POST' || !['/v1/explain', '/v1/connection'].includes(req.url)) return reply(404, { error: 'not_found' });
    const token = /^Bearer ([A-Za-z0-9_-]{32,128})$/.exec(req.headers.authorization ?? '')?.[1];
    if (!token || !allowed.has(hashToken(token))) return reply(401, { error: 'access_denied' });
    if (!apiKey || !model || allowed.size === 0) return reply(503, { error: 'not_configured' });
    if (req.url === '/v1/connection') { req.resume(); return reply(200, { ready: true }); }
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'json_required' });
    if (Number(req.headers['content-length']) > 4096) return reply(413, { error: 'too_large' });
    let request;
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 4096) { reply(413, { error: 'too_large' }); req.resume(); return; } chunks.push(chunk); }
      request = validateExplainRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch { return reply(400, { error: 'invalid_problem_or_question' }); }
    if (inFlight >= 4) return reply(429, { error: 'busy' });
    try { if (!reserve(hashToken(token))) return reply(429, { error: 'limit' }); }
    catch { return reply(503, { error: 'quota_storage_unavailable' }); }
    inFlight++;
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30000);
    const abort = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', abort);
    try {
      const context = canonicalExplanationContext(request);
      const response = await fetchImpl('https://api.openai.com/v1/responses', { method: 'POST', redirect: 'error', signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, store: false, max_output_tokens: 1800, instructions: ASSISTANT_INSTRUCTIONS, input: JSON.stringify(context), text: { format: FORMAT } }) });
      if (!response.ok) return reply(502, { error: 'provider_unavailable' });
      const data = await response.json();
      if (data.status !== 'completed' || !Array.isArray(data.output)) return reply(502, { error: 'incomplete_response' });
      const content = data.output.filter(i => i.type === 'message' && i.role === 'assistant').flatMap(i => i.content ?? []);
      if (content.some(c => c.type === 'refusal')) return reply(502, { error: 'no_explanation' });
      const result = JSON.parse(content.filter(c => c.type === 'output_text').map(c => c.text).join(''));
      if (!result || !['explanation', 'check'].every(k => typeof result[k] === 'string' && result[k].trim().length > 0 && result[k].length <= 6000)) return reply(502, { error: 'invalid_response' });
      reply(200, { source: 'neural', problemId: request.problemId, explanation: result.explanation, check: result.check, referenceAnswer: context.problem.answerDisplay ?? context.problem.answer });
    } catch { reply(controller.signal.aborted ? 504 : 502, { error: 'explanation_unavailable' }); }
    finally { clearTimeout(timer); res.off('close', abort); inFlight--; }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
