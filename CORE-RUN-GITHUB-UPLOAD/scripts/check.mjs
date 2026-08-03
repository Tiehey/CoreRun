import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const requiredFiles = [
  "dist/index.html",
  "dist/styles.css",
  "dist/script.js",
  "dist/site-config.js",
  "dist/_headers",
  "dist/app-screens/action.png",
  "dist/app-screens/effort-score.png",
  "dist/app-screens/training-plan.png",
];

await Promise.all(requiredFiles.map((file) => access(resolve(file))));

const [html, css, script, screenshots] = await Promise.all([
  readFile(resolve("dist/index.html"), "utf8"),
  readFile(resolve("dist/styles.css"), "utf8"),
  readFile(resolve("dist/script.js"), "utf8"),
  readdir(resolve("dist/app-screens")),
]);

const expectations = [
  ["Hero-Text", html.includes("wie schwer dieser Lauf für dich war")],
  ["Persönliche Entwicklung", html.includes("wird mit jedem Lauf persönlicher")],
  ["Effort-Story", html.includes("data-effort-stage") && script.includes("updateEffortStage")],
  ["Trainingsplan-Story", html.includes("data-plan-stage") && script.includes("updatePlanStage")],
  ["Sticky-kompatibles Overflow", css.includes("body { margin: 0; overflow-x: clip")],
  ["Mobile Animation", css.includes("mobile-in-view")],
  ["App-Screens", screenshots.length >= 7],
];

const forbidden = ["wie stark dieser Lauf", "validen Lauf"];
const failures = expectations.filter(([, ok]) => !ok).map(([name]) => name);
forbidden.forEach((text) => {
  if (html.includes(text)) failures.push(`Veralteter Text: ${text}`);
});

if (failures.length) {
  throw new Error(`Core Run Check fehlgeschlagen:\n- ${failures.join("\n- ")}`);
}

console.log(`Core Run Check erfolgreich: ${requiredFiles.length} Pflichtdateien, ${screenshots.length} App-Screens, beide Scroll-Stories vorhanden.`);
