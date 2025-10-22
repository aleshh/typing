import { type AppConfig } from './config';
import { getCharStats, selectTopTrouble } from './store';

const letters = 'abcdefghijklmnopqrstuvwxyz';
const LETTERS = letters.toUpperCase();
const numbers = '0123456789';
// Emphasize TS-relevant punctuation and number-line symbols
const numberLine = "~`!@#$%^&*()_-+=";
const punctuations = `!@#$%^&*()-_=+[]{};:'\",.<>/?\\|?:~` + '`';

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Identifier and type name helpers
const lexemes = [
  'alpha','beta','gamma','delta','user','item','count','total','index','key','node','path','file','token','cache','map','list','opts','cfg','value','result','status','timer','hash','ptr','safe','unsafe','match','guard','either','left','right'
];
function camel(): string {
  const parts = 1 + Math.floor(Math.random()*2);
  let out = pick(lexemes);
  for (let i=1;i<parts;i++) {
    const w = pick(lexemes);
    out += w[0].toUpperCase() + w.slice(1);
  }
  return out.replace(/[^a-zA-Z]/g,'');
}
function pascal(): string { const c = camel(); return c[0].toUpperCase() + c.slice(1); }

const typeAtoms = ['number','string','boolean','unknown','void','never'];
function generic(): string {
  const T = pascal();
  const U = pascal();
  return `${T}, ${U}`;
}
function randNum(): string { return pick(['0','1','2','3','10','16','42','64','99','100','256','512','1024']); }

// Build a small set of TS-looking templates
type Template = () => string;

const templates: Template[] = [
  // import/export
  () => `import { ${camel()}, ${camel()} as ${camel()} } from 'node:path';`,
  () => `export type ${pascal()}<${generic()}> = { id?: number; value: ${pick(typeAtoms)} | null } & Partial<Record<string, ${pick(typeAtoms)}>>;`,
  () => `export const ${camel()} = (...xs: number[]): number => xs.reduce((a,b)=>a+b, ${randNum()});`,

  // function + generics + default params
  () => `function ${camel()}<T extends { id: number } = { id: number }>(arr: T[], n: number = ${randNum()}): T[] { return arr.slice(0, n ?? 0); }`,

  // object + optional chaining + nullish coalescing
  () => `const ${camel()} = { a: ${randNum()}, b: '${camel()}', c: [${randNum()}, ${randNum()}] } as const; ${camel()}?.c?.[0] ?? ${randNum()};`,

  // interface with function types
  () => `interface ${pascal()}<T = ${pick(typeAtoms)}> { id?: string; onChange?: (x: T) => void; data: T | null }`,

  // class with private field and ctor
  () => `class ${pascal()}<T> { #id: number; constructor(public value: T){ this.#id = ${randNum()} } get id(): number { return this.#id } }`,

  // map/filter chain with arrow functions
  () => `const ${camel()} = [${randNum()},${randNum()},${randNum()}].map(x=>x*${randNum()}).filter(x=>x%${randNum()}===0);`,

  // union/intersection types
  () => `type ${pascal()} = { ok: true; value: unknown } | { ok: false; error: Error } & { code?: number };`,

  // generics + promises
  () => `async function ${camel()}<T>(x: Promise<T>): Promise<T> { return await x; }`,

  // destructuring + defaults + rest/spread
  () => `const { ${camel()}, ${camel()}: ${camel()}, ...rest } = { a:1, b:2, c:3 }; const arr = [...Object.values(rest)];`,

  // template literals
  () => `const ${camel()} = \`${camel()}-${randNum()}-${camel()}\`;`,

  // number-line heavy ops and patterns
  () => `let ${camel()} = ${randNum()}; ${camel()} += ${randNum()}; ${camel()} -= ${randNum()};`,
  () => `const ${camel()} = (${camel()}: number, ${camel()}: number) => (~${camel()} & ${randNum()}) ^ (${camel()} | ${randNum()});`,
  () => `@${pascal()}()\nclass ${pascal()} { ${camel()}!: string; }`,
  () => `import * as ${camel()} from '@app/${camel()}';`,
  () => `const ${camel()} = (x: number = ${randNum()}) => x * (${randNum()} + ${randNum()}) % (${randNum()} || 1);`,
  () => `const OPS = ['+=','-=','*=','/=','%=','**='];`,
  () => `const ${camel()} = (${camel()}: number) => (${randNum()} + ${randNum()}) * (${camel()} ?? ${randNum()}) >= ${randNum()};`,
];

function buildBaseWeights(cfg: AppConfig) {
  const base: Record<string, number> = {};
  const pushChars = (s: string, w: number) => { for (const ch of s) base[ch] = (base[ch] || 0) + w; };
  pushChars(letters + LETTERS, cfg.weights.letters / (letters.length * 2));
  pushChars(numbers, cfg.weights.numbers / numbers.length);
  // Give extra emphasis to number-line characters (tunable)
  pushChars(punctuations, cfg.weights.punctuation / punctuations.length);
  const boost = Math.max(1, (cfg.numberLineEmphasis ?? 4));
  pushChars(numberLine, (cfg.weights.punctuation * boost) / numberLine.length);
  if (cfg.emphasizeTrouble) {
    const stats = getCharStats();
    const worst = selectTopTrouble(stats, 5, 12);
    for (const w of worst) {
      const bump = Math.min(3, 1 + w.errorRate * 4);
      base[w.char] = (base[w.char] || 0.0001) * bump;
    }
  }
  return base;
}

