/* =========================================================
   SITEZI — LOGO VISÍVEL v2.0
   IA gera somente o símbolo; SITEZI compõe símbolo + nome real.
   Mantém upload de logo e modo texto sem alterações.
   ========================================================= */
(() => {
  "use strict";

  const STYLE_ID = "sitezi-customer-logo-size-v20";
  const SOURCE_MARK = "sitezi-ai-brand-lock";

  function getState() {
    return window.SITEZI_BUILDER_STATE || {};
  }

  function ensureStyle(doc) {
    if (!doc?.head || doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .brand-img,.brand-mark{
        width:auto!important;
        height:58px!important;
        max-height:58px!important;
        max-width:74px!important;
        object-fit:contain!important;
        object-position:center!important;
        flex:0 0 auto!important;
      }

      .brand,.site-brand-wrap{
        display:flex!important;
        align-items:center!important;
        gap:11px!important;
        min-width:0!important;
      }

      .sitezi-ai-brand-name{
        display:block!important;
        min-width:0!important;
        max-width:240px!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        font:900 20px/1.05 Inter,Arial,sans-serif!important;
        letter-spacing:-.45px!important;
        color:inherit!important;
      }

      @media(max-width:700px){
        .brand-img,.brand-mark{
          height:48px!important;
          max-height:48px!important;
          max-width:58px!important;
        }
        .brand,.site-brand-wrap{gap:9px!important}
        .sitezi-ai-brand-name{
          max-width:170px!important;
          font-size:17px!important;
          letter-spacing:-.3px!important;
        }
      }

      @media(max-width:390px){
        .sitezi-ai-brand-name{max-width:135px!important;font-size:16px!important}
      }
    `;
    doc.head.appendChild(style);
  }

  function findBrand(doc, img) {
    return img?.closest?.(".brand,.site-brand-wrap") ||
      doc.querySelector(".brand,.site-brand-wrap");
  }

  function composeAiBrand(doc) {
    const state = getState();
    if (!state.aiLogoGenerated || !state.businessName) return false;

    const img = doc.querySelector(".brand-mark-ai,.brand-img,.brand-mark");
    if (!img) return false;

    const brand = findBrand(doc, img);
    if (!brand) return false;

    img.setAttribute("alt", "");
    img.setAttribute("aria-hidden", "true");
    img.classList.add("sitezi-ai-brand-symbol");

    let name = brand.querySelector(".sitezi-ai-brand-name");
    if (!name) {
      name = doc.createElement("span");
      name.className = "sitezi-ai-brand-name";
      brand.appendChild(name);
    }
    name.textContent = state.businessName;

    brand.setAttribute("aria-label", state.businessName);
    return true;
  }

  function persistPreviewSource(frame, doc) {
    if (frame?.id !== "sitePreview") return;
    if (!frame.srcdoc || frame.srcdoc.includes(SOURCE_MARK)) return;

    const marker = doc.createElement("meta");
    marker.setAttribute("name", SOURCE_MARK);
    marker.setAttribute("content", "1");
    doc.head.appendChild(marker);

    const html = "<!doctype html>\n" + doc.documentElement.outerHTML;
    frame.dataset.siteziAiBrandPersisting = "1";
    frame.srcdoc = html;
  }

  function enhanceFrame(frame) {
    if (!frame) return;

    try {
      const doc = frame.contentDocument;
      if (!doc?.head) return;

      ensureStyle(doc);
      const composed = composeAiBrand(doc);

      if (composed && !frame.dataset.siteziAiBrandPersisting) {
        persistPreviewSource(frame, doc);
      } else if (frame.dataset.siteziAiBrandPersisting) {
        delete frame.dataset.siteziAiBrandPersisting;
      }
    } catch (_) {}
  }

  function install() {
    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame) return;

      if (!frame.dataset.siteziLogoBoundV20) {
        frame.dataset.siteziLogoBoundV20 = "1";
        frame.addEventListener("load", () => {
          setTimeout(() => enhanceFrame(frame), 35);
        });
      }

      enhanceFrame(frame);
    });
  }

  window.addEventListener("sitezi:ai-logo-generated", () => {
    setTimeout(install, 0);
    setTimeout(install, 120);
  });

  window.addEventListener("sitezi:builder-state", () => {
    setTimeout(install, 20);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  setInterval(install, 700);
})();
