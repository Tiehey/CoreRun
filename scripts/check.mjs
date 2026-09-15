import { access, readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const root = resolve("dist");
const pages = (await readdir(root)).filter(name => name.endsWith(".html"));
let assets = new Set();
for (const name of pages) {
  const html = await readFile(resolve(root, name), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  if (ids.length !== new Set(ids).size) throw new Error(name + ": duplicate HTML ids");
  for (const [,reference] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
    if (reference.startsWith("#")) {
      if (reference.length > 1 && !ids.includes(reference.slice(1))) throw new Error(name + ": missing anchor " + reference);
      continue;
    }
    const path = reference.split(/[?#]/)[0];
    if (!path) continue;
    const target = resolve(dirname(resolve(root, name)), path);
    await access(target);
    assets.add(target);
  }
}
for (const file of ["index.html", "styles.css", "journey.css", "script.js", "site-config.js", "_headers"]) await access(resolve(root,file));
console.log(`Build checked: ${pages.length} HTML pages, ${assets.size} linked local assets, unique ids and valid local anchors.`);
