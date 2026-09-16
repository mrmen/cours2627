#!/usr/bin/env node
/*
 * Copie le contenu a publier depuis le vault Obsidian vers content/, avant
 * un `git add -A && git commit && git push`.
 *
 * Usage :
 *   node scripts/sync-from-vault.mjs /chemin/vers/le/vault [dossier]
 *
 * Par defaut, [dossier] = "cours" (le dossier du vault a publier tel quel).
 * Le script :
 *   1. copie tous les .md de <vault>/<dossier> vers content/<dossier>/
 *   2. repere les images ![[...]] referencees dans ces notes, les retrouve
 *      n'importe ou dans le vault (comme le ferait Obsidian), et les copie
 *      vers content/ en conservant leur chemin relatif au vault
 *   3. signale les images referencees mais introuvables dans le vault
 *
 * Ne touche a rien dans le vault (lecture seule) ni au reste de content/
 * (n'efface pas d'anciens fichiers - a faire a la main si besoin).
 */

import fs from "node:fs";
import path from "node:path";

const [, , vaultArg, folderArg] = process.argv;
if (!vaultArg) {
  console.error("Usage: node scripts/sync-from-vault.mjs /chemin/vers/le/vault [dossier=cours]");
  process.exit(1);
}
const vaultRoot = path.resolve(vaultArg);
const folder = folderArg || "cours";
const srcDir = path.join(vaultRoot, folder);
const contentRoot = path.resolve(new URL("../content", import.meta.url).pathname);

if (!fs.existsSync(srcDir)) {
  console.error(`Introuvable : ${srcDir}`);
  process.exit(1);
}

const IMAGE_RE = /!\[\[([^|\]]+)(\|\d+)?\]\]/g;
const IGNORE_DIRS = new Set([".git", ".obsidian", "node_modules", "_site"]);

// 1. index de tous les fichiers du vault (nom -> premier chemin relatif
//    trouve), pour resoudre les wikilinks comme le ferait Obsidian.
function walk(dir, base, index) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      walk(full, rel, index);
    } else if (!index.has(entry.name)) {
      index.set(entry.name, rel);
    }
  }
}
const fileIndex = new Map();
walk(vaultRoot, "", fileIndex);

// 2. copie les .md du dossier a publier + collecte les images referencees
fs.mkdirSync(path.join(contentRoot, folder), { recursive: true });
const referenced = new Set();
let mdCount = 0;

for (const name of fs.readdirSync(srcDir)) {
  if (!name.toLowerCase().endsWith(".md")) continue;
  const text = fs.readFileSync(path.join(srcDir, name), "utf-8");
  fs.writeFileSync(path.join(contentRoot, folder, name), text, "utf-8");
  mdCount += 1;
  let m;
  IMAGE_RE.lastIndex = 0;
  while ((m = IMAGE_RE.exec(text))) referenced.add(m[1].trim());
}

// 3. copie les images referencees, en conservant leur chemin relatif au vault
let copied = 0;
const missing = [];
for (const name of referenced) {
  const rel = fileIndex.get(name);
  if (!rel) {
    missing.push(name);
    continue;
  }
  const dest = path.join(contentRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(vaultRoot, rel), dest);
  copied += 1;
}

console.log(`OK : ${mdCount} note(s) copiee(s) vers content/${folder}/, ${copied} image(s) copiee(s).`);
if (missing.length) {
  console.log(`Images referencees mais introuvables dans le vault : ${missing.join(", ")}`);
}
console.log(`\nProchaine etape : git add -A && git commit -m "maj cours" && git push`);
