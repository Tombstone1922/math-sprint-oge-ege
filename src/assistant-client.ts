import type { AssistantConnection, ExplainRequest, Explanation } from './assistant-contract.ts';
import { normalizeServiceUrl } from './assistant-contract.ts';

export async function askAssistant(connection: AssistantConnection, request?: ExplainRequest, signal?: AbortSignal): Promise<Explanation | null> {
  const url = normalizeServiceUrl(connection.url, __DEV__);
  const controller = new AbortController(), abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, 40000);
  try {
    const response = await fetch(`${url}/v1/${request ? 'explain' : 'connection'}`, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${connection.token}` }, body: JSON.stringify(request ?? {}), signal: controller.signal });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Доступ к помощнику не подтверждён. Проверь код у преподавателя.');
      if (response.status === 429) throw new Error('На сегодня или на ближайшую минуту достигнут лимит вопросов. Попробуй позже.');
      if (response.status === 400 || response.status === 404 || response.status === 409) throw new Error('Эту задачу пока не удалось найти на сервере. Обнови приложение или сообщи преподавателю.');
      throw new Error('Помощник сейчас недоступен. Проверенное решение остаётся под рукой.');
    }
    const data = await response.json();
    if (!request) { if (data.ready !== true) throw new Error('Помощник ещё не настроен преподавателем.'); return null; }
    if (data.source !== 'neural' || data.problemId !== request.problemId || !['explanation', 'check', 'referenceAnswer'].every(k => typeof data[k] === 'string' && data[k].length > 0 && data[k].length <= 6000)) throw new Error('Не удалось прочитать объяснение. Попробуй ещё раз.');
    return data as Explanation;
  } catch (error) {
    if (error instanceof Error && error.name !== 'TypeError' && error.name !== 'AbortError') throw error;
    throw new Error(controller.signal.aborted ? 'Запрос прерван или занял слишком много времени. Можно попробовать снова.' : 'Нет связи с помощником. Проверь интернет; решение доступно без сети.');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
