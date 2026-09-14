import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const requiredFiles = [
  "dist/index.html",
  "dist/styles.css",
  "dist/script.js",
  "dist/site-config.js",
  "dist/_headers",
  "dist/app-screens/action.png",
  "dist/app-screens/goal.png",
  "dist/app-screens/effort-score.png",
  "dist/app-screens/run-analysis.png",
  "dist/app-screens/training-plan.png",
  "dist/app-screens/data-vault-development.png",
  "dist/app-screens/data-vault.png",
];

await Promise.all(requiredFiles.map((file) => access(resolve(file))));

const [html, css, script, screenshots] = await Promise.all([
  readFile(resolve("dist/index.html"), "utf8"),
  readFile(resolve("dist/styles.css"), "utf8"),
  readFile(resolve("dist/script.js"), "utf8"),
  readdir(resolve("dist/app-screens")),
]);

const expectations = [
  ["Minimaler Hero-Text", html.includes("DEIN LAUF. DEIN EFFORT. DEIN NÄCHSTER SCHRITT.")],
  ["Persönliche Entwicklung", html.includes("JEDER LAUF MACHT") && html.includes("DEINEN SCORE PERSÖNLICHER")],
  ["Effort-Story", html.includes("data-effort-stage") && script.includes("updateEffortStage")],
  ["Effort-Empfehlung", html.includes("data-effort-recommendation") && html.includes("KONTROLLIERT STARTEN")],
  ["Effort-Analyse-Übergang", html.includes("data-effort-analysis") && html.includes("JETZT DEN GANZEN RUN VERSTEHEN")],
  ["Effort 73", html.includes("Effort Score 73") && script.includes("73 * scoreEntry")],
  ["Trainingsplan-Story", html.includes("data-plan-stage") && script.includes("updatePlanStage")],
  ["Sichtbare Planreaktion", html.includes("data-plan-response") && script.includes("planResponses")],
  ["Sticky-kompatibles Overflow", css.includes("body { margin: 0; overflow-x: clip")],
  ["Kontinuierliche Animation", script.includes("segmentBlend") && css.includes("--card-opacity") && css.includes("--node-opacity")],
  ["Mobile Sticky-Stories", css.includes("620svh")],
  ["Effort-Text", html.includes("Leistungs- und Umweltdaten") && html.includes("0 bis 100")],
  ["Live-Run-Text", html.includes("Voll anpassbares Layout")],
  ["Neue App-Screens", screenshots.length >= 9],
];

const storyOrder = [
  'data-track-section="effort_explainer"',
  'data-track-section="run_analysis"',
  'data-track-section="data_vault"',
  'data-track-section="run_system"',
  'data-track-section="training_plan_intro"',
].map((marker) => html.indexOf(marker));
expectations.push(["Logische Website-Dramaturgie", storyOrder.every((value, index) => value >= 0 && (index === 0 || value > storyOrder[index - 1]))]);

const forbidden = ["wie stark dieser Lauf", "validen Lauf", "SO FUNKTIONIERT DEIN EFFORT SCORE", "BASIS-SICHERHEIT"];
const failures = expectations.filter(([, ok]) => !ok).map(([name]) => name);
forbidden.forEach((text) => {
  if (html.includes(text)) failures.push(`Veralteter Text: ${text}`);
});

if (failures.length) {
  throw new Error(`Core Run Check fehlgeschlagen:\n- ${failures.join("\n- ")}`);
}

console.log(`Core Run Check erfolgreich: ${requiredFiles.length} Pflichtdateien, ${screenshots.length} App-Screens, beide Scroll-Stories vorhanden.`);
