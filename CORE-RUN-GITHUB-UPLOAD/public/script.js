const config = window.CORE_RUN_CONFIG || {};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktopStory = window.matchMedia("(min-width: 781px)");
const consentKey = "core_run_analytics_consent";
const analyticsAllowed = () => localStorage.getItem(consentKey) === "accepted";

const capture = (event, properties = {}) => {
  if (!analyticsAllowed() || !window.posthog?.capture) return;
  window.posthog.capture(event, properties);
};

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const header = document.querySelector("[data-header]");
const runStage = document.querySelector("[data-run-stage]");
const effortStage = document.querySelector("[data-effort-stage]");
const vaultTransition = document.querySelector("[data-vault-transition]");
const planStage = document.querySelector("[data-plan-stage]");
const calibrationStage = document.querySelector("[data-calibration-stage]");
const parallaxPhone = document.querySelector("[data-parallax-phone]");
let effortComplete = false;
let planComplete = false;
let scrollFrame = null;

document.documentElement.classList.add("motion-ready");

const stageProgress = (stage) => {
  if (!stage) return 0;
  const rect = stage.getBoundingClientRect();
  const distance = Math.max(stage.offsetHeight - window.innerHeight, 1);
  return Math.min(1, Math.max(0, -rect.top / distance));
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
};
const setMotionValue = (node, property, value) => node?.style.setProperty(property, value);

const updateRunStage = () => {
  if (!runStage) return;
  const progress = stageProgress(runStage);
  const copies = [...runStage.querySelectorAll("[data-run-copy]")];
  const boundaries = [0, 0.25, 0.5, 0.76, 1.01];
  const activeIndex = Math.min(Math.floor(progress * 4), 3);
  copies.forEach((copy, index) => {
    const entry = index === 0 ? 1 : smoothstep((progress - boundaries[index]) / 0.055);
    const exit = smoothstep((progress - (boundaries[index + 1] - 0.07)) / 0.055);
    const opacity = entry * (1 - exit);
    setMotionValue(copy, "--run-copy-opacity", opacity.toFixed(3));
    setMotionValue(copy, "--run-copy-y", `${(30 * (1 - entry) - 24 * exit).toFixed(1)}px`);
    copy.setAttribute("aria-hidden", opacity < 0.1 ? "true" : "false");
  });

  const home = runStage.querySelector(".run-phone-home");
  const goal = runStage.querySelector(".run-phone-goal");
  const live = runStage.querySelector(".run-phone-live");
  const choiceShift = smoothstep((progress - 0.17) / 0.13);
  const liveEntry = smoothstep((progress - 0.47) / 0.13);
  const runSaved = smoothstep((progress - 0.78) / 0.15);
  const modeVisibility = 1 - liveEntry;
  const mobile = !desktopStory.matches;

  setMotionValue(home, "--run-phone-opacity", modeVisibility.toFixed(3));
  setMotionValue(home, "--run-phone-x", `${((mobile ? -50 : -90) * choiceShift).toFixed(1)}px`);
  setMotionValue(home, "--run-phone-rotate", `${(-5 * choiceShift).toFixed(2)}deg`);
  setMotionValue(home, "--run-phone-scale", (1 - 0.08 * choiceShift).toFixed(3));

  const goalVisibility = smoothstep((progress - 0.18) / 0.09) * modeVisibility;
  setMotionValue(goal, "--run-phone-opacity", goalVisibility.toFixed(3));
  setMotionValue(goal, "--run-phone-x", `${((mobile ? 65 : 125) + 45 * (1 - choiceShift)).toFixed(1)}px`);
  setMotionValue(goal, "--run-phone-rotate", `${(7 - 3 * choiceShift).toFixed(2)}deg`);
  setMotionValue(goal, "--run-phone-scale", (0.84 + 0.08 * choiceShift).toFixed(3));

  setMotionValue(live, "--run-phone-opacity", liveEntry.toFixed(3));
  setMotionValue(live, "--run-phone-x", `${((mobile ? 55 : 105) * (1 - liveEntry)).toFixed(1)}px`);
  setMotionValue(live, "--run-phone-y", `${(-25 * runSaved).toFixed(1)}px`);
  setMotionValue(live, "--run-phone-rotate", `${(5 * (1 - liveEntry) - 2 * runSaved).toFixed(2)}deg`);
  setMotionValue(live, "--run-phone-scale", (0.88 + 0.12 * liveEntry - 0.03 * runSaved).toFixed(3));

  runStage.querySelectorAll(".run-stepper i").forEach((step, index) => step.classList.toggle("active", index <= activeIndex));
};

