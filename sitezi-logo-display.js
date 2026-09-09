/* =========================================================
   SITEZI — IDENTIDADE DO NOME v3.0
   - remove a experiência de logo gerada por IA;
   - mantém upload de logo para quem já possui uma;
   - renderiza o nome como HTML real, grande e responsivo;
   - aplica a decisão tipográfica do Diretor IA na prévia;
   - corrige posição do botão de ajuda no mobile.
   ========================================================= */
(() => {
  "use strict";

  const VERSION = "3.0";
  const STYLE_ID = "sitezi-name-identity-v30";
  const state = () => window.SITEZI_BUILDER_STATE || {};

  const FONT_MAP = {
    "luxury-serif": { family: '"Cormorant Garamond", Georgia, serif', url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap" },
    "editorial-serif": { family: '"Playfair Display", Georgia, serif', url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap" },
    "classic-serif": { family: '"Libre Baskerville", Georgia, serif', url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" },
    "modern-sans": { family: 'Montserrat, Inter, Arial, sans-serif', url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" },
    "clean-geometric": { family: 'Manrope, Inter, Arial, sans-serif', url: "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" },
    "strong-condensed": { family: 'Oswald, Impact, sans-serif', url: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&display=swap" },
    "soft-rounded": { family: 'Nunito, Inter, Arial, sans-serif', url: "https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap" }
  };

  function decodeIdentity(mode) {
    const raw = String(mode || "");
    if (!raw.startsWith("name-ai:")) return null;
    try {
      const bin = atob(raw.slice(8));
      const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) { return null; }
  }

  function identity() {
    const s = state();
    return s.aiNameIdentity || s.aiDirector?.design?.brandIdentity || decodeIdentity(s.logoMode) || null;
  }

  function safeIdentity(raw) {
    if (!raw || typeof raw !== "object") return null;
    const allowedFonts = new Set(Object.keys(FONT_MAP));
    const fontKey = allowedFonts.has(raw.fontKey) ? raw.fontKey : "modern-sans";
    const layout = ["stacked", "inline", "split"].includes(raw.layout) ? raw.layout : "stacked";
    const textCase = ["original", "upper", "title", "lower"].includes(raw.case) ? raw.case : "original";
    const align = ["left", "center"].includes(raw.align) ? raw.align : "left";
    const weight = Math.min(950, Math.max(500, Number(raw.weight) || 800));
    const letterSpacing = Math.min(.18, Math.max(-.04, Number(raw.letterSpacing) || 0));
    const primaryScale = Math.min(1.7, Math.max(.9, Number(raw.primaryScale) || 1.2));
    const secondaryScale = Math.min(1, Math.max(.4, Number(raw.secondaryScale) || .62));
    return {
      primaryText: String(raw.primaryText || "").trim(),
      secondaryText: String(raw.secondaryText || "").trim(),
      fontKey, layout, case: textCase, align, weight, letterSpacing,
      primaryScale, secondaryScale,
      accentWord: String(raw.accentWord || "").trim(),
      showInHero: raw.showInHero !== false
    };
  }

  function transformText(text, mode) {
    const v = String(text || "");
    if (mode === "upper") return v.toLocaleUpperCase("pt-BR");
    if (mode === "lower") return v.toLocaleLowerCase("pt-BR");
    if (mode === "title") return v.toLocaleLowerCase("pt-BR").replace(/(^|\s|[-'’])\p{L}/gu, m => m.toLocaleUpperCase("pt-BR"));
    return v;
  }

  function ensureFont(doc, id) {
    const f = FONT_MAP[id] || FONT_MAP["modern-sans"];
    if (!doc?.head || doc.querySelector(`link[data-sitezi-name-font="${id}"]`)) return f.family;
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = f.url;
    link.dataset.siteziNameFont = id;
    doc.head.appendChild(link);
    return f.family;
  }

  function ensureStyle(doc, spec) {
    if (!doc?.head) return;
    doc.getElementById(STYLE_ID)?.remove();
    const family = ensureFont(doc, spec.fontKey);
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .sitezi-name-brand{display:flex!important;align-items:baseline!important;gap:.32em!important;min-width:0!important;max-width:min(62vw,430px)!important;color:inherit!important;text-decoration:none!important;font-family:${family}!important;font-weight:${spec.weight}!important;letter-spacing:${spec.letterSpacing}em!important;line-height:.88!important;text-align:${spec.align}!important}
      .sitezi-name-brand.stacked{flex-direction:column!important;align-items:${spec.align === "center" ? "center" : "flex-start"}!important;gap:.05em!important}
      .sitezi-name-brand .sitezi-name-primary{display:block!important;font-size:clamp(20px,2.3vw,32px)!important;line-height:.9!important;white-space:normal!important}
      .sitezi-name-brand .sitezi-name-secondary{display:block!important;font-size:clamp(11px,1.35vw,18px)!important;line-height:1!important;opacity:.72!important;letter-spacing:max(${spec.letterSpacing}em,.05em)!important}
      .sitezi-name-hero{position:relative;z-index:2;margin:0 0 20px!important;font-family:${family}!important;font-weight:${spec.weight}!important;letter-spacing:${spec.letterSpacing}em!important;line-height:.82!important;text-align:${spec.align}!important;color:var(--a,var(--sitezi-director-accent,#1578ff))!important;max-width:100%!important}
      .sitezi-name-hero .sitezi-name-primary{display:block!important;font-size:clamp(${Math.round(44*spec.primaryScale)}px,${(7.8*spec.primaryScale).toFixed(2)}vw,${Math.round(104*spec.primaryScale)}px)!important;line-height:.82!important;overflow-wrap:anywhere!important}
      .sitezi-name-hero .sitezi-name-secondary{display:block!important;margin-top:.14em!important;font-size:clamp(${Math.round(22*spec.secondaryScale)}px,${(4.6*spec.secondaryScale).toFixed(2)}vw,${Math.round(60*spec.secondaryScale)}px)!important;line-height:.9!important;opacity:.72!important}
      .sitezi-name-accent{color:var(--a,var(--sitezi-director-accent,#1578ff))!important}
      @media(max-width:700px){
        .sitezi-name-brand{max-width:54vw!important;letter-spacing:${Math.max(-.025, Math.min(.12, spec.letterSpacing))}em!important}
        .sitezi-name-brand .sitezi-name-primary{font-size:clamp(17px,5vw,23px)!important}
        .sitezi-name-brand .sitezi-name-secondary{font-size:clamp(9px,3vw,13px)!important}
        .sitezi-name-hero{margin-bottom:16px!important}
        .sitezi-name-hero .sitezi-name-primary{font-size:clamp(${Math.round(36*spec.primaryScale)}px,${(12.5*spec.primaryScale).toFixed(2)}vw,${Math.round(72*spec.primaryScale)}px)!important}
        .sitezi-name-hero .sitezi-name-secondary{font-size:clamp(${Math.round(18*spec.secondaryScale)}px,${(8*spec.secondaryScale).toFixed(2)}vw,${Math.round(38*spec.secondaryScale)}px)!important}
      }
    `;
    doc.head.appendChild(style);
  }

  function appendWords(doc, parent, text, accentWord) {
    const words = String(text || "").split(/(\s+)/);
    words.forEach(part => {
      if (part.trim() && accentWord && part.toLocaleLowerCase("pt-BR") === accentWord.toLocaleLowerCase("pt-BR")) {
        const span = doc.createElement("span");
        span.className = "sitezi-name-accent";
        span.textContent = part;
        parent.appendChild(span);
      } else {
        parent.appendChild(doc.createTextNode(part));
      }
    });
  }

  function makeWordmark(doc, spec, hero = false) {
    const wrap = doc.createElement(hero ? "div" : "span");
    wrap.className = hero ? `sitezi-name-hero ${spec.layout}` : `sitezi-name-brand ${spec.layout}`;

    const primary = doc.createElement("span");
    primary.className = "sitezi-name-primary";
    appendWords(doc, primary, transformText(spec.primaryText, spec.case), transformText(spec.accentWord, spec.case));
    wrap.appendChild(primary);

    if (spec.secondaryText) {
      const secondary = doc.createElement("span");
      secondary.className = "sitezi-name-secondary";
      appendWords(doc, secondary, transformText(spec.secondaryText, spec.case), transformText(spec.accentWord, spec.case));
      wrap.appendChild(secondary);
    }
    return wrap;
  }

  function applyToDocument(doc) {
    const s = state();
    if (!doc?.head) return false;
    if (s.logoData && s.logoMode === "upload") return false;

    const spec = safeIdentity(identity());
    if (!spec || !spec.primaryText) return false;
    ensureStyle(doc, spec);

    const brand = doc.querySelector("header .brand,.nav .brand,.navin .brand,.site-brand-wrap,.brand");
    if (brand && brand.dataset.siteziNameIdentity !== VERSION) {
      const wordmark = makeWordmark(doc, spec, false);
      brand.replaceChildren(...wordmark.childNodes);
      brand.className = `${brand.className.replace(/\bsitezi-name-brand\b/g, "").trim()} sitezi-name-brand ${spec.layout}`.trim();
      brand.setAttribute("aria-label", s.businessName || `${spec.primaryText} ${spec.secondaryText}`.trim());
      brand.dataset.siteziNameIdentity = VERSION;
    }

    if (spec.showInHero) {
      const hero = doc.querySelector(".hero");
      const heroCopy = doc.querySelector(".hero-copy,.hero-copywrap,.hero-grid>div:first-child,.hero>div>div:first-child") || hero;
      if (heroCopy && !doc.querySelector(".sitezi-name-hero")) {
        const mark = makeWordmark(doc, spec, true);
        const eyebrow = heroCopy.querySelector?.(".eyebrow");
        const h1 = heroCopy.querySelector?.("h1");
        if (eyebrow) eyebrow.insertAdjacentElement("afterend", mark);
        else if (h1) h1.insertAdjacentElement("beforebegin", mark);
        else heroCopy.prepend(mark);
      }
    }

    doc.documentElement.dataset.siteziNameIdentity = VERSION;
    return true;
  }

  function rewriteSrcdoc(frame) {
    const s = state();
    if (!frame || (s.logoData && s.logoMode === "upload")) return false;
    const spec = safeIdentity(identity());
    if (!spec) return false;
    const source = String(frame.srcdoc || "");
    if (!source || source.length < 50) return false;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(source, "text/html");
      if (!applyToDocument(doc)) return false;
      const next = "<!doctype html>\n" + doc.documentElement.outerHTML;
      if (next !== source) {
        frame.srcdoc = next;
        return true;
      }
    } catch (e) {
      console.warn("[SITEZI NAME IDENTITY] Falha ao consolidar srcdoc.", e);
    }
    return false;
  }

  function processFrame(frame) {
    if (!frame) return;
    const rewritten = rewriteSrcdoc(frame);
    if (!rewritten) {
      try { applyToDocument(frame.contentDocument); } catch (_) {}
    }
  }

  function processAll() {
    processFrame(document.getElementById("sitePreview"));
    processFrame(document.getElementById("fullPreviewFrame"));
  }

  function updateBuilderCopy() {
    const ai = document.querySelector('[data-logo-mode="ai"]');
    if (ai) ai.style.display = "none";

    const step = document.querySelector('.step[data-step="6"]');
    if (step) {
      const h = step.querySelector(".step-copy h2");
      const p = step.querySelector(".step-copy p");
      const text = step.querySelector('[data-logo-mode="text"]');
      if (h) h.textContent = "Como sua marca deve aparecer?";
      if (p) p.textContent = "A SITEZI pode transformar o nome do seu negócio em uma identidade elegante. Se você já possui uma logo, também pode enviá-la.";
      if (text) {
        text.classList.add("active");
        const b = text.querySelector("b");
        const sm = text.querySelector("small");
        if (b) b.textContent = "Criar identidade do nome com IA";
        if (sm) sm.textContent = "A IA escolhe a apresentação do nome para combinar com seu segmento e com o design do site.";
      }
    }

    document.querySelectorAll(".home-points span").forEach(el => {
      if (/logo e imagens com ia/i.test(el.textContent || "")) el.innerHTML = "<i>✓</i> Identidade do nome com IA*";
    });

    document.querySelectorAll(".price-card li").forEach(el => {
      if (/logo e imagens com ia/i.test(el.textContent || "")) el.textContent = "Identidade do nome com IA";
    });

    const upgrade = document.querySelector("#siteziUpgradeCard p");
    if (upgrade && /logo/i.test(upgrade.textContent || "")) {
      upgrade.textContent = "Com um plano ativo, a SITEZI pode criar uma identidade tipográfica personalizada para o nome do seu negócio e evoluir o design do site.";
    }
  }

  function bindTextChoice() {
    const btn = document.querySelector('[data-logo-mode="text"]');
    if (!btn || btn.dataset.siteziNameBound === VERSION) return;
    btn.dataset.siteziNameBound = VERSION;
    btn.addEventListener("click", () => {
      const s = state();
      s.logoData = "";
      s.aiLogoGenerated = false;
      if (!String(s.logoMode || "").startsWith("name-ai:")) s.logoMode = "text";
      document.querySelectorAll("[data-logo-mode]").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
    }, true);
  }

  function schedule() {
    [0, 60, 160, 350, 700].forEach(ms => setTimeout(processAll, ms));
  }

  function installSupport() {
    const ID = "siteziWhatsappSupport";
    if (document.getElementById(ID)) return;

    const style = document.createElement("style");
    style.id = "sitezi-whatsapp-support-v20";
    style.textContent = `
      #${ID}{position:fixed;right:14px;bottom:18px;z-index:9997;display:none;align-items:center;gap:8px;min-height:44px;padding:9px 13px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:#16a34a;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,.3);text-decoration:none;font:800 12px/1 Inter,Arial,sans-serif}
      #${ID}.visible{display:flex}#${ID} .ico{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#16a34a;font-size:16px;font-weight:950}
      body.wizard-open #${ID}{right:12px;top:76px;bottom:auto}
      body.result-open #${ID}{right:12px;top:76px;bottom:auto}
      body.plans-open #${ID}{right:12px;bottom:18px;top:auto}
      @media(max-width:600px){#${ID}{width:44px;height:44px;min-height:44px;padding:8px;justify-content:center}#${ID} .copy{display:none}body.wizard-open #${ID},body.result-open #${ID}{top:72px;right:10px}}
    `;
    document.head.appendChild(style);

    const a = document.createElement("a");
    a.id = ID;
    a.target = "_blank";
    a.rel = "noopener";
    a.href = "https://wa.me/5548996942186?text=" + encodeURIComponent("Olá! Estou usando o SITEZI e preciso de ajuda com meu site.");
    a.innerHTML = '<span class="ico">⌁</span><span class="copy">Ajuda no WhatsApp</span>';
    document.body.appendChild(a);

    const sync = () => {
      const onHome = document.getElementById("home")?.classList.contains("active");
      const full = document.querySelector(".full-preview-screen:not(.hidden)");
      a.classList.toggle("visible", !onHome && !full);
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class"] });
    sync();
  }

  function install() {
    updateBuilderCopy();
    bindTextChoice();
    installSupport();

    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame || frame.dataset.siteziNameBound === VERSION) return;
      frame.dataset.siteziNameBound = VERSION;
      frame.addEventListener("load", () => setTimeout(() => processFrame(frame), 50));
    });

    processAll();
    document.documentElement.dataset.siteziNameIdentityClient = VERSION;
  }

  window.SITEZI_NAME_IDENTITY = { applyToDocument, processAll, identity };
  window.addEventListener("sitezi:name-identity-generated", schedule);
  window.addEventListener("sitezi:builder-state", () => setTimeout(processAll, 30));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { install(); schedule(); }, { once: true });
  } else {
    install(); schedule();
  }
})();