function templateScore(t: string, weights: Record<string, number>) {
  // Score by summed weights of unique non‑alphanumeric chars (emphasize punctuation & digits)
  const seen = new Set<string>();
  let score = 0;
  for (const ch of t) {
    if (/[A-Za-z]/.test(ch)) continue;
    if (seen.has(ch)) continue;
    seen.add(ch);
    let w = weights[ch] || 0;
    if (numberLine.includes(ch)) w *= 1.8; // bonus for number-line chars
    score += w;
  }
  // Ensure every template has a minimum chance
  return score + 0.0001;
}

export function generateSnippet(cfg: AppConfig): string {
  const weights = buildBaseWeights(cfg);
  const boost = Math.max(1, (cfg.numberLineEmphasis ?? 4));
  const nlChars = Array.from(numberLine);

  function randNL(min = 2, max = 4) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    let s = '';
    for (let i = 0; i < n; i++) s += pick(nlChars);
    return s;
  }

  function injectIntoString(l: string): string | null {
    const quoteChars = [`'`, '"', '`'];
    for (let i = 0; i < l.length; i++) {
      const q = l[i];
      if (!quoteChars.includes(q)) continue;
      // find end quote, skipping escaped quotes (simple heuristic)
      for (let j = i + 1; j < l.length; j++) {
        if (l[j] === '\\') { j++; continue; }
        if (l[j] === q) {
          const before = l.slice(0, i + 1);
          const content = l.slice(i + 1, j);
          const after = l.slice(j);
          const pos = Math.min(content.length, Math.max(0, Math.floor(Math.random() * (content.length + 1))));
          const injected = content.slice(0, pos) + randNL(1, 3) + content.slice(pos);
          return before + injected + after;
        }
      }
    }
    return null;
  }

  function sprinkleNumberLine(l: string): string {
    // Much more aggressive sprinkling when emphasis is high.
    // 1) Try injecting into strings
    const pInject = Math.min(0.9, 0.10 * boost);
    if (Math.random() < pInject) {
      const injected = injectIntoString(l);
      if (injected) l = injected;
    }

    // 2) Add number-line chars at word boundaries (before/after identifiers)
    const pPre = Math.min(0.6, 0.08 * boost);
    const pPost = Math.min(0.6, 0.08 * boost);
    l = l.replace(/([A-Za-z_][A-Za-z0-9_]*)/g, (m) => {
      const pre = Math.random() < pPre ? pick(nlChars) : '';
      const post = Math.random() < pPost ? pick(nlChars) : '';
      return pre + m + post;
    });

    // 3) Occasionally sprinkle at line edges
    const pEdge = Math.min(0.4, 0.05 * boost);
    if (Math.random() < pEdge) l = pick(nlChars) + l;
    if (Math.random() < pEdge) l = l + pick(nlChars);

    // 4) If none of the above happened and we still want more, append a light comment train
    const pComment = Math.min(0.6, 0.12 * boost);
    if (Math.random() < pComment) {
      l = l + ` // ` + randNL(2, 5);
    }
    return l;
  }
  const lines: string[] = [];
  while (lines.join('\n').length < cfg.sprintLength) {
    // Weighted pick among templates by punctuation presence
    const entries = templates.map(fn => {
      const s = fn();
      return { s, w: templateScore(s, weights) };
    });
    const total = entries.reduce((a, e) => a + e.w, 0);
    let r = Math.random() * total;
    let chosen = entries[0].s;
    for (const e of entries) { if ((r -= e.w) <= 0) { chosen = e.s; break; } }
    // Randomly end lines with semicolons where reasonable
    if (!/[;}]$/.test(chosen) && Math.random() < 0.6) chosen += ';';
    // Distribute number-row characters across many lines
    chosen = sprinkleNumberLine(chosen);
    lines.push(chosen);
    // Insert at most a single blank line to mimic paragraph breaks
    const rbreak = Math.random();
    if (rbreak < 0.35 && lines[lines.length - 1] !== '' ) {
      lines.push('');
    }
  }
  // Post-process: enforce single blank lines and wrap lines to 10..70 chars
  const isBreak = (ch: string) => /[\s,;:)}\]]/.test(ch);
  function wrapBounds(s: string, min = 10, max = 70): string[] {
    const segs: string[] = [];
    let rest = s;
    while (rest.length > max) {
      const limit = Math.min(max, rest.length - min);
      let cut = -1;
      for (let i = limit; i >= min; i--) {
        if (isBreak(rest[i]) || isBreak(rest[i - 1])) { cut = i; break; }
      }
      if (cut === -1) cut = limit; // hard cut
      segs.push(rest.slice(0, cut).trimEnd());
      rest = rest.slice(cut).trimStart();
    }
    if (rest.length) segs.push(rest);
    // If the last segment ended up very short (< min) and there is a previous segment that can absorb it, merge
    if (segs.length >= 2) {
      const last = segs[segs.length - 1];
      const prev = segs[segs.length - 2];
      if (last.length < min && prev.length + 1 + last.length <= max) {
        segs[segs.length - 2] = prev + ' ' + last;
        segs.pop();
      }
    }
    return segs;
  }

  const normalized: string[] = [];
  for (const ln of lines) {
    if (ln.trim() === '') {
      if (normalized[normalized.length - 1] !== '') normalized.push('');
      continue;
    }
    const segs = wrapBounds(ln, 10, 70);
    for (const s of segs) normalized.push(s);
  }
  let out = normalized.join('\n');
  if (out.length > cfg.sprintLength) out = out.slice(0, cfg.sprintLength);
  return out;
}
