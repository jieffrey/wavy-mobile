// Cek i18n mobile:
//   1. src/i18n/id.ts dan en.ts punya key yang sama (en bertipe Messages, jadi tsc juga menjaga ini),
//      tidak ada nilai kosong, placeholder {x} sama, dan en tidak sekadar salinan teks Indonesia.
//   2. Teks UI hardcode di .tsx: teks JSX di <Text>, dan atribut placeholder / accessibilityLabel / label / title.
//
//   node scripts/check-i18n.mjs            -> exit 1 bila ada masalah
//   node scripts/check-i18n.mjs --verbose  -> tampilkan semua temuan
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const verbose = process.argv.includes("--verbose");

// muat modul TS kamus tanpa bundler: transpile ke .mjs sementara lalu import
async function loadDict(name) {
  const src = fs.readFileSync(path.join(root, "src/i18n", `${name}.ts`), "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wavy-i18n-")), `${name}.mjs`);
  fs.writeFileSync(tmp, js.replace(/from ['"]\.\/(\w+)['"]/g, "from './$1.mjs'"));
  const mod = await import(pathToFileURL(tmp).href);
  return mod[name];
}

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const flat = { id: flatten(await loadDict("id")), en: flatten(await loadDict("en")) };
const problems = [];

for (const [a, b] of [["id", "en"], ["en", "id"]])
  for (const key of Object.keys(flat[a])) if (!(key in flat[b])) problems.push(`[key] "${key}" ada di ${a}.ts tapi tidak ada di ${b}.ts`);

const placeholders = (s) => [...new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(",");
const ID_WORDS = /\b(dan|yang|untuk|tidak|belum|dengan|kamu|dari|tiket|pesanan|konser|bayar|masuk|lihat|semua|hapus|simpan|batal|sudah|akan|bisa|harus|atau)\b/i;
for (const key of Object.keys(flat.id)) {
  if (!(key in flat.en)) continue;
  for (const l of ["id", "en"]) if (String(flat[l][key]).trim() === "") problems.push(`[kosong] ${l}.ts "${key}"`);
  if (placeholders(flat.id[key]) !== placeholders(flat.en[key]))
    problems.push(`[placeholder] "${key}": id {${placeholders(flat.id[key])}} vs en {${placeholders(flat.en[key])}}`);
  if (flat.en[key] === flat.id[key] && ID_WORDS.test(String(flat.id[key])))
    problems.push(`[belum diterjemahkan] en.ts "${key}" = "${String(flat.en[key]).slice(0, 60)}"`);
}

// ---------- pindai .tsx ----------
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".tsx")) files.push(p);
  }
})(path.join(root, "src"));

const TEXT_ATTRS = new Set(["placeholder", "accessibilityLabel", "accessibilityHint", "label", "title"]);
const ALLOWED = [/^(dd|mm|yyyy)$/, /^Wavy\b[\s.·]*$/, /^Midtrans$/, /^QRIS$/, /^WIB$/, /^Rp$/, /^[A-Z]{2}$/, /^#\d*$/, /^[\d\s.,:+\-×%/·]+$/];
const hasWords = (s) => /\p{L}{2,}/u.test(s);
const allowed = (s) => ALLOWED.some((r) => r.test(s.trim()));

for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const line = (n) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const ignored = (n) => /i18n-ignore/.test(lines[line(n) - 1] ?? "") || /i18n-ignore/.test(lines[line(n) - 2] ?? "");
  (function visit(n) {
    if (ts.isJsxText(n)) {
      const text = n.text.replace(/\s+/g, " ").trim();
      if (text && hasWords(text) && !allowed(text) && !ignored(n)) problems.push(`[hardcode] ${rel}:${line(n)} teks "${text.slice(0, 70)}"`);
    }
    if (ts.isJsxAttribute(n) && TEXT_ATTRS.has(n.name.getText()) && n.initializer) {
      let v = null;
      if (ts.isStringLiteral(n.initializer)) v = n.initializer.text;
      else if (ts.isJsxExpression(n.initializer) && n.initializer.expression && ts.isStringLiteral(n.initializer.expression)) v = n.initializer.expression.text;
      if (v && hasWords(v) && !allowed(v) && !ignored(n)) problems.push(`[hardcode] ${rel}:${line(n)} ${n.name.getText()}="${v.slice(0, 70)}"`);
    }
    // string literal yang langsung dirender: {cond ? "Aktif" : "Nonaktif"}
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && hasWords(n.text) && !allowed(n.text) && !ignored(n)) {
      let p = n.parent;
      while (p && (ts.isConditionalExpression(p) || ts.isParenthesizedExpression(p) || (ts.isBinaryExpression(p) && /^(\|\||\?\?|&&)$/.test(p.operatorToken.getText())))) p = p.parent;
      if (p && ts.isJsxExpression(p) && p.parent && (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent)))
        problems.push(`[hardcode] ${rel}:${line(n)} ekspresi "${n.text.slice(0, 70)}"`);
    }
    // Alert.alert("Judul", "Isi")
    if (ts.isCallExpression(n) && n.expression.getText() === "Alert.alert")
      for (const a of n.arguments.slice(0, 2))
        if (ts.isStringLiteral(a) && hasWords(a.text) && !ignored(n)) problems.push(`[hardcode] ${rel}:${line(n)} Alert "${a.text.slice(0, 70)}"`);
    ts.forEachChild(n, visit);
  })(sf);
}

const summary = `i18n mobile: ${Object.keys(flat.id).length} key id, ${Object.keys(flat.en).length} key en, ${files.length} file .tsx dipindai`;
if (problems.length === 0) {
  console.log(`${summary} — OK`);
  process.exit(0);
}
console.log(summary);
for (const p of verbose ? problems : problems.slice(0, 80)) console.log("  " + p);
if (!verbose && problems.length > 80) console.log(`  ... ${problems.length - 80} lagi (--verbose)`);
console.log(`\n${problems.length} masalah`);
process.exit(1);