const updateVaultTransition = () => {
  if (!vaultTransition) return;
  const progress = stageProgress(vaultTransition);
  const merge = smoothstep((progress - 0.5) / 0.22);
  const cardsExit = smoothstep((progress - 0.72) / 0.11);
  const cardPositions = [
    { x: 55, y: -145, rotate: -4 },
    { x: -25, y: 0, rotate: 2 },
    { x: 35, y: 145, rotate: -1 },
  ];
  vaultTransition.querySelectorAll("[data-vault-run]").forEach((card, index) => {
    const entry = smoothstep((progress - (0.03 + index * 0.13)) / 0.085);
    const position = cardPositions[index];
    const stackOffset = (index - 1) * 7;
    const x = position.x * (1 - merge) + stackOffset * merge;
    const y = position.y * (1 - merge) + stackOffset * merge;
    const rotation = position.rotate * (1 - merge);
    const opacity = entry * (1 - cardsExit);
    setMotionValue(card, "--vault-card-opacity", opacity.toFixed(3));
    setMotionValue(card, "--vault-card-x", `${x.toFixed(1)}px`);
    setMotionValue(card, "--vault-card-y", `${y.toFixed(1)}px`);
    setMotionValue(card, "--vault-card-rotate", `${rotation.toFixed(2)}deg`);
    setMotionValue(card, "--vault-card-scale", (0.92 - 0.16 * merge).toFixed(3));
  });

  const labelEntry = smoothstep((progress - 0.56) / 0.12);
  const phoneEntry = smoothstep((progress - 0.71) / 0.16);
  const label = vaultTransition.querySelector("[data-vault-label]");
  const phone = vaultTransition.querySelector("[data-vault-phone]");
  setMotionValue(label, "--vault-label-opacity", (labelEntry * (1 - phoneEntry)).toFixed(3));
  setMotionValue(label, "--vault-label-scale", (0.8 + 0.2 * labelEntry).toFixed(3));
  setMotionValue(phone, "--vault-phone-opacity", phoneEntry.toFixed(3));
  setMotionValue(phone, "--vault-phone-y", `${(50 * (1 - phoneEntry)).toFixed(1)}px`);
  setMotionValue(phone, "--vault-phone-scale", (0.78 + 0.22 * phoneEntry).toFixed(3));
};

