/* =========================================================
   SITEZI — POSIÇÃO DO SUPORTE v3.7
   - NÃO altera conta, créditos, planos, criador ou publicação
   - apenas reposiciona os botões de suporte criados pela v3.6
   - HOME: ao lado direito da faixa "Sites profissionais em minutos"
   - CRIADOR/RESULTADO: encaixado no lado direito da barra de créditos
   ========================================================= */

(() => {
  "use strict";

  const STYLE_ID = "sitezi-support-layout-v37";
  const READY_CLASS = "sitezi-support-positioned-v37";
  let screenObserver = null;
  let retryTimer = null;
  let retries = 0;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Evita qualquer flash do suporte junto da logo antes do reposicionamento */
      #siteziTopSupport:not(.${READY_CLASS}),
      #siteziWizardSupport:not(.${READY_CLASS}){
        visibility:hidden!important;
      }

      .sitezi-home-pill-row-v37{
        display:flex!important;
        align-items:center!important;
        gap:12px!important;
        width:100%!important;
        max-width:100%!important;
      }

      .sitezi-home-pill-row-v37 > .pill{
        flex:0 1 auto!important;
        min-width:0!important;
        margin:0!important;
      }

      .sitezi-home-pill-row-v37 .sitezi-top-support{
        flex:0 0 auto!important;
        min-width:34px!important;
        padding:0 1px!important;
        gap:1px!important;
        margin:0!important;
      }

      .sitezi-home-pill-row-v37 .sitezi-top-support-icon{
        width:24px!important;
        height:24px!important;
        box-shadow:0 5px 12px rgba(0,0,0,.18)!important;
      }

      .sitezi-home-pill-row-v37 .sitezi-top-support-icon svg{
        width:12px!important;
        height:12px!important;
      }

      .sitezi-home-pill-row-v37 .sitezi-top-support-label{
        font-size:7px!important;
        line-height:1!important;
      }

      #siteziWizardCredits.sitezi-support-host-v37,
      #siteziResultCredits.sitezi-support-host-v37{
        position:relative!important;
        overflow:visible!important;
        justify-content:center!important;
        padding-left:48px!important;
        padding-right:48px!important;
        min-height:46px!important;
      }

      #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support,
      #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support{
        position:absolute!important;
        right:8px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        min-width:30px!important;
        padding:0!important;
        gap:1px!important;
        margin:0!important;
        z-index:3!important;
      }

      #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support:hover,
      #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support:hover{
        transform:translateY(-50%)!important;
      }

      #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-icon,
      #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-icon{
        width:22px!important;
        height:22px!important;
        box-shadow:0 4px 10px rgba(0,0,0,.18)!important;
      }

      #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-icon svg,
      #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-icon svg{
        width:11px!important;
        height:11px!important;
      }

      #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-label,
      #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-label{
        font-size:7px!important;
        line-height:1!important;
      }

      @media(max-width:560px){
        .sitezi-home-pill-row-v37{
          gap:9px!important;
        }

        .sitezi-home-pill-row-v37 .sitezi-top-support-icon{
          width:23px!important;
          height:23px!important;
        }

        #siteziWizardCredits.sitezi-support-host-v37,
        #siteziResultCredits.sitezi-support-host-v37{
          padding-left:44px!important;
          padding-right:44px!important;
          min-height:44px!important;
        }

        #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support,
        #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support{
          right:7px!important;
        }

        #siteziWizardCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-icon,
        #siteziResultCredits.sitezi-support-host-v37 > .sitezi-top-support .sitezi-top-support-icon{
          width:21px!important;
          height:21px!important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function stopParentAccountClick(button) {
    if (!button || button.dataset.siteziSupportStopBound === "1") return;

    button.dataset.siteziSupportStopBound = "1";

    button.addEventListener("click", event => {
      event.stopPropagation();
    });

    button.addEventListener("keydown", event => {
      event.stopPropagation();
    });
  }

  function ensureHomeRow() {
    const home = document.getElementById("home");
    const pill = home?.querySelector(".home-copy > .pill, .home-copy .pill");
    if (!pill) return null;

    let row = document.getElementById("siteziHomeSupportRow");
    if (row) return row;

    row = document.createElement("div");
    row.id = "siteziHomeSupportRow";
    row.className = "sitezi-home-pill-row-v37";

    pill.parentElement.insertBefore(row, pill);
    row.appendChild(pill);

    return row;
  }

  function activeScreenId() {
    return document.querySelector(".screen.active")?.id || "";
  }

  function placeSupport() {
    const topSupport = document.getElementById("siteziTopSupport");
    const wizardSupport = document.getElementById("siteziWizardSupport");
    const homeRow = ensureHomeRow();
    const wizardCredits = document.getElementById("siteziWizardCredits");
    const resultCredits = document.getElementById("siteziResultCredits");
    const screen = activeScreenId();

    if (topSupport && homeRow && topSupport.parentElement !== homeRow) {
      homeRow.appendChild(topSupport);
    }

    if (topSupport) {
      topSupport.classList.add(READY_CLASS);
      stopParentAccountClick(topSupport);
    }

    if (wizardSupport) {
      stopParentAccountClick(wizardSupport);

      if (screen === "result" && resultCredits) {
        resultCredits.classList.add("sitezi-support-host-v37");
        if (wizardSupport.parentElement !== resultCredits) {
          resultCredits.appendChild(wizardSupport);
        }
        wizardSupport.classList.add(READY_CLASS);
        wizardSupport.hidden = false;
      } else if (screen === "wizard" && wizardCredits) {
        wizardCredits.classList.add("sitezi-support-host-v37");
        if (wizardSupport.parentElement !== wizardCredits) {
          wizardCredits.appendChild(wizardSupport);
        }
        wizardSupport.classList.add(READY_CLASS);
        wizardSupport.hidden = false;
      } else {
        wizardSupport.hidden = true;
        wizardSupport.classList.add(READY_CLASS);
      }
    }

    /* Se saímos do resultado/criador, remove apenas a marca visual do host antigo. */
    if (screen !== "wizard") wizardCredits?.classList.remove("sitezi-support-host-v37");
    if (screen !== "result") resultCredits?.classList.remove("sitezi-support-host-v37");

    return !!(topSupport && homeRow && wizardSupport && wizardCredits);
  }

  function installScreenObserver() {
    if (screenObserver) return;

    const screens = [...document.querySelectorAll(".screen")];
    if (!screens.length) return;

    screenObserver = new MutationObserver(() => {
      requestAnimationFrame(placeSupport);
    });

    screens.forEach(screen => {
      screenObserver.observe(screen, {
        attributes: true,
        attributeFilter: ["class"]
      });
    });

    window.addEventListener("resize", () => requestAnimationFrame(placeSupport), { passive: true });
    window.addEventListener("pageshow", () => requestAnimationFrame(placeSupport));

    window.addEventListener("sitezi:auth-state", () => requestAnimationFrame(placeSupport));
    window.addEventListener("sitezi:account-info", () => requestAnimationFrame(placeSupport));
  }

  function boot() {
    installStyle();
    installScreenObserver();

    if (placeSupport()) {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      return;
    }

    if (retries >= 40) return;
    retries += 1;
    retryTimer = setTimeout(boot, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  document.documentElement.dataset.siteziSupportLayout = "3.7";
})();
