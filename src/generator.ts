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
];

function buildBaseWeights(cfg: AppConfig) {
  const base: Record<string, number> = {};
  const pushChars = (s: string, w: number) => { for (const ch of s) base[ch] = (base[ch] || 0) + w; };
  pushChars(letters + LETTERS, cfg.weights.letters / (letters.length * 2));
  pushChars(numbers, cfg.weights.numbers / numbers.length);
  // Give extra emphasis to number-line characters
  pushChars(punctuations, cfg.weights.punctuation / punctuations.length);
  pushChars(numberLine, (cfg.weights.punctuation * 3) / numberLine.length);
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
    lines.push(chosen);
    // Insert single or double blank lines to mimic code spacing
    const rbreak = Math.random();
    if (rbreak < 0.4) lines.push('');
    if (rbreak < 0.2) lines.push(''); // double break sometimes
  }
  let out = lines.join('\n');
  if (out.length > cfg.sprintLength) out = out.slice(0, cfg.sprintLength);
  return out;
}