const updateEffortStageLegacy = () => {
  if (!effortStage) return;
  const progress = stageProgress(effortStage);
  effortStage.style.setProperty("--effort-progress", progress.toFixed(3));

  const indicator = effortStage.querySelector("[data-effort-progress]");
  if (indicator) indicator.style.height = `${Math.round(progress * 100)}%`;

  const scoreEntry = smoothstep((progress - 0.015) / 0.51);
  const score = Math.round(72 * scoreEntry);
  const scoreNumber = effortStage.querySelector("[data-effort-number]");
  const scoreLabel = effortStage.querySelector(".score-inner span");
  const scoreRing = effortStage.querySelector(".score-ring-scroll");
  const scoreCenter = effortStage.querySelector(".effort-center");
  const stageHead = effortStage.querySelector(".effort-stage-head");
  const recommendation = effortStage.querySelector("[data-effort-recommendation]");
  const analysisPreview = effortStage.querySelector("[data-effort-analysis]");
  const recommendationEntry = smoothstep((progress - 0.56) / 0.08);
  const recommendationExit = smoothstep((progress - 0.73) / 0.07);
  const recommendationVisibility = recommendationEntry * (1 - recommendationExit);
  const analysisEntry = smoothstep((progress - 0.76) / 0.08);
  const scoreShift = smoothstep((progress - 0.53) / 0.12);
  const isMobile = !desktopStory.matches;
  if (scoreNumber) scoreNumber.textContent = String(score);
  if (scoreLabel) scoreLabel.textContent = progress >= 0.52 ? "FORDERND" : "WIRD BERECHNET";
  setMotionValue(scoreRing, "--score-arc", (55.48 * scoreEntry).toFixed(2));
  setMotionValue(scoreCenter, "--score-opacity", ((0.34 + 0.66 * scoreEntry) * (1 - 0.96 * analysisEntry)).toFixed(3));
  setMotionValue(scoreCenter, "--score-scale", (0.84 + 0.16 * scoreEntry - 0.08 * scoreShift - 0.12 * analysisEntry).toFixed(3));
  setMotionValue(scoreCenter, "--score-x", `${isMobile ? 0 : (-Math.min(window.innerWidth * 0.17, 220) * scoreShift).toFixed(1)}px`);
  setMotionValue(scoreCenter, "--score-y", `${isMobile ? (-82 * scoreShift - 70 * analysisEntry).toFixed(1) : 0}px`);
  setMotionValue(stageHead, "--effort-head-opacity", (1 - smoothstep((progress - 0.025) / 0.09)).toFixed(3));
  setMotionValue(recommendation, "--recommendation-opacity", recommendationVisibility.toFixed(3));
  setMotionValue(recommendation, "--recommendation-x", `${(90 * (1 - recommendationEntry) - 85 * recommendationExit).toFixed(1)}px`);
  setMotionValue(recommendation, "--recommendation-y", `${(42 * (1 - recommendationEntry) - (isMobile ? 95 : 0) * recommendationExit).toFixed(1)}px`);
  setMotionValue(recommendation, "--recommendation-scale", (0.94 + 0.06 * recommendationEntry).toFixed(3));
  recommendation?.setAttribute("aria-hidden", recommendationVisibility < 0.12 ? "true" : "false");
  setMotionValue(analysisPreview, "--analysis-opacity", analysisEntry.toFixed(3));
  setMotionValue(analysisPreview, "--analysis-x", `${isMobile ? 0 : (120 * (1 - analysisEntry)).toFixed(1)}px`);
  setMotionValue(analysisPreview, "--analysis-y", `${(42 * (1 - analysisEntry)).toFixed(1)}px`);
  setMotionValue(analysisPreview, "--analysis-scale", (0.92 + 0.08 * analysisEntry).toFixed(3));
  analysisPreview?.setAttribute("aria-hidden", analysisEntry < 0.12 ? "true" : "false");

  const nodes = [...effortStage.querySelectorAll("[data-effort-node]")];
  const factorStart = 0.04;
  const factorEnd = 0.49;
  const factorProgress = clamp((progress - factorStart) / (factorEnd - factorStart));
  const timeline = factorProgress * Math.max(nodes.length - 1, 0);
  const factorEntry = smoothstep((progress - factorStart) / 0.04);
  const factorExit = smoothstep((progress - 0.49) / 0.085);
  const segment = Math.min(Math.floor(timeline), Math.max(nodes.length - 1, 0));
  const segmentFraction = timeline - segment;
  const segmentBlend = segment >= nodes.length - 1 ? 0 : smoothstep((segmentFraction - 0.28) / 0.44);
  const factorIndex = isMobile
    ? Math.min(segment + (segmentBlend >= 0.5 ? 1 : 0), Math.max(nodes.length - 1, 0))
    : clamp(Math.round(timeline), 0, Math.max(nodes.length - 1, 0));
  const activeIndex = progress >= 0.76 ? nodes.length + 1 : progress >= 0.56 ? nodes.length : factorIndex;

  nodes.forEach((node, index) => {
    const factorPosition = factorStart + (factorEnd - factorStart) * (index / Math.max(nodes.length - 1, 1));
    const revealAt = factorPosition - (index === 0 ? 0.02 : 0.07);
    const reveal = smoothstep((progress - revealAt) / 0.085);
    const distance = Math.abs(index - timeline);
    const focus = clamp(1 - distance);
    const x = Number(node.dataset.x || 0) * (1 - reveal) + Number(node.dataset.cx || 0) * factorExit;
    const y = Number(node.dataset.y || 0) * (1 - reveal) + Number(node.dataset.cy || 0) * factorExit;
    let opacity = reveal * (0.44 + focus * 0.56) * (1 - factorExit);
    let mobileX = 0;
    if (isMobile) {
      if (index === segment) {
        opacity = factorEntry * Math.pow(1 - segmentBlend, 1.7) * (1 - factorExit);
        mobileX = -segmentBlend * 220;
      } else if (index === segment + 1) {
        opacity = factorEntry * Math.pow(segmentBlend, 1.7) * (1 - factorExit);
        mobileX = (1 - segmentBlend) * 220;
      } else {
        opacity = 0;
        mobileX = index < segment ? -220 : 220;
      }
    }
    const scale = isMobile ? 0.94 + opacity * 0.06 : 0.78 + focus * 0.24;

    setMotionValue(node, "--node-opacity", opacity.toFixed(3));
    setMotionValue(node, "--node-scale", scale.toFixed(3));
    setMotionValue(node, "--node-x", `${isMobile ? mobileX.toFixed(1) : x.toFixed(1)}px`);
    setMotionValue(node, "--node-y", `${isMobile ? (-130 * factorExit).toFixed(1) : y.toFixed(1)}px`);
    setMotionValue(node, "--node-border", (0.28 + focus * 0.72).toFixed(3));
    setMotionValue(node, "--node-saturation", (0.54 + focus * 0.46).toFixed(3));
    setMotionValue(node, "--node-shadow", (0.08 + focus * 0.3).toFixed(3));
    setMotionValue(node, "--line-opacity", (reveal * (0.18 + focus * 0.82)).toFixed(3));
    node.style.zIndex = index === factorIndex ? "5" : "4";
  });

  effortStage.querySelectorAll(".effort-step-dots i").forEach((dot, index) => {
    dot.classList.toggle("active", index === activeIndex && progress >= factorStart);
    dot.classList.toggle("past", index < activeIndex && progress >= factorStart);
  });
  setMotionValue(effortStage.querySelector(".effort-step-dots"), "--dots-opacity", (1 - analysisEntry).toFixed(3));

  if (progress >= 0.95 && !effortComplete) {
    effortComplete = true;
    capture("effort_explainer_completed");
  }
};

