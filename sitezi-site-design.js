/* =========================================================
   SITEZI — VISUAL PREMIUM DOS SITES v1.0
   Melhora o layout do preview sem gerar novas imagens/sem custo extra.
   ========================================================= */
(() => {
  "use strict";

  const STYLE_ID = "sitezi-premium-site-design-v1";

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
          width:auto!important;height:68px!important;max-height:68px!important;
          max-width:210px!important;object-fit:contain!important;
        }

        .hero{overflow:hidden!important}
        .hero-copy{padding-top:18px!important;padding-bottom:18px!important}
        .media{box-shadow:0 28px 70px rgba(0,0,0,.28)!important}

        .trust-strip{overflow:hidden!important}
        .trust-item{min-height:72px!important}

        .services{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important}
        .service-card{border-radius:16px!important;overflow:hidden!important}
        .service-photo,.service-visual{height:190px!important}
        .service-visual{
          position:relative!important;overflow:hidden!important;
          background:
            radial-gradient(circle at 82% 18%,var(--accent,#1578ff) 0,transparent 28%),
            linear-gradient(145deg,#17212b,#0b1016)!important;
          color:#fff!important;
        }
        .service-visual:before{
          content:""!important;position:absolute!important;width:160px!important;height:160px!important;
          border-radius:50%!important;border:22px solid rgba(255,255,255,.05)!important;
          right:-42px!important;bottom:-52px!important;
        }
        .service-visual span{position:relative!important;z-index:2!important;font-size:54px!important}
        .service-content{display:flex!important;flex-direction:column!important;min-height:250px!important}
        .service-content p{flex:1!important}
        .service-contact{
          width:100%!important;justify-content:center!important;padding:12px 14px!important;
          border-radius:10px!important;background:var(--accent,#1578ff)!important;color:#fff!important;
        }

        .about-grid{align-items:stretch!important}
        .about-panel{height:100%!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
        .contact-card{border-radius:18px!important}

        @media(max-width:1000px){
          .services{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        }
        @media(max-width:700px){
          .nav{min-height:80px!important}
          .brand-img{height:56px!important;max-height:56px!important;max-width:150px!important}
          .services{grid-template-columns:1fr!important}
          .service-content{min-height:auto!important}
        }
      `;
      doc.head.appendChild(style);
    } catch (_) {}
  }

  function install() {
    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame) return;
      if (!frame.dataset.siteziPremiumListener) {
        frame.dataset.siteziPremiumListener = "1";
        frame.addEventListener("load", () => setTimeout(() => enhanceFrame(frame), 40));
      }
      enhanceFrame(frame);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }

  setInterval(install, 900);
})();
