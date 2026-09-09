/* =========================================================
   SITEZI — LOGO VISÍVEL v2.2
   Correção adaptativa:
   - se a IA retornar logo horizontal com nome embutido, usa a imagem inteira;
   - se a IA retornar somente símbolo/quadrado, monta símbolo + nome em texto real;
   - evita nome duplicado no cabeçalho;
   - mantém upload de logo e modo texto intactos.
   ========================================================= */
(() => {
  "use strict";

  const STYLE_ID = "sitezi-customer-logo-size-v22";

  function getState() {
    return window.SITEZI_BUILDER_STATE || {};
  }

  function ensureStyle(doc) {
    if (!doc?.head || doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .brand,.site-brand-wrap{
        display:flex!important;
        align-items:center!important;
        gap:10px!important;
        min-width:0!important;
      }

      /* Logo horizontal completa gerada pela IA */
      .sitezi-ai-full-logo{
        width:auto!important;
        height:auto!important;
        max-height:54px!important;
        max-width:190px!important;
        object-fit:contain!important;
        object-position:left center!important;
        flex:0 1 auto!important;
      }

      /* Símbolo isolado gerado pela IA */
      .sitezi-ai-symbol{
        width:52px!important;
        height:52px!important;
        max-width:52px!important;
        max-height:52px!important;
        object-fit:contain!important;
        object-position:center!important;
        flex:0 0 52px!important;
      }

      .sitezi-ai-brand-name{
        display:block!important;
        min-width:0!important;
        max-width:230px!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
        font:900 20px/1.05 Inter,Arial,sans-serif!important;
        letter-spacing:-.45px!important;
        color:inherit!important;
      }

      @media(max-width:700px){
        .sitezi-ai-full-logo{
          max-height:46px!important;
          max-width:155px!important;
        }

        .sitezi-ai-symbol{
          width:44px!important;
          height:44px!important;
          max-width:44px!important;
          max-height:44px!important;
          flex-basis:44px!important;
        }

        .sitezi-ai-brand-name{
          max-width:155px!important;
          font-size:17px!important;
          letter-spacing:-.3px!important;
        }
      }

      @media(max-width:390px){
        .sitezi-ai-full-logo{max-width:140px!important}
        .sitezi-ai-brand-name{max-width:130px!important;font-size:16px!important}
      }
    `;

    doc.head.appendChild(style);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function getBrand(img) {
    return (
      img?.closest?.("header .brand") ||
      img?.closest?.(".nav .brand") ||
      img?.closest?.(".navin .brand") ||
      img?.closest?.(".site-brand-wrap") ||
      img?.closest?.(".brand")
    );
  }

  function removeInjectedName(brand) {
    brand?.querySelectorAll?.(".sitezi-ai-brand-name").forEach(el => el.remove());
  }

  function removeExactDuplicateOutsideBrand(doc, brand, businessName) {
    const wanted = normalizeText(businessName);
    if (!wanted || !brand) return;

    const header =
      brand.closest("header") ||
      brand.closest(".nav") ||
      brand.closest(".navin");

    if (!header) return;

    header.querySelectorAll("span,strong,b,h1,h2,h3,p,a,div").forEach(el => {
      if (brand.contains(el)) return;
      if (el.children.length) return;
      if (normalizeText(el.textContent) !== wanted) return;

      el.style.setProperty("display", "none", "important");
      el.setAttribute("aria-hidden", "true");
      el.dataset.siteziDuplicateBrand = "1";
    });
  }

  function useAsFullLogo(doc, brand, img, state) {
    removeInjectedName(brand);

    img.classList.remove("sitezi-ai-symbol");
    img.classList.add("sitezi-ai-full-logo");
    img.setAttribute("alt", state.businessName || "Logo");

    brand.setAttribute("aria-label", state.businessName || "Logo");
    removeExactDuplicateOutsideBrand(doc, brand, state.businessName);
  }

  function useAsSymbol(doc, brand, img, state) {
    img.classList.remove("sitezi-ai-full-logo");
    img.classList.add("sitezi-ai-symbol");
    img.setAttribute("alt", "");
    img.setAttribute("aria-hidden", "true");

    let name = brand.querySelector(".sitezi-ai-brand-name");
    if (!name) {
      name = doc.createElement("span");
      name.className = "sitezi-ai-brand-name";
      brand.appendChild(name);
    }

    name.textContent = state.businessName || "";
    brand.setAttribute("aria-label", state.businessName || "");
    removeExactDuplicateOutsideBrand(doc, brand, state.businessName);
  }

  function classifyAndCompose(doc, img, state) {
    const brand = getBrand(img);
    if (!brand) return;

    const apply = () => {
      const w = img.naturalWidth || img.width || 1;
      const h = img.naturalHeight || img.height || 1;
      const ratio = w / Math.max(1, h);

      /*
       * Logos que já vieram da IA em formato horizontal normalmente
       * possuem símbolo + nome dentro da própria imagem.
       * Acima de 1.35 usamos a imagem inteira e NÃO repetimos o nome.
       */
      if (ratio >= 1.35) {
        useAsFullLogo(doc, brand, img, state);
      } else {
        useAsSymbol(doc, brand, img, state);
      }
    };

    if (img.complete && img.naturalWidth) {
      apply();
    } else {
      img.addEventListener("load", apply, { once: true });
    }
  }

  function enhanceFrame(frame) {
    if (!frame) return;

    try {
      const doc = frame.contentDocument;
      if (!doc?.head) return;

      ensureStyle(doc);

      const state = getState();
      if (!state.aiLogoGenerated || !state.logoData) return;

      const img = doc.querySelector(".brand-mark-ai,.brand-img,.brand-mark");
      if (!img) return;

      classifyAndCompose(doc, img, state);
    } catch (_) {}
  }

  function install() {
    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = document.getElementById(id);
      if (!frame) return;

      if (!frame.dataset.siteziLogoBoundV22) {
        frame.dataset.siteziLogoBoundV22 = "1";
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
