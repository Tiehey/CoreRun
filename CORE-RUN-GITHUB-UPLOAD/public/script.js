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
const effortStage = document.querySelector("[data-effort-stage]");
const analysisStage = document.querySelector("[data-analysis-stage]");
const vaultTransition = document.querySelector("[data-vault-transition]");
const planStage = document.querySelector("[data-plan-stage]");
const parallaxPhone = document.querySelector("[data-parallax-phone]");
const shortViewport = window.matchMedia("(max-height: 620px)");
let effortComplete = false;
let planComplete = false;
let scrollFrame = null;
document.documentElement.classList.add("motion-ready");

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const motion = (node, key, value) => node?.style.setProperty(key, String(value));
const stageProgress = stage => {
  const height = stage.querySelector(".journey-sticky").offsetHeight;
  return clamp(-stage.getBoundingClientRect().top / Math.max(1, stage.offsetHeight - height));
};

const updateEffortStage = () => {
  if (!effortStage) return;
  const p = stageProgress(effortStage);
  // One persistent app-shaped gauge. The sequence is illustrative, not factor weights.
  const sequence = clamp(p / .87);
  const position = sequence * 5;
  const mobile = !desktopStory.matches;
  effortStage.querySelectorAll("[data-effort-input]").forEach((card, i) => {
    const distance = i - position;
    const opacity = mobile ? (i === Math.round(position) ? 1 : 0) : clamp(1 - Math.abs(distance) * .65);
    motion(card, "--card-opacity", opacity.toFixed(3));
    motion(card, "--card-y", (distance * (mobile ? 10 : 185)).toFixed(1) + "px");
    motion(card, "--card-scale", mobile ? 1 : (1 - Math.min(Math.abs(distance), 1) * .12).toFixed(3));
    card.setAttribute("aria-hidden", opacity < .1 ? "true" : "false");
  });
  const fill = 12 + sequence * 60;
  motion(effortStage, "--gauge-fill", fill.toFixed(2));
  motion(effortStage, "--number-scale", (.88 + .12 * sequence).toFixed(3));
  effortStage.querySelector("[data-effort-number]").textContent = String(Math.round(fill));
  effortStage.querySelector("[data-effort-label]").textContent = sequence >= .99 ? "FORDERND" : "DEIN EFFORT";
  const recommendation = smoothstep((p - .87) / .09);
  motion(effortStage, "--rec-opacity", recommendation);
  motion(effortStage, "--rec-y", (12 * (1 - recommendation)) + "px");
  effortStage.querySelector("[data-effort-recommendation]").setAttribute("aria-hidden", recommendation < .1 ? "true" : "false");
  motion(effortStage, "--progress", p);
  if (p > .95 && !effortComplete) { effortComplete = true; capture("effort_explainer_completed"); }
};

const updateAnalysisStage = () => {
  if (!analysisStage) return;
  const p = stageProgress(analysisStage);
  const details = smoothstep(p / .35);
  const spread = smoothstep((p - .22) / .58);
  motion(analysisStage, "--detail-opacity", .2 + .8 * details);
  motion(analysisStage, "--detail-y", (18 * (1 - details)) + "px");
  motion(analysisStage, "--analysis-scale", .86 + .14 * smoothstep(p / .25));
  motion(analysisStage, "--analysis-spread", spread * (desktopStory.matches ? 88 : 54) + "px");
  motion(analysisStage, "--route-opacity", spread);
  motion(analysisStage, "--progress", p);
};

const updateVaultTransition = () => {
  if (!vaultTransition) return;
  const p = stageProgress(vaultTransition);
  const merge = smoothstep((p - .3) / .27);
  const exit = smoothstep((p - .53) / .13);
  const availableHeight = vaultTransition.querySelector(".profile-visual").clientHeight;
  const spacing = Math.min(125, availableHeight * .27);
  vaultTransition.querySelectorAll("[data-vault-run]").forEach((card, i) => {
    const entry = i === 0 ? 1 : smoothstep((p - .01 - i * .085) / .09);
    motion(card, "--vault-card-opacity", entry * (1 - exit));
    motion(card, "--vault-card-x", ((i % 2 ? -12 : 12) * (1 - merge)) + "px");
    motion(card, "--vault-card-y", ((i - 1) * spacing * (1 - merge)) + "px");
    motion(card, "--vault-card-rotate", ((i - 1) * 3 * (1 - merge)) + "deg");
    motion(card, "--vault-card-scale", 1 - .2 * merge);
  });
  const label = smoothstep((p - .48) / .1);
  const phones = smoothstep((p - .62) / .2);
  const spread = smoothstep((p - .76) / .23);
  motion(vaultTransition, "--vault-label-opacity", label * (1 - phones));
  motion(vaultTransition, "--vault-label-scale", .8 + .2 * label);
  motion(vaultTransition, "--vault-phone-opacity", phones);
  motion(vaultTransition, "--vault-phone-scale", .8 + .2 * phones);
  motion(vaultTransition, "--profile-spread", spread * (desktopStory.matches ? 85 : 52) + "px");
  motion(vaultTransition, "--progress", p);
};

const updatePlanStage = () => {
  if (!planStage) return;
  const p = stageProgress(planStage);
  const steps = [...planStage.querySelectorAll("[data-plan-input]")];
  const index = Math.min(5, Math.floor(p * 6));
  steps.forEach((step, i) => {
    step.classList.toggle("active", i === index);
    step.classList.toggle("past", i < index);
  });
  motion(planStage, "--plan-fill", (p * 100) + "%");
  if (p > .95 && !planComplete) { planComplete = true; capture("training_plan_explainer_completed"); }
};

const updateScrollEffects = () => {
  scrollFrame = null;
  header?.classList.toggle("scrolled", window.scrollY > 24);
  if (reducedMotion || shortViewport.matches) {
    motion(effortStage, "--gauge-fill", 72);
    motion(effortStage, "--number-scale", 1);
    motion(effortStage, "--rec-opacity", 1);
    if (effortStage) {
      effortStage.querySelector("[data-effort-number]").textContent = "72";
      effortStage.querySelector("[data-effort-label]").textContent = "FORDERND";
      effortStage.querySelectorAll("[data-effort-input], [data-effort-recommendation]").forEach(node => node.removeAttribute("aria-hidden"));
    }
    return;
  }
  updateEffortStage();
  updateAnalysisStage();
  updateVaultTransition();
  updatePlanStage();
  if (parallaxPhone && desktopStory.matches) motion(parallaxPhone, "--phone-shift", Math.min(window.scrollY * .08, 70) + "px");
};

const requestScrollUpdate = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
};
updateScrollEffects();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate, { passive: true });
window.addEventListener("load", requestScrollUpdate, { once: true });
window.addEventListener("pageshow", requestScrollUpdate);
desktopStory.addEventListener?.("change", requestScrollUpdate);
shortViewport.addEventListener?.("change", requestScrollUpdate);
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
