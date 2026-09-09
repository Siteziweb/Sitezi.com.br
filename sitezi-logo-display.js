/* =========================================================
   SITEZI — LOGO VISÍVEL v1.1
   Mostra símbolo + nome com presença correta em preview.
   ========================================================= */
(() => {
  "use strict";
  const STYLE_ID = "sitezi-customer-logo-size-v11";

  function enhanceFrame(frame) {
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || doc.getElementById(STYLE_ID)) return;
      const style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .brand-img,.brand-mark{
          width:auto!important;height:72px!important;max-height:72px!important;
          max-width:180px!important;object-fit:contain!important;flex:0 0 auto!important;
        }
        .brand,.site-brand-wrap{display:flex!important;align-items:center!important;gap:12px!important}
        @media(max-width:700px){
          .brand-img,.brand-mark{height:62px!important;max-height:62px!important;max-width:145px!important}
        }
      `;
      doc.head.appendChild(style);
    } catch (_) {}
  }

  function install() {
    ["sitePreview","fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame) return;
      if (!frame.dataset.siteziLogoBound) {
        frame.dataset.siteziLogoBound = "1";
        frame.addEventListener("load", () => setTimeout(() => enhanceFrame(frame), 30));
      }
      enhanceFrame(frame);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
  setInterval(install, 800);
})();
