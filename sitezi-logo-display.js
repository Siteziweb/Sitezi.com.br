/* =========================================================
   SITEZI — LOGO MAIS VISÍVEL v1.0
   Ajusta a logo nos previews do criador sem alterar script.js.
   ========================================================= */
(() => {
  "use strict";

  const STYLE_ID = "sitezi-customer-logo-size";

  function enhanceFrame(frame) {
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc?.head || doc.getElementById(STYLE_ID)) return;

      const style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .nav{min-height:92px!important;height:auto!important}
        .brand-img{
          width:auto!important;
          height:68px!important;
          max-height:68px!important;
          max-width:190px!important;
          object-fit:contain!important;
        }
        @media(max-width:700px){
          .nav{min-height:80px!important}
          .brand-img{
            height:56px!important;
            max-height:56px!important;
            max-width:150px!important;
          }
        }
      `;
      doc.head.appendChild(style);
    } catch (_) {}
  }

  function install() {
    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame) return;
      frame.addEventListener("load", () => setTimeout(() => enhanceFrame(frame), 30));
      enhanceFrame(frame);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  // O srcdoc pode ser recriado quando o cliente altera o site.
  setInterval(install, 900);
})();