const updatePlanStageLegacy = () => {
  if (!planStage) return;
  const progress = stageProgress(planStage);
  planStage.style.setProperty("--plan-progress", progress.toFixed(3));
  const indicator = planStage.querySelector("[data-plan-progress]");
  if (indicator) indicator.style.height = `${Math.round(progress * 100)}%`;

  const cards = [...planStage.querySelectorAll("[data-plan-card]")];
  const timeline = progress * Math.max(cards.length - 1, 0);
  const isMobile = !desktopStory.matches;
  const segment = Math.min(Math.floor(timeline), Math.max(cards.length - 1, 0));
  const segmentFraction = timeline - segment;
  const segmentBlend = segment >= cards.length - 1 ? 0 : smoothstep((segmentFraction - 0.28) / 0.44);
  const currentIndex = Math.min(segment + (segmentBlend >= 0.5 ? 1 : 0), Math.max(cards.length - 1, 0));
  cards.forEach((card, index) => {
    const verticalTravel = isMobile ? 210 : 300;
    const horizontalTravel = isMobile ? 18 : 28;
    let opacity = 0;
    let x = index < segment ? -horizontalTravel : horizontalTravel;
    let y = index < segment ? -verticalTravel : verticalTravel;
    let rotation = index < segment ? -2 : 2;
    if (index === segment) {
      opacity = Math.pow(1 - segmentBlend, 1.2);
      x = -segmentBlend * horizontalTravel;
      y = -segmentBlend * verticalTravel;
      rotation = -segmentBlend * (isMobile ? 1.1 : 2.6);
    } else if (index === segment + 1) {
      opacity = Math.pow(segmentBlend, 1.2);
      x = (1 - segmentBlend) * horizontalTravel;
      y = (1 - segmentBlend) * verticalTravel;
      rotation = (1 - segmentBlend) * (isMobile ? 1.1 : 2.6);
    }
    const scale = 0.94 + opacity * 0.06;

    setMotionValue(card, "--card-opacity", opacity.toFixed(3));
    setMotionValue(card, "--card-x", `${x.toFixed(1)}px`);
    setMotionValue(card, "--card-y", `${y.toFixed(1)}px`);
    setMotionValue(card, "--card-rotate", `${rotation.toFixed(2)}deg`);
    setMotionValue(card, "--card-scale", scale.toFixed(3));
    card.style.zIndex = index === currentIndex ? "5" : "4";
    card.setAttribute("aria-hidden", opacity < 0.12 ? "true" : "false");
  });

  const counter = planStage.querySelector("[data-plan-counter]");
  if (counter) counter.textContent = currentIndex >= cards.length - 1 ? "READY" : `${String(currentIndex + 1).padStart(2, "0")} / 06`;

  const planResponses = [
    ["AUSGANGSLAGE ERKANNT", "Wochenumfang und typische Belastung setzen den sicheren Startpunkt.", 22],
    ["EINSTIEG ANGEPASST", "Distanz und Geschwindigkeit werden auf deinen aktuellen Stand kalibriert.", 35],
    ["RICHTUNG DEFINIERT", "Zieldistanz, Zielpace und Zeitraum geben dem Aufbau eine klare Richtung.", 49],
    ["BELASTUNG DOSIERT", "Die letzten Einheiten bestimmen, wie fordernd die nächste Woche sein darf.", 62],
    ["WOCHE REALISTISCH", "Trainingstage und Zeitbudget legen fest, was zuverlässig in deinen Alltag passt.", 76],
    ["FORTSCHRITT VERARBEITET", "Absolvierte und verpasste Einheiten verändern die nächsten Schritte.", 88],
    ["PLAN BEREIT", "Alle Signale greifen ineinander: persönlich, realistisch und aufeinander abgestimmt.", 100],
  ];
  const response = planStage.querySelector("[data-plan-response]");
  const responseTitle = planStage.querySelector("[data-plan-response-title]");
  const responseCopy = planStage.querySelector("[data-plan-response-copy]");
  const responseMeter = planStage.querySelector("[data-plan-response-meter]");
  const responseData = planResponses[currentIndex] || planResponses[0];
  if (response && response.dataset.activeIndex !== String(currentIndex)) {
    response.dataset.activeIndex = String(currentIndex);
    if (responseTitle) responseTitle.textContent = responseData[0];
    if (responseCopy) responseCopy.textContent = responseData[1];
    response.classList.remove("updating");
    requestAnimationFrame(() => {
      response.classList.add("updating");
      window.setTimeout(() => response.classList.remove("updating"), 180);
    });
  }
  setMotionValue(response, "--response-meter", `${responseData[2]}%`);
  if (responseMeter) responseMeter.style.width = `${responseData[2]}%`;
  planStage.querySelectorAll(".plan-signal i").forEach((signal, index) => {
    const localProgress = clamp(timeline - index + 0.4);
    signal.classList.toggle("active", localProgress > 0.02);
    setMotionValue(signal, "--signal-scale", (1 + 0.22 * clamp(1 - Math.abs(timeline - index))).toFixed(3));
    setMotionValue(signal, "--signal-opacity", (0.22 + 0.78 * localProgress).toFixed(3));
  });

  const phoneStage = planStage.querySelector(".plan-phone-stage");
  setMotionValue(phoneStage, "--phone-y", `${(-8 * progress + Math.sin(progress * Math.PI * 2) * 4).toFixed(1)}px`);
  setMotionValue(phoneStage, "--phone-rotate", `${(1.4 - progress * 2.8).toFixed(2)}deg`);

  if (progress >= 0.95 && !planComplete) {
    planComplete = true;
    capture("training_plan_explainer_completed");
  }
};

