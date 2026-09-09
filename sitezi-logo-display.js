/* =========================================================
   SITEZI — LOGO VISÍVEL v2.1
   IA gera somente o símbolo; SITEZI compõe símbolo + nome real.
   Corrige duplicação do nome no cabeçalho.
   Mantém upload de logo e modo texto sem alterações.
   ========================================================= */
(() => {
  "use strict";

  const STYLE_ID = "sitezi-customer-logo-size-v21";

  function getState() {
    return window.SITEZI_BUILDER_STATE || {};
  }

  function ensureStyle(doc) {
    if (!doc?.head || doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .brand-img,.brand-mark,.sitezi-ai-brand-symbol{
        width:auto!important;
        height:52px!important;
        max-height:52px!important;
        max-width:62px!important;
        object-fit:contain!important;
        object-position:center!important;
        flex:0 0 auto!important;
      }

      .brand,.site-brand-wrap{
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        min-width:0!important;
      }

      .sitezi-ai-brand-name{
        display:block!important;
        min-width:0!important;
        max-width:220px!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        font:900 19px/1.05 Inter,Arial,sans-serif!important;
        letter-spacing:-.4px!important;
        color:inherit!important;
      }

      .sitezi-duplicate-brand-name{
        display:none!important;
      }

      @media(max-width:700px){
        .brand-img,.brand-mark,.sitezi-ai-brand-symbol{
          height:44px!important;
          max-height:44px!important;
          max-width:52px!important;
        }
        .brand,.site-brand-wrap{gap:8px!important}
        .sitezi-ai-brand-name{
          max-width:160px!important;
          font-size:16px!important;
          letter-spacing:-.25px!important;
        }
      }

      @media(max-width:390px){
        .sitezi-ai-brand-name{
          max-width:130px!important;
          font-size:15px!important;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  function normalizeText(v) {
    return String(v || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findRealHeaderBrand(doc, img) {
    const candidates = [
      img?.closest?.("header .brand"),
      img?.closest?.(".nav .brand"),
      img?.closest?.(".navin .brand"),
      img?.closest?.(".site-brand-wrap"),
      img?.closest?.(".brand")
    ].filter(Boolean);

    return candidates[0] || null;
  }

  function removeDuplicateHeaderName(doc, brand, businessName) {
    const wanted = normalizeText(businessName);
    if (!wanted) return;

    const header =
      brand?.closest?.("header") ||
      brand?.closest?.(".nav") ||
      brand?.closest?.(".navin") ||
      null;

    if (!header) return;

    const selectors = "h1,h2,h3,strong,b,span,div,a,p";
    header.querySelectorAll(selectors).forEach(el => {
      if (brand.contains(el)) return;
      if (el.children.length > 0) return;

      if (normalizeText(el.textContent) === wanted) {
        el.classList.add("sitezi-duplicate-brand-name");
        el.setAttribute("aria-hidden", "true");
      }
    });
  }

  function composeAiBrand(doc) {
    const state = getState();
    if (!state.aiLogoGenerated || !state.businessName) return;

    const img = doc.querySelector(".brand-mark-ai,.brand-img,.brand-mark");
    if (!img) return;

    const brand = findRealHeaderBrand(doc, img);
    if (!brand) return;

    img.setAttribute("alt", "");
    img.setAttribute("aria-hidden", "true");
    img.classList.add("sitezi-ai-brand-symbol");

    /* Remove nomes antigos/duplicados já existentes dentro da marca. */
    [...brand.children].forEach(child => {
      if (child === img) return;
      if (normalizeText(child.textContent) === normalizeText(state.businessName)) {
        child.remove();
      }
    });

    let name = brand.querySelector(".sitezi-ai-brand-name");
    if (!name) {
      name = doc.createElement("span");
      name.className = "sitezi-ai-brand-name";
      brand.appendChild(name);
    }

    name.textContent = state.businessName;
    brand.setAttribute("aria-label", state.businessName);

    /* Elimina outro nome igual que apareça no mesmo cabeçalho. */
    removeDuplicateHeaderName(doc, brand, state.businessName);
  }

  function enhanceFrame(frame) {
    if (!frame) return;

    try {
      const doc = frame.contentDocument;
      if (!doc?.head) return;

      ensureStyle(doc);
      composeAiBrand(doc);
    } catch (_) {}
  }

  function install() {
    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame) return;

      if (!frame.dataset.siteziLogoBoundV21) {
        frame.dataset.siteziLogoBoundV21 = "1";
        frame.addEventListener("load", () => {
          setTimeout(() => enhanceFrame(frame), 40);
        });
      }

      enhanceFrame(frame);
    });
  }

  window.addEventListener("sitezi:ai-logo-generated", () => {
    setTimeout(install, 0);
    setTimeout(install, 150);
  });

  window.addEventListener("sitezi:builder-state", () => {
    setTimeout(install, 25);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  setInterval(install, 800);
})();
