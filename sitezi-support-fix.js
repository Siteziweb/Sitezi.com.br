/* =========================================================
   SITEZI — AJUSTE FINO DO SUPORTE v3.6
   - deixa o suporte do cabeçalho menor e mais discreto
   - evita o "flash" do botão verde antigo ao trocar de telas
   - não altera criador, conta, créditos, planos ou Meus Sites
   ========================================================= */

(() => {
  "use strict";

  const STYLE_ID = "sitezi-support-fine-tune-v36";
  const HIDDEN_ATTR = "data-sitezi-hidden-legacy-support";

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Suporte novo: menor e mais discreto */
      .sitezi-top-support{
        min-width:40px!important;
        gap:2px!important;
        padding:0 3px!important;
      }

      .sitezi-top-support-icon{
        width:28px!important;
        height:28px!important;
        box-shadow:0 7px 16px rgba(0,0,0,.20)!important;
      }

      .sitezi-top-support-icon svg{
        width:14px!important;
        height:14px!important;
      }

      .sitezi-top-support-label{
        font-size:8px!important;
        line-height:1!important;
        font-weight:800!important;
      }

      /* Qualquer suporte antigo identificado fica invisível de forma permanente.
         Mantemos o elemento no DOM para não quebrar a integração existente. */
      [${HIDDEN_ATTR}="1"]{
        opacity:0!important;
        pointer-events:none!important;
        transform:scale(.01)!important;
        right:-250px!important;
      }

      @media(max-width:560px){
        .sitezi-top-support{
          min-width:38px!important;
          padding:0 2px!important;
        }

        .sitezi-top-support-icon{
          width:26px!important;
          height:26px!important;
        }

        .sitezi-top-support-icon svg{
          width:13px!important;
          height:13px!important;
        }

        .sitezi-top-support-label{
          font-size:8px!important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function textHint(el) {
    return [
      el.getAttribute?.("aria-label"),
      el.getAttribute?.("title"),
      el.getAttribute?.("href"),
      el.id,
      typeof el.className === "string" ? el.className : "",
      (el.textContent || "").trim().slice(0, 80)
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isLegacySupportCandidate(el) {
    if (!(el instanceof HTMLElement)) return false;

    if (
      el.classList.contains("sitezi-top-support") ||
      el.closest(".sitezi-top-support, #siteziAccountQuickMenu, #siteziOwnerPanel") ||
      el.id === "siteziOwnerButton"
    ) {
      return false;
    }

    if (el.getAttribute(HIDDEN_ATTR) === "1") return true;

    const cs = getComputedStyle(el);
    if (cs.position !== "fixed") return false;
    if (cs.display === "none" || cs.visibility === "hidden") return false;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    const nearRight = window.innerWidth - rect.right <= 55;
    const sizeOk =
      rect.width >= 34 && rect.width <= 115 &&
      rect.height >= 34 && rect.height <= 115;
    const roughlySquare = Math.abs(rect.width - rect.height) <= 28;
    const verticalZone = rect.top >= 55 && rect.top <= 430;

    if (!(nearRight && sizeOk && roughlySquare && verticalZone)) return false;

    const hint = textHint(el);
    const explicitHint = /whats|wa\.me|suporte|support|ajuda|help|chat/.test(hint);

    const background = `${cs.backgroundColor || ""} ${cs.backgroundImage || ""}`.toLowerCase();
    const greenHint =
      /25d366|1dc85d|14aa4a|00c853|16a34a/.test(background) ||
      (() => {
        const m = (cs.backgroundColor || "").match(
          /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/
        );
        if (!m) return false;
        const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
        return g > r * 1.45 && g > b * 1.15 && g >= 105;
      })();

    return explicitHint || greenHint;
  }

  function hideCandidate(el) {
    if (!isLegacySupportCandidate(el)) return false;

    el.setAttribute(HIDDEN_ATTR, "1");
    el.setAttribute("aria-hidden", "true");
    return true;
  }

  function scanRoot(root) {
    if (!(root instanceof Element)) return;

    hideCandidate(root);

    const candidates = root.querySelectorAll(
      'a,button,iframe,[role="button"],[aria-label*="Whats" i],[aria-label*="support" i],[aria-label*="suporte" i]'
    );

    for (const el of candidates) hideCandidate(el);
  }

  function scanPage() {
    if (!document.body) return;
    scanRoot(document.body);
  }

  function installGuard() {
    if (!document.body || window.__SITEZI_SUPPORT_GUARD_V36__) return;
    window.__SITEZI_SUPPORT_GUARD_V36__ = true;

    scanPage();

    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "childList") {
          for (const node of record.addedNodes) {
            if (node instanceof Element) scanRoot(node);
          }
          continue;
        }

        if (record.type === "attributes" && record.target instanceof HTMLElement) {
          hideCandidate(record.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"]
    });

    const rescan = () => queueMicrotask(scanPage);

    window.addEventListener("pageshow", rescan);
    window.addEventListener("popstate", rescan);
    window.addEventListener("hashchange", rescan);

    document.addEventListener("click", event => {
      const trigger = event.target.closest?.(
        "#seeExample, [data-example], [data-back], .preview-back, #brandHome, #cancelWizard"
      );
      if (trigger) rescan();
    }, true);
  }

  installStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installGuard, { once: true });
  } else {
    installGuard();
  }

  document.documentElement.dataset.siteziSupportFineTune = "3.6";
})();