const updateEffortStage = () => {
  if (!effortStage) return;
  const progress = stageProgress(effortStage);
  const factors = [
    ["AKTUELLES FITNESSLEVEL", "Dein persönlicher Ausgangspunkt."],
    ["GESCHWINDIGKEIT", "Relativ zu deinem aktuellen Leistungsstand."],
    ["DISTANZ", "Wie weit die Belastung reicht."],
    ["DAUER", "Wie lange dein Körper arbeitet."],
    ["HÖHENPROFIL", "Steigung und Gefälle verändern die Belastung."],
    ["WETTER", "Temperatur, Luftfeuchtigkeit und Wind verändern die Bedingungen."],
  ];
  const factorStart = 0.035;
  const factorEnd = 0.5;
  const factorProgress = clamp((progress - factorStart) / (factorEnd - factorStart));
  const factorIndex = Math.min(Math.floor(factorProgress * factors.length), factors.length - 1);
  const factorEntry = smoothstep((progress - factorStart) / 0.045);
  const factorExit = smoothstep((progress - 0.49) / 0.075);
  const scoreEntry = smoothstep((progress - 0.49) / 0.12);
  const recommendationEntry = smoothstep((progress - 0.665) / 0.075);
  const analysisEntry = smoothstep((progress - 0.835) / 0.13);
  const resultVisibility = scoreEntry * (1 - analysisEntry);
  const factor = effortStage.querySelector("[data-effort-factor]");
  const formation = effortStage.querySelector("[data-effort-formation]");
  const formationRing = formation?.querySelector(".formation-ring");
  const factorNumber = effortStage.querySelector("[data-effort-factor-index]");
  const factorTitle = effortStage.querySelector("[data-effort-factor-title]");
  const factorCopy = effortStage.querySelector("[data-effort-factor-copy]");
  const scoreNumber = effortStage.querySelector("[data-effort-number]");
  const scoreLabel = effortStage.querySelector(".score-inner span");
  const scoreRing = effortStage.querySelector(".score-ring-scroll");
  const result = effortStage.querySelector("[data-effort-result]");
  const stageHead = effortStage.querySelector(".effort-stage-head");
  const recommendation = effortStage.querySelector("[data-effort-recommendation]");
  const analysisBridge = effortStage.querySelector("[data-effort-analysis]");
  const isMobile = !desktopStory.matches;

  if (factor && factor.dataset.activeIndex !== String(factorIndex)) {
    factor.dataset.activeIndex = String(factorIndex);
    if (factorNumber) factorNumber.textContent = `${String(factorIndex + 1).padStart(2, "0")} / 06`;
    if (factorTitle) factorTitle.textContent = factors[factorIndex][0];
    if (factorCopy) factorCopy.textContent = factors[factorIndex][1];
    factor.classList.remove("changing");
    requestAnimationFrame(() => factor.classList.add("changing"));
  }
  const score = Math.round(72 * scoreEntry);
  if (scoreNumber) scoreNumber.textContent = String(score);
  if (scoreLabel) scoreLabel.textContent = scoreEntry > 0.9 ? "FORDERND" : "WIRD BERECHNET";
  setMotionValue(formationRing, "--score-arc", (54 * factorProgress).toFixed(2));
  setMotionValue(scoreRing, "--score-arc", (54 * scoreEntry).toFixed(2));
  setMotionValue(stageHead, "--effort-head-opacity", (1 - smoothstep((progress - 0.025) / 0.075)).toFixed(3));
  setMotionValue(factor, "--factor-opacity", (factorEntry * (1 - factorExit)).toFixed(3));
  setMotionValue(factor, "--factor-y", `${(-28 * factorExit).toFixed(1)}px`);
  setMotionValue(formation, "--formation-opacity", (factorEntry * (1 - factorExit)).toFixed(3));
  setMotionValue(formation, "--formation-scale", (1 - 0.1 * factorExit).toFixed(3));
  setMotionValue(result, "--result-opacity", resultVisibility.toFixed(3));
  setMotionValue(result, "--result-scale", (0.72 + 0.28 * scoreEntry - 0.08 * analysisEntry).toFixed(3));
  setMotionValue(result, "--result-x", `${isMobile ? 0 : (190 * (1 - recommendationEntry)).toFixed(1)}px`);
  setMotionValue(recommendation, "--recommendation-opacity", (recommendationEntry * (1 - analysisEntry)).toFixed(3));
  setMotionValue(recommendation, "--recommendation-x", `${(50 * (1 - recommendationEntry)).toFixed(1)}px`);
  recommendation?.setAttribute("aria-hidden", recommendationEntry < 0.12 || analysisEntry > 0.88 ? "true" : "false");
  setMotionValue(analysisBridge, "--analysis-opacity", analysisEntry.toFixed(3));
  setMotionValue(analysisBridge, "--analysis-scale", (0.9 + 0.1 * analysisEntry).toFixed(3));
  setMotionValue(analysisBridge, "--analysis-phone-y", `${(110 * (1 - analysisEntry)).toFixed(1)}px`);
  setMotionValue(analysisBridge, "--analysis-phone-rotate", `${(5 * (1 - analysisEntry)).toFixed(2)}deg`);
  setMotionValue(analysisBridge, "--analysis-phone-scale", (0.78 + 0.22 * analysisEntry).toFixed(3));
  analysisBridge?.setAttribute("aria-hidden", analysisEntry < 0.12 ? "true" : "false");

  if (progress >= 0.95 && !effortComplete) {
    effortComplete = true;
    capture("effort_explainer_completed");
  }
};

