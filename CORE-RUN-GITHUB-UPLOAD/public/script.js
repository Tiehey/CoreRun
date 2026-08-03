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

const updateEffortStage = () => {
  if (!effortStage) return;
  const progress = stageProgress(effortStage);
  effortStage.style.setProperty("--effort-progress", progress.toFixed(3));
  effortStage.classList.toggle("intro-hidden", progress >= 0.11);
  effortStage.classList.toggle("score-visible", progress >= 0.09);
  effortStage.classList.toggle("complete", progress >= 0.94);

  const indicator = effortStage.querySelector("[data-effort-progress]");
  if (indicator) indicator.style.height = `${Math.round(progress * 100)}%`;
  const nodes = [...effortStage.querySelectorAll("[data-effort-node]")];
  let currentIndex = -1;
  nodes.forEach((node, index) => {
    if (progress >= Number(node.dataset.at || 0)) currentIndex = index;
  });
  nodes.forEach((node, index) => {
    node.classList.toggle("revealed", index <= currentIndex);
    node.classList.toggle("current", index === currentIndex && progress < 0.94);
  });

  if (progress >= 0.95 && !effortComplete) {
    effortComplete = true;
    capture("effort_explainer_completed");
  }
};

const updatePlanStage = () => {
  if (!planStage) return;
  const progress = stageProgress(planStage);
  planStage.style.setProperty("--plan-progress", progress.toFixed(3));
  const indicator = planStage.querySelector("[data-plan-progress]");
  if (indicator) indicator.style.height = `${Math.round(progress * 100)}%`;

  const cards = [...planStage.querySelectorAll("[data-plan-card]")];
  let currentIndex = -1;
  cards.forEach((card, index) => {
    if (progress >= Number(card.dataset.at || 0)) currentIndex = index;
  });
  cards.forEach((card, index) => {
    card.classList.toggle("active", index === currentIndex);
    card.classList.toggle("past", index < currentIndex);
  });

  const counter = planStage.querySelector("[data-plan-counter]");
  if (counter) counter.textContent = currentIndex >= 6 ? "READY" : `${String(Math.max(currentIndex + 1, 1)).padStart(2, "0")} / 06`;
  planStage.querySelectorAll(".plan-signal i").forEach((signal, index) => {
    signal.classList.toggle("active", index <= Math.min(currentIndex, 5));
  });

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

  if (!reducedMotion && desktopStory.matches) {
    updateEffortStage();
    updatePlanStage();
    if (parallaxPhone) {
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

const mobileStoryItems = document.querySelectorAll(
  "[data-effort-title], .effort-center, [data-effort-node], .plan-phone-stage, [data-plan-card]",
);
if ("IntersectionObserver" in window && !reducedMotion) {
  const mobileStoryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("mobile-in-view");
      mobileStoryObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8%" });
  mobileStoryItems.forEach((node) => mobileStoryObserver.observe(node));
} else {
  mobileStoryItems.forEach((node) => node.classList.add("mobile-in-view"));
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
