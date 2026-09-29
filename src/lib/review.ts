import type { RawReview, ReviewResponse, Voice } from '../../shared/types';
import { toBase64 } from './image';

// チリボのしんだん。写真を3×3のマスに分け、マスごとの「ごちゃっと感」（輪郭の多さ）を
// ビフォーとアフターでくらべる。ピンの位置は端末で決め、文章だけ AI に書いてもらう。
// 点数はつけない（ほめるだけ）

export type Review = RawReview & {
  source: 'ai' | 'local';
};

export const CELL_NAMES = ['左上', '上のほう', '右上', '左のほう', 'まんなか', '右のほう', '左下', '手前', '右下'];

// マスの中心。写真全体に対する 0〜1
export const cellCenter = (cell: number) => ({ x: ((cell % 3) + 0.5) / 3, y: (Math.floor(cell / 3) + 0.5) / 3 });

const TIPS = [
  '上の段の物を1つだけ、元の場所にもどす', 'ベッドや棚の上の物を1つだけしまう', '上の段の物を1つだけ、元の場所にもどす',
  '床の物を3つだけ、1か所にあつめる', '机の上の物を1つだけ引き出しへ', '床の物を3つだけ、1か所にあつめる',
  '床に落ちてる物を2つだけ拾う', '足元の物を2つだけ拾う', '床に落ちてる物を2つだけ拾う',
];

// マスごとの輪郭の強さの平均。縦横比は気にせず 60×80 に縮めて、写真全体を3等分する
async function clutterGrid(photo: Blob): Promise<number[]> {
  const W = 60, H = 80;
  const bmp = await createImageBitmap(photo);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, W, H);
  bmp.close();
  const d = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
  const sum = Array<number>(9).fill(0), cnt = Array<number>(9).fill(0);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx = g[y * W + x + 1] - g[y * W + x - 1];
      const gy = g[(y + 1) * W + x] - g[(y - 1) * W + x];
      const cell = Math.min(2, Math.floor((y / H) * 3)) * 3 + Math.min(2, Math.floor((x / W) * 3));
      sum[cell] += Math.hypot(gx, gy);
      cnt[cell]++;
    }
  }
  return sum.map((v, i) => v / cnt[i]);
}

// AI に送る用。長辺640pxまで縮める
async function small(photo: Blob): Promise<string> {
  const bmp = await createImageBitmap(photo);
  const r = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * r);
  cv.height = Math.round(bmp.height * r);
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
  bmp.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    cv.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.7),
  );
  return toBase64(blob);
}

function localReview(b: number[], a: number[], done: string[], todo: string[], voice: Voice): Review {
  const g = voice === 'げんき';
  const idx = [...Array(9).keys()];
  const imp = idx.map(i => (b[i] - a[i]) / (b[i] || 1));
  const praiseCells = [...idx].sort((p, q) => imp[q] - imp[p]).slice(0, 2);
  const advCells = idx.filter(i => !praiseCells.includes(i)).sort((p, q) => a[q] - a[p]).slice(0, 2);
  const praise = praiseCells.map((cell, i) => {
    const t = done[i];
    return {
      cell,
      text: t
        ? `${CELL_NAMES[cell]}、「${t}」がちゃんと写真でもわかるよ！`
        : `${CELL_NAMES[cell]}のあたり、すっきりしたね。見える床がふえたよ`,
    };
  });
  const advice = advCells.map((cell, i) => ({
    cell,
    text: i === 1 && todo[0] ? todo[0] : TIPS[cell],
    why: `${CELL_NAMES[cell]}がまだにぎやか`,
  }));
  const head = g ? 'ちゃんと変わってる！えらい！' : 'ちゃんとキレイになってるよ';
  const summary = g
    ? `${done.length}個もやったの、すごすぎ！つぎは${CELL_NAMES[advCells[0]]}をやっつけよ〜！`
    : `${done.length}個できたの、ほんとにえらいよ。${CELL_NAMES[advCells[0]]}は、また気が向いたときでいいからね。`;
  return { head, summary, praise, advice, source: 'local' };
}

const okText = (t: unknown, max: number): t is string => typeof t === 'string' && t.trim() !== '' && [...t.trim()].length <= max;
const okCell = (c: unknown): c is number => Number.isInteger(c) && (c as number) >= 0 && (c as number) <= 8;

// AIの返事を信用せず、マス番号と文字数を確かめる。だめな部分は端末のしんだんを使う
function merge(local: Review, raw: RawReview): Review {
  const praise = (Array.isArray(raw.praise) ? raw.praise : [])
    .filter(p => okCell(p?.cell) && okText(p.text, 60))
    .slice(0, 2)
    .map(p => ({ cell: p.cell, text: p.text.trim() }));
  const advice = (Array.isArray(raw.advice) ? raw.advice : [])
    .filter(p => okCell(p?.cell) && okText(p.text, 30))
    .slice(0, 2)
    .map(p => ({ cell: p.cell, text: p.text.trim(), why: okText(p.why, 16) ? p.why.trim() : '' }));
  if (praise.length === 0 && advice.length === 0) return local;
  return {
    ...local,
    head: okText(raw.head, 30) ? raw.head.trim() : local.head,
    summary: okText(raw.summary, 70) ? raw.summary.trim() : local.summary,
    praise: praise.length ? praise : local.praise,
    advice: advice.length ? advice : local.advice,
    source: 'ai',
  };
}

export async function reviewPhotos(before: Blob, after: Blob, done: string[], todo: string[], voice: Voice): Promise<Review> {
  const [b, a] = await Promise.all([clutterGrid(before), clutterGrid(after)]);
  const local = localReview(b, a, done, todo, voice);
  if (!navigator.onLine) return local;
  try {
    const [bs, as] = await Promise.all([small(before), small(after)]);
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ before: bs, after: as, done, voice }),
      signal: AbortSignal.timeout(25_000),
    });
    const data = (await res.json()) as ReviewResponse;
    if ('error' in data) return local;
    return merge(local, data);
  } catch {
    return local;
  }
}