const updatePlanStage = () => {
  if (!planStage) return;
  const progress = stageProgress(planStage);
  const steps = [...planStage.querySelectorAll("[data-plan-input]")];
  const start = 0.035;
  const end = 0.88;
  const sequence = clamp((progress - start) / (end - start));
  const activeIndex = Math.min(Math.floor(sequence * steps.length), steps.length - 1);
  const statuses = [
    "DEIN STARTPUNKT",
    "DEINE EIGENE HISTORIE",
    "DEINE RICHTUNG",
    "DEIN REALISTISCHER RHYTHMUS",
    "DEIN VERFÜGBARER RAHMEN",
    "DEIN NÄCHSTER SINNVOLLER SCHRITT",
  ];
  const counter = planStage.querySelector("[data-plan-counter]");
  const status = planStage.querySelector("[data-plan-status]");
  const progressBar = planStage.querySelector("[data-plan-progress]");
  const visual = planStage.querySelector("[data-plan-visual]");
  const finish = planStage.querySelector("[data-plan-finish]");
  const finishEntry = smoothstep((progress - 0.84) / 0.1);

  steps.forEach((step, index) => {
    step.classList.toggle("past", index < activeIndex || sequence >= 1);
    step.classList.toggle("active", index === activeIndex && sequence < 1);
  });
  if (counter) counter.textContent = sequence >= 1 ? "PLAN BEREIT" : `${String(activeIndex + 1).padStart(2, "0")} / 06`;
  if (status) status.textContent = sequence >= 1 ? "AUFEINANDER ABGESTIMMT" : statuses[activeIndex];
  if (progressBar) progressBar.style.height = `${(sequence * 100).toFixed(2)}%`;
  setMotionValue(visual, "--plan-fill", `${(sequence * 100).toFixed(2)}%`);
  setMotionValue(visual, "--plan-insights-y", `${(-16 * sequence).toFixed(1)}px`);
  setMotionValue(visual, "--plan-main-y", `${(-25 * sequence).toFixed(1)}px`);
  setMotionValue(visual, "--plan-main-scale", (0.96 + 0.04 * sequence).toFixed(3));
  setMotionValue(finish, "--finish-opacity", finishEntry.toFixed(3));
  setMotionValue(finish, "--finish-y", `${(18 * (1 - finishEntry)).toFixed(1)}px`);

  if (progress >= 0.95 && !planComplete) {
    planComplete = true;
    capture("training_plan_explainer_completed");
  }
};

