import Anthropic from '@anthropic-ai/sdk';
import { MAX_IMAGE_BYTES, type RawReview, type ReviewRequest, type ReviewResponse } from '../../shared/types';

// ビフォー/アフターの2枚を Claude に見せて、ほめポイントと次の1分アドバイスをもらう中継。
// 画像も本文もログやストレージに残さない（console.log 禁止）

interface Env {
  ANTHROPIC_API_KEY: string;
}

const SYSTEM = `あなたは片づけを手伝うロボ「チリボ」です。相手は片づけが苦手な人で、決して責めません。
1枚目が片づけ前、2枚目が片づけ後の同じ部屋の写真です。report_review ツールで見くらべた結果を返してください。

- 写真を3×3のマスに分け、マス番号は 0=左上 1=上 2=右上 3=左 4=まんなか 5=右 6=左下 7=下 8=右下
- praise は写真で実際に変わった具体的な場所と物をほめる。2つ
- advice は片づけ後の写真でまだ物が多いマスについて、1分でできる具体的な行動を1つずつ。2つ
- ひらがな多め。否定・命令・説教はしない
- 点数・％・何点のような数字での評価はしない。ほめるだけ
- 人物・書類の中身・画面の文字には触れない
- 口調は「ふんわり」ならやさしく、「げんき」なら明るく`;

const CELL = { type: 'integer', minimum: 0, maximum: 8 } as const;

const TOOL: Anthropic.Tool = {
  name: 'report_review',
  description: '片づけ前後の写真を見くらべた結果を返す',
  input_schema: {
    type: 'object',
    properties: {
      head: { type: 'string', description: 'ほめる見出し。20文字以内' },
      summary: { type: 'string', description: 'チリボのひとこと。50文字以内' },
      praise: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'object',
          properties: { cell: CELL, text: { type: 'string', description: '45文字以内' } },
          required: ['cell', 'text'],
        },
      },
      advice: {
        type: 'array',
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'object',
          properties: {
            cell: CELL,
            text: { type: 'string', description: '1分でできる行動。30文字以内' },
            why: { type: 'string', description: '理由。12文字以内' },
          },
          required: ['cell', 'text', 'why'],
        },
      },
    },
    required: ['head', 'summary', 'praise', 'advice'],
  },
};

const json = (body: ReviewResponse, status = 200) => Response.json(body, { status });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let req: ReviewRequest;
  try {
    req = await request.json();
  } catch {
    return json({ error: 'ai_failed' }, 400);
  }
  if (typeof req.before !== 'string' || !req.before || typeof req.after !== 'string' || !req.after) {
    return json({ error: 'ai_failed' }, 400);
  }
  // base64 は4文字で3バイト
  if (req.before.length * 0.75 > MAX_IMAGE_BYTES || req.after.length * 0.75 > MAX_IMAGE_BYTES) {
    return json({ error: 'too_large' }, 413);
  }

  const voice = req.voice === 'げんき' ? 'げんき' : 'ふんわり';
  const done = Array.isArray(req.done) ? req.done.filter(t => typeof t === 'string').slice(0, 10).map(t => t.slice(0, 40)) : [];

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 20_000, maxRetries: 0 });
  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: req.before } },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: req.after } },
            { type: 'text', text: `今日やったこと: ${done.join('、') || 'なし'}。口調は「${voice}」。` },
          ],
        },
      ],
    });
    const block = res.content.find(b => b.type === 'tool_use');
    if (!block) return json({ error: 'ai_failed' }, 502);
    const input = block.input as { head?: unknown; summary?: unknown; praise?: unknown; advice?: unknown };
    if (!Array.isArray(input.praise) || !Array.isArray(input.advice)) return json({ error: 'ai_failed' }, 502);
    // 形の最終チェックは端末側でやる
    return json({
      head: typeof input.head === 'string' ? input.head : '',
      summary: typeof input.summary === 'string' ? input.summary : '',
      praise: input.praise as RawReview['praise'],
      advice: input.advice as RawReview['advice'],
    });
  } catch (err) {
    // 画像を含むリクエストは出さず、ステータスだけ残す
    if (err instanceof Anthropic.APIError) console.error('anthropic error', err.status);
    else console.error('review failed');
    return json({ error: 'ai_failed' }, 502);
  }
};
