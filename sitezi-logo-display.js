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


/* =========================================================
   SITEZI — SUPORTE WHATSAPP v1.0
   - aparece durante criação/resultado/planos;
   - fica oculto somente na home;
   - abre conversa direta com o desenvolvedor;
   - mensagem pronta para contextualizar o atendimento.
   ========================================================= */
(() => {
  "use strict";

  const SUPPORT_ID = "siteziWhatsappSupport";
  const STYLE_ID = "sitezi-whatsapp-support-style-v1";
  const PHONE = "5548996942186";
  const MESSAGE = "Olá! Estou usando o SITEZI e preciso de ajuda com meu site.";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${SUPPORT_ID}{
        position:fixed;
        left:16px;
        bottom:18px;
        z-index:9997;
        display:none;
        align-items:center;
        gap:9px;
        min-height:44px;
        padding:9px 13px 9px 10px;
        border:1px solid rgba(255,255,255,.14);
        border-radius:999px;
        background:#16a34a;
        color:#fff;
        box-shadow:0 12px 34px rgba(0,0,0,.28);
        text-decoration:none;
        font:800 12px/1.1 Inter,Arial,sans-serif;
        transition:.18s ease;
      }

      #${SUPPORT_ID}.visible{display:flex}

      #${SUPPORT_ID}:hover{
        transform:translateY(-2px);
        filter:brightness(1.04);
      }

      #${SUPPORT_ID} .sitezi-wa-icon{
        width:27px;
        height:27px;
        border-radius:50%;
        display:grid;
        place-items:center;
        flex:0 0 27px;
        background:#fff;
        color:#16a34a;
        font-size:16px;
        font-weight:950;
      }

      #${SUPPORT_ID} .sitezi-wa-copy{
        display:grid;
        gap:1px;
        white-space:nowrap;
      }

      #${SUPPORT_ID} .sitezi-wa-copy b{
        font-size:12px;
        line-height:1.1;
      }

      #${SUPPORT_ID} .sitezi-wa-copy small{
        color:rgba(255,255,255,.82);
        font-size:9.5px;
        font-weight:700;
      }

      body.result-open #${SUPPORT_ID}{
        bottom:88px;
      }

      body.plans-open #${SUPPORT_ID}{
        bottom:18px;
      }

      body:has(.full-preview-screen:not(.hidden)) #${SUPPORT_ID}{
        bottom:16px;
      }

      @media(max-width:600px){
        #${SUPPORT_ID}{
          left:10px;
          bottom:12px;
          min-height:40px;
          padding:7px 10px 7px 8px;
          gap:7px;
        }

        #${SUPPORT_ID} .sitezi-wa-icon{
          width:25px;
          height:25px;
          flex-basis:25px;
          font-size:14px;
        }

        #${SUPPORT_ID} .sitezi-wa-copy b{font-size:11px}
        #${SUPPORT_ID} .sitezi-wa-copy small{display:none}

        body.result-open #${SUPPORT_ID}{
          bottom:94px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureButton() {
    let button = document.getElementById(SUPPORT_ID);
    if (button) return button;

    button = document.createElement("a");
    button.id = SUPPORT_ID;
    button.target = "_blank";
    button.rel = "noopener";
    button.href =
      `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
    button.setAttribute("aria-label", "Precisa de ajuda? Fale no WhatsApp");
    button.innerHTML = `
      <span class="sitezi-wa-icon">✓</span>
      <span class="sitezi-wa-copy">
        <b>Precisa de ajuda?</b>
        <small>Fale no WhatsApp</small>
      </span>
    `;

    document.body.appendChild(button);
    return button;
  }

  function shouldShow() {
    const home = document.getElementById("home");
    const wizard = document.getElementById("wizard");
    const result = document.getElementById("result");
    const plans = document.getElementById("plans");
    const full = document.getElementById("fullPreviewScreen");

    const homeActive = home?.classList.contains("active");
    const wizardActive = wizard?.classList.contains("active");
    const resultActive = result?.classList.contains("active");
    const plansActive = plans?.classList.contains("active");
    const fullOpen = full && !full.classList.contains("hidden");

    if (fullOpen) return true;
    if (wizardActive || resultActive || plansActive) return true;
    if (homeActive) return false;

    return document.body.classList.contains("wizard-open") ||
           document.body.classList.contains("result-open") ||
           document.body.classList.contains("plans-open");
  }

  function refresh() {
    ensureStyle();
    const button = ensureButton();
    button.classList.toggle("visible", shouldShow());
  }

  function install() {
    refresh();

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, {
      attributes:true,
      attributeFilter:["class"],
      subtree:true
    });

    document.addEventListener("click", () => setTimeout(refresh, 0), true);
    window.addEventListener("popstate", refresh);
    window.addEventListener("sitezi:builder-state", refresh);

    setInterval(refresh, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