const updateCalibration = () => {
  if (!calibrationStage) return;
  const rect = calibrationStage.getBoundingClientRect();
  const startLine = window.innerHeight * 0.72;
  const distance = Math.max(rect.height + window.innerHeight * 0.42, 1);
  const progress = Math.min(1, Math.max(0, (startLine - rect.top) / distance));
  calibrationStage.style.setProperty("--calibration-progress", progress.toFixed(3));
  calibrationStage.querySelectorAll("[data-calibration-step]").forEach((step) => {
    step.classList.toggle("active", progress >= Number(step.dataset.at || 0));
  });
};

const updateScrollEffects = () => {
  scrollFrame = null;
  header?.classList.toggle("scrolled", window.scrollY > 24);

  if (!reducedMotion) {
    updateRunStage();
    updateEffortStage();
    updateVaultTransition();
    updatePlanStage();
    if (parallaxPhone && desktopStory.matches) {
      const offset = Math.min(window.scrollY * 0.08, 70);
      parallaxPhone.style.setProperty("--phone-shift", `${offset}px`);
    }
  }
  updateCalibration();
};

const requestScrollUpdate = () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScrollEffects);
};

updateScrollEffects();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate, { passive: true });
window.addEventListener("load", requestScrollUpdate, { once: true });
window.addEventListener("pageshow", requestScrollUpdate);
document.addEventListener("scroll", requestScrollUpdate, { capture: true, passive: true });
desktopStory.addEventListener?.("change", requestScrollUpdate);
window.visualViewport?.addEventListener("resize", requestScrollUpdate, { passive: true });

const reveals = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");
if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -5%" });
  reveals.forEach((node) => revealObserver.observe(node));
} else {
  reveals.forEach((node) => node.classList.add("visible"));
}

const initCloudflareAnalytics = () => {
  if (!config.cloudflareAnalyticsToken || document.querySelector("script[data-cf-beacon]")) return;
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = JSON.stringify({ token: config.cloudflareAnalyticsToken });
  document.head.append(beacon);
};
initCloudflareAnalytics();

const consentPanel = document.querySelector("[data-consent-panel]");
const setConsentPanel = (open) => {
  if (!consentPanel) return;
  consentPanel.hidden = !open;
  document.body.classList.toggle("consent-open", open);
};

const applyAnalyticsConsent = (choice) => {
  localStorage.setItem(consentKey, choice);
  if (choice === "accepted") window.posthog?.opt_in_capturing?.();
  else window.posthog?.opt_out_capturing?.();
  setConsentPanel(false);
};

document.querySelectorAll("[data-consent]").forEach((button) => {
  button.addEventListener("click", () => applyAnalyticsConsent(button.dataset.consent === "accept" ? "accepted" : "rejected"));
});
document.querySelectorAll("[data-open-consent]").forEach((button) => {
  button.addEventListener("click", () => setConsentPanel(true));
});

if (config.posthogEnabled && !localStorage.getItem(consentKey)) setConsentPanel(true);
if (!config.posthogEnabled) document.querySelectorAll("[data-open-consent]").forEach((button) => { button.hidden = true; });

