import Anthropic from '@anthropic-ai/sdk';
import { MAX_IMAGE_BYTES, MAX_TASKS, type AnalyzeRequest, type AnalyzeResponse } from '../../shared/types';

// Claude API の中継だけをする。画像も本文もログやストレージに残さない（console.log 禁止）

interface Env {
  ANTHROPIC_API_KEY: string;
}

const SYSTEM = `あなたは片づけを手伝うロボ「チリボ」です。相手は片づけが苦手な人で、決して責めません。
部屋の写真を見て、report_tasks ツールで片づけタスクを返してください。

- タスクは1〜2分で終わる具体的な動作だけにする（すてる・まとめる・重ねる・かける など）。「部屋を片づける」のような大きな指示は禁止
- まとめる・しまう・もどすタスクには、どこに置けば終わりかも書く（例:「コードを3本まとめて箱に入れる」）。置き場所が写っていなければ「箱」「かご」「机の端」のような身近な場所でいい
- 写真に写っている物だけを対象にし、x・y はその物のおおよその中心（左上が0、右下が1）
- 人物・書類の中身・画面の文字には触れない
- 口調は「ふんわり」ならやさしく、「げんき」なら明るく`;

const TOOL: Anthropic.Tool = {
  name: 'report_tasks',
  description: '部屋の写真から1分以内でできる片づけタスクを返す',
  input_schema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        minItems: 1,
        maxItems: MAX_TASKS,
        items: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '25文字以内。動作＋対象＋数' },
            min: { type: 'integer', enum: [1, 2] },
            x: { type: 'number', minimum: 0, maximum: 1 },
            y: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['text', 'min', 'x', 'y'],
        },
      },
      line: { type: 'string', description: 'チリボのひとこと。30文字以内' },
    },
    required: ['tasks', 'line'],
  },
};

const json = (body: AnalyzeResponse, status = 200) => Response.json(body, { status });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let req: AnalyzeRequest;
  try {
    req = await request.json();
  } catch {
    return json({ error: 'ai_failed' }, 400);
  }
  if (typeof req.image !== 'string' || !req.image) return json({ error: 'ai_failed' }, 400);
  // base64 は4文字で3バイト
  if (req.image.length * 0.75 > MAX_IMAGE_BYTES) return json({ error: 'too_large' }, 413);

  const count = Math.min(MAX_TASKS, Math.max(1, Math.round(Number(req.count) || 3)));
  const voice = req.voice === 'げんき' ? 'げんき' : 'ふんわり';

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 0 });
  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: req.image } },
            { type: 'text', text: `タスクを${count}個ください。口調は「${voice}」。` },
          ],
        },
      ],
    });
    const block = res.content.find(b => b.type === 'tool_use');
    if (!block) return json({ error: 'ai_failed' }, 502);
    const input = block.input as { tasks?: unknown; line?: unknown };
    if (!Array.isArray(input.tasks)) return json({ error: 'ai_failed' }, 502);
    // 形の最終チェックは端末側でやる
    return json({ tasks: input.tasks, line: typeof input.line === 'string' ? input.line : '' });
  } catch (err) {
    // 画像を含むリクエストは出さず、ステータスだけ残す
    if (err instanceof Anthropic.APIError) console.error('anthropic error', err.status);
    else console.error('analyze failed');
    return json({ error: 'ai_failed' }, 502);
  }
};
