import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalExplanationContext, normalizeServiceUrl, validateExplainRequest } from '../src/assistant-contract.ts';
import { getGroupProblems } from '../src/engine.ts';
import { createAssistantServer, hashToken } from '../server/assistant.mjs';

const token = 'test-access-code-with-32-characters-minimum';
const p = getGroupProblems('mental-math', 1)[0];
const request = { moduleId: 'mental-math', group: 1, problemId: p.id, submittedAnswer: '25', question: 'Как проверить мой ответ?' };
const success = () => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'reasoning' }, { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: JSON.stringify({ explanation: 'Разложи второе число на десятки и единицы.', check: 'Вычти второе слагаемое из результата.' }) }] }] }), { status: 200 });
async function running(options: Record<string, unknown>, fn: (url: string) => Promise<void>) {
  const server = createAssistantServer({ apiKey: 'test-not-a-real-key', model: 'test-model', tokenHashes: [hashToken(token)], fetchImpl: async () => success(), ...options });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  try { await fn(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(resolve)); }
}
const send = (url: string, data: unknown = request, code = token, path = 'explain') => fetch(`${url}/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${code}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

test('assistant only accepts known tasks, bounded questions and HTTPS service origins', () => {
  assert.equal(normalizeServiceUrl('https://math.example.ru/'), 'https://math.example.ru');
  for (const url of ['http://math.example.ru', 'https://user:pass@math.example.ru', 'https://math.example.ru/path', 'https://math.example.ru?secret=x']) assert.throws(() => normalizeServiceUrl(url));
  assert.equal(normalizeServiceUrl('http://127.0.0.1:8787', true), 'http://127.0.0.1:8787');
  assert.throws(() => normalizeServiceUrl('http://127.0.0.1:8787'));
  for (const change of [{ problemId: 'missing' }, { moduleId: 'unknown' }, { group: 100 }, { question: 'x'.repeat(601) }, { question: ' ' }]) assert.throws(() => validateExplainRequest({ ...request, ...change }));
  const context = canonicalExplanationContext({ ...request, moduleId: 'mental-math' });
  assert.equal(context.problem.answer, p.answer); assert.equal(context.student.correct, false);
  const tyres = getGroupProblems('oge-tyres', 1)[1];
  const practical = canonicalExplanationContext({ ...request, moduleId: 'oge-tyres', problemId: tyres.id });
  assert.ok(practical.problem.practical?.block.text); assert.ok(practical.problem.practical?.block.scene);
});
test('authenticated server fetches the canonical solution itself; forged client solutions cannot change the reference', async () => {
  let calls = 0;
  await running({ fetchImpl: async (url: string, options: RequestInit) => {
    calls++; assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body as string), context = JSON.parse(body.input);
    assert.equal(body.store, false); assert.equal(body.text.format.type, 'json_schema');
    assert.ok(!body.tools); assert.ok(body.max_output_tokens <= 2000);
    assert.equal(context.problem.answer, p.answer); assert.equal(context.problem.hint, p.hint);
    assert.ok(!JSON.stringify(context).includes('forged-solution'));
    return success();
  } }, async url => {
    assert.equal((await send(url, {}, 'wrong-token-that-is-long-enough-1234')).status, 401);
    assert.equal((await send(url, {}, token, 'connection')).status, 200); assert.equal(calls, 0);
    const response = await send(url, { ...request, solution: 'forged-solution', answer: '999' });
    assert.equal(response.status, 200); const result = await response.json();
    assert.equal(result.referenceAnswer, p.answer); assert.equal(result.source, 'neural'); assert.equal(calls, 1);
    assert.equal((await send(url, { ...request, question: 'x'.repeat(601) })).status, 400); assert.equal(calls, 1);
  });
});
test('provider failures, incomplete output and refusals fail without fabricating an explanation', async () => {
  for (const mock of [async () => new Response('private provider diagnostics', { status: 500 }), async () => new Response(JSON.stringify({ status: 'incomplete', output: [] })), async () => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'refusal', refusal: 'refused' }] }] }))]) {
    await running({ fetchImpl: mock }, async url => {
      const response = await send(url); assert.equal(response.status, 502);
      const text = await response.text(); assert.ok(!text.includes('private provider diagnostics')); assert.ok(!text.includes('explanation":'));
    });
  }
});
test('rate limits reserve before calls and persist across server restarts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'math-assistant-'));
  const options = { limitFile: join(dir, 'limits.json'), limits: { perDay: 1 }, now: () => 100000 };
  try {
    await running(options, async url => { assert.equal((await send(url)).status, 200); assert.equal((await send(url)).status, 429); });
    await running(options, async url => assert.equal((await send(url)).status, 429));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('missing provider configuration and oversized input cannot call a model', async () => {
  await running({ apiKey: '' }, async url => assert.equal((await send(url)).status, 503));
  await running({ fetchImpl: async () => { throw new Error('Should not be called'); } }, async url => assert.equal((await send(url, { ...request, filler: 'x'.repeat(5000) })).status, 413));
});