const forms = document.querySelectorAll("[data-waitlist-form]");
forms.forEach((form, index) => {
  const status = form.querySelector("[data-form-status]");
  const email = form.querySelector("[data-waitlist-email]");
  let started = false;

  if (config.mailerLiteFormAction) {
    form.action = config.mailerLiteFormAction;
    form.method = "post";
  }

  email?.addEventListener("focus", () => {
    if (started) return;
    started = true;
    capture("waitlist_started", { placement: index === 0 ? "hero" : "footer" });
  });

  form.addEventListener("submit", (event) => {
    status?.classList.remove("error", "success");
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      if (status) {
        status.textContent = "BITTE E-MAIL UND EINWILLIGUNG PRÜFEN.";
        status.classList.add("error");
      }
      return;
    }
    if (!config.mailerLiteFormAction) {
      event.preventDefault();
      if (status) {
        status.textContent = "DAS FORMULAR IST VORBEREITET UND WIRD VOR DEM START MIT MAILERLITE VERBUNDEN.";
        status.classList.add("error");
      }
      return;
    }
    capture("waitlist_submitted", { placement: index === 0 ? "hero" : "footer" });
    if (status) {
      status.textContent = "FAST GESCHAFFT — BITTE BESTÄTIGE DIE E-MAIL IN DEINEM POSTFACH.";
      status.classList.add("success");
    }
    window.setTimeout(() => form.reset(), 800);
  });
});

const feedbackForm = document.querySelector("[data-feedback-form]");
if (feedbackForm) {
  const status = feedbackForm.querySelector("[data-feedback-status]");
  const message = feedbackForm.querySelector("textarea[name='message']");
  let started = false;

  message?.addEventListener("focus", () => {
    if (started) return;
    started = true;
    capture("feedback_started");
  });
  feedbackForm.querySelectorAll("input[name='category']").forEach((input) => {
    input.addEventListener("change", () => capture("feedback_category_selected", { category: input.value }));
  });

  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status?.classList.remove("error", "success");
    if (!feedbackForm.checkValidity()) {
      feedbackForm.reportValidity();
      if (status) {
        status.textContent = "BITTE NACHRICHT UND DATENSCHUTZ-EINWILLIGUNG PRÜFEN.";
        status.classList.add("error");
      }
      return;
    }
    if (feedbackForm.elements.website_check?.value) return;
    if (!config.formspreeEndpoint) {
      if (status) {
        status.textContent = "DAS FEEDBACK-FORMULAR IST VORBEREITET UND WIRD VOR DEM START MIT FORMSPREE VERBUNDEN.";
        status.classList.add("error");
      }
      return;
    }

    const button = feedbackForm.querySelector("button[type='submit']");
    button?.setAttribute("disabled", "");
    if (status) status.textContent = "WIRD GESENDET …";
    try {
      const response = await fetch(config.formspreeEndpoint, {
        method: "POST",
        body: new FormData(feedbackForm),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("feedback request failed");
      capture("feedback_submitted", { category: feedbackForm.elements.category?.value || "none" });
      feedbackForm.reset();
      if (status) {
        status.textContent = "DANKE — DEIN FEEDBACK IST ANGEKOMMEN.";
        status.classList.add("success");
      }
    } catch {
      if (status) {
        status.textContent = "SENDEN HAT NICHT GEKLAPPT. BITTE VERSUCHE ES NOCH EINMAL.";
        status.classList.add("error");
      }
    } finally {
      button?.removeAttribute("disabled");
    }
  });
}

document.querySelectorAll("details").forEach((detail, index) => {
  detail.addEventListener("toggle", () => {
    if (detail.open) capture("faq_opened", { item: index + 1 });
  });
});

if ("IntersectionObserver" in window) {
  const seenSections = new Set();
  const enteredAt = new Map();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = entry.target.dataset.trackSection;
      if (entry.isIntersecting) {
        enteredAt.set(section, Date.now());
        if (!seenSections.has(section)) {
          seenSections.add(section);
          capture("section_viewed", { section });
        }
      } else if (enteredAt.has(section)) {
        const seconds = Math.round((Date.now() - enteredAt.get(section)) / 1000);
        enteredAt.delete(section);
        if (seconds >= 2) capture("section_dwell", { section, seconds: Math.min(seconds, 600) });
      }
    });
  }, { threshold: 0.55 });
  document.querySelectorAll("[data-track-section]").forEach((section) => sectionObserver.observe(section));
}

const milestones = new Set();
window.addEventListener("scroll", () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return;
  const percent = (window.scrollY / scrollable) * 100;
  [25, 50, 75, 100].forEach((milestone) => {
    if (percent >= milestone && !milestones.has(milestone)) {
      milestones.add(milestone);
      capture("scroll_depth", { percent: milestone });
    }
  });
}, { passive: true });
