/* =========================================================
   SITEZI — LOGO FINAL v2.4
   Arquitetura definitiva:
   - IA gera somente o SÍMBOLO;
   - nome da empresa é sempre texto HTML real;
   - composição é gravada no próprio srcdoc da prévia;
   - por isso a tela cheia e a publicação usam a mesma logo;
   - upload manual de logo continua intacto.
   ========================================================= */
(() => {
  "use strict";

  const VERSION = "2.4";
  const STYLE_ID = "sitezi-logo-final-v24";
  const SOURCE_MARK = "sitezi-logo-source-v24";

  const state = () => window.SITEZI_BUILDER_STATE || {};

  function cssText() {
    return `
      .brand,.site-brand-wrap{
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        min-width:0!important;
        flex:1 1 auto!important;
        max-width:min(100%,360px)!important;
      }

      .sitezi-ai-symbol{
        display:block!important;
        width:52px!important;
        height:52px!important;
        min-width:52px!important;
        max-width:52px!important;
        min-height:52px!important;
        max-height:52px!important;
        object-fit:contain!important;
        object-position:center!important;
        flex:0 0 52px!important;
        border-radius:10px!important;
      }

      .sitezi-ai-brand-name{
        display:block!important;
        min-width:0!important;
        max-width:235px!important;
        overflow:hidden!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important;
        font:900 20px/1.05 Inter,Arial,sans-serif!important;
        letter-spacing:-.4px!important;
        color:inherit!important;
      }

      @media(max-width:700px){
        .brand,.site-brand-wrap{
          gap:8px!important;
          max-width:min(56vw,220px)!important;
        }

        .sitezi-ai-symbol{
          width:42px!important;
          height:42px!important;
          min-width:42px!important;
          max-width:42px!important;
          min-height:42px!important;
          max-height:42px!important;
          flex-basis:42px!important;
          border-radius:9px!important;
        }

        .sitezi-ai-brand-name{
          max-width:165px!important;
          font-size:16px!important;
          line-height:1.02!important;
          letter-spacing:-.25px!important;
          display:-webkit-box!important;
          -webkit-box-orient:vertical!important;
          -webkit-line-clamp:2!important;
          overflow:hidden!important;
        }
      }

      @media(max-width:390px){
        .brand,.site-brand-wrap{max-width:54vw!important}
        .sitezi-ai-symbol{
          width:38px!important;
          height:38px!important;
          min-width:38px!important;
          max-width:38px!important;
          min-height:38px!important;
          max-height:38px!important;
          flex-basis:38px!important;
        }
        .sitezi-ai-brand-name{
          max-width:128px!important;
          font-size:15px!important;
        }
      }
    `;
  }

  function ensureStyle(doc) {
    if (!doc?.head) return;
    let style = doc.getElementById(STYLE_ID);
    if (!style) {
      style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = cssText();
      doc.head.appendChild(style);
    }
  }

  function findBrand(doc, logoData) {
    const candidates = [
      ...doc.querySelectorAll(".brand-mark-ai,.brand-img,.brand-mark")
    ];

    const img =
      candidates.find(el => String(el.getAttribute("src") || "") === String(logoData || "")) ||
      candidates.find(el => el.closest(".brand,.site-brand-wrap")) ||
      candidates[0];

    if (!img) return null;

    const brand =
      img.closest("header .brand") ||
      img.closest(".nav .brand") ||
      img.closest(".navin .brand") ||
      img.closest(".site-brand-wrap") ||
      img.closest(".brand");

    return brand ? { brand, img } : null;
  }

  function compose(doc, s) {
    if (!s.aiLogoGenerated || !s.logoData) return false;

    const found = findBrand(doc, s.logoData);
    if (!found) return false;

    const { brand } = found;
    ensureStyle(doc);

    const img = doc.createElement("img");
    img.className = "sitezi-ai-symbol";
    img.src = s.logoData;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");

    const name = doc.createElement("span");
    name.className = "sitezi-ai-brand-name";
    name.textContent = s.businessName || "Seu negócio";

    brand.replaceChildren(img, name);
    brand.setAttribute("aria-label", s.businessName || "Seu negócio");
    brand.dataset.siteziAiBrand = "symbol-text";

    return true;
  }

  function rewriteSrcdoc(frame) {
    if (!frame) return false;

    const s = state();
    if (!s.aiLogoGenerated || !s.logoData) return false;

    const source = String(frame.srcdoc || "");
    if (!source || source.length < 50) return false;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(source, "text/html");

      const oldMark = doc.documentElement?.dataset?.[SOURCE_MARK];
      const oldName = doc.documentElement?.dataset?.siteziLogoBusiness || "";

      if (oldMark === VERSION && oldName === String(s.businessName || "")) {
        return false;
      }

      if (!compose(doc, s)) return false;

      doc.documentElement.dataset[SOURCE_MARK] = VERSION;
      doc.documentElement.dataset.siteziLogoBusiness = String(s.businessName || "");

      const next = "<!doctype html>\n" + doc.documentElement.outerHTML;

      if (next !== source) {
        frame.srcdoc = next;
        return true;
      }
    } catch (error) {
      console.warn("[SITEZI LOGO FINAL] Não foi possível consolidar o srcdoc.", error);
    }

    return false;
  }

  function patchLiveFrame(frame) {
    if (!frame) return;

    try {
      const doc = frame.contentDocument;
      const s = state();

      if (!doc?.head || !s.aiLogoGenerated || !s.logoData) return;

      ensureStyle(doc);

      const brand = doc.querySelector("[data-sitezi-ai-brand='symbol-text']");
      if (brand) {
        const name = brand.querySelector(".sitezi-ai-brand-name");
        if (name && name.textContent !== (s.businessName || "Seu negócio")) {
          name.textContent = s.businessName || "Seu negócio";
        }
        return;
      }

      compose(doc, s);
    } catch (_) {}
  }

  function processFrame(frame) {
    if (!frame) return;
    const rewritten = rewriteSrcdoc(frame);
    if (!rewritten) patchLiveFrame(frame);
  }

  function processAll() {
    processFrame(document.getElementById("sitePreview"));
    processFrame(document.getElementById("fullPreviewFrame"));
  }

  function updateBuilderCopy() {
    const text = document.querySelector('[data-logo-mode="ai"] small');
    if (text) {
      text.textContent =
        "A IA cria o símbolo da marca. Fundo transparente nos planos Profissional e Premium.";
    }
  }

  function schedule() {
    [0, 60, 160, 350, 700].forEach(ms => setTimeout(processAll, ms));
  }

  function install() {
    updateBuilderCopy();

    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame || frame.dataset.siteziLogoFinalBound === VERSION) return;

      frame.dataset.siteziLogoFinalBound = VERSION;
      frame.addEventListener("load", () => {
        setTimeout(() => patchLiveFrame(frame), 25);
        setTimeout(() => rewriteSrcdoc(frame), 80);
      });
    });

    const generate = document.getElementById("generateSite");
    if (generate && generate.dataset.siteziLogoFinalBound !== VERSION) {
      generate.dataset.siteziLogoFinalBound = VERSION;
      generate.addEventListener("click", schedule, true);
    }

    const full = document.getElementById("fullPreview");
    if (full && full.dataset.siteziLogoFinalBound !== VERSION) {
      full.dataset.siteziLogoFinalBound = VERSION;
      full.addEventListener("click", schedule, true);
    }

    processAll();
    document.documentElement.dataset.siteziLogoFinal = VERSION;
  }

  window.addEventListener("sitezi:ai-logo-generated", schedule);
  window.addEventListener("sitezi:builder-state", () => setTimeout(processAll, 25));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      install();
      schedule();
    });
  } else {
    install();
    schedule();
  }

  setInterval(install, 700);
})();
