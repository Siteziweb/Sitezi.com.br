/* =========================================================
   SITEZI — ESTADO DA CONTA v3.2
   - UM saldo real de créditos SITEZI
   - usa ai_balances.ai_credits como carteira única
   - não soma mais carteiras técnicas separadas
   - carrega o módulo Meus Sites + Autosave de forma isolada
   - corrige o botão flutuante do WhatsApp no desktop/mobile
   ========================================================= */
(async () => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";

  let createClient;
  try {
    ({ createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"));
  } catch (e) {
    console.error("[SITEZI ACCOUNT]", e);
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = id => document.getElementById(id);
  let currentUser = null;
  let lastInfo = null;

  const style = document.createElement("style");
  style.id = "sitezi-account-state-style";
  style.textContent = `
    .sitezi-creditbar{display:none;align-items:center;gap:8px;min-height:34px;padding:7px 10px;border:1px solid #173b66;border-radius:999px;background:linear-gradient(180deg,#0a192a,#07111e);color:#dbeaff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:800;white-space:nowrap}
    .sitezi-creditbar.visible{display:flex}.sitezi-credit-dot{width:7px;height:7px;border-radius:50%;background:#2da8ff;box-shadow:0 0 0 4px rgba(45,168,255,.12);flex:0 0 auto}.sitezi-credit-item{color:#a9c2dd}.sitezi-credit-item b{color:#fff}.sitezi-creditbar.no-plan .sitezi-credit-dot{background:#76869a;box-shadow:none}
    #siteziTopCredits{margin-left:auto;margin-right:8px}.wizard-head #siteziWizardCredits{margin-left:auto;margin-right:10px}.result-top #siteziResultCredits{margin-left:auto;margin-right:10px}
    @media(max-width:850px){.wizard-head{flex-wrap:wrap}.wizard-head #siteziWizardCredits.visible{order:3;width:100%;box-sizing:border-box;justify-content:center;margin:6px 0 0!important}.topbar #siteziTopCredits.visible{display:flex!important;margin-left:auto;margin-right:4px;padding:6px 8px;gap:5px;min-height:32px;font-size:9.5px;max-width:180px;overflow:hidden}.topbar #siteziTopCredits .sitezi-credit-dot{display:none}.topbar #siteziTopCredits .sitezi-plan{max-width:72px;overflow:hidden;text-overflow:ellipsis}.wizard-head #siteziWizardCredits{margin-left:auto;margin-right:2px;padding:6px 8px;gap:6px;font-size:10px}.wizard-head #siteziWizardCredits .sitezi-plan{display:none}.result-top #siteziResultCredits.visible{display:flex!important;margin-left:auto;margin-right:8px;padding:6px 8px;gap:5px;min-height:32px;font-size:9.5px;max-width:185px;overflow:hidden}.result-top #siteziResultCredits .sitezi-credit-dot{display:none}.result-top #siteziResultCredits .sitezi-plan{display:none}}
    @media(max-width:560px){.topbar #siteziTopCredits.visible{max-width:150px;font-size:9px;padding:5px 7px}.topbar #siteziTopCredits .sitezi-plan{max-width:58px}.topbar #siteziTopCredits .sitezi-credit-item{font-size:9px}.result-top #siteziResultCredits.visible{max-width:160px;font-size:9px;padding:5px 7px}.result-top #siteziResultCredits .sitezi-credit-item{font-size:9px}}
  `;
  document.head.appendChild(style);

  function makeBar(id) {
    const el = document.createElement("div");
    el.id = id;
    el.className = "sitezi-creditbar";
    el.innerHTML = `<span class="sitezi-credit-dot"></span><span class="sitezi-plan">Créditos SITEZI</span><span class="sitezi-credit-item">Carregando...</span>`;
    return el;
  }

  function install() {
    const top = document.querySelector(".topbar");
    if (top && !$("#siteziTopCredits")) {
      const b = makeBar("siteziTopCredits");
      const create = $("#topCreate");
      if (create && create.parentElement === top) top.insertBefore(b, create); else top.appendChild(b);
    }
    const head = document.querySelector(".wizard-head");
    if (head && !$("#siteziWizardCredits")) {
      const b = makeBar("siteziWizardCredits");
      const actions = $("#wizardLogin")?.parentElement;
      if (actions && actions.parentElement === head) head.insertBefore(b, actions); else head.appendChild(b);
    }
    const result = document.querySelector(".result-top");
    if (result && !$("#siteziResultCredits")) {
      const b = makeBar("siteziResultCredits");
      const create = $("#newSite");
      if (create && create.parentElement === result) result.insertBefore(b, create); else result.appendChild(b);
    }
  }

  function render(info) {
    [$("#siteziTopCredits"), $("#siteziWizardCredits"), $("#siteziResultCredits")].filter(Boolean).forEach(bar => {
      if (!currentUser) { bar.classList.remove("visible"); return; }
      bar.classList.add("visible");
      bar.classList.toggle("no-plan", !info?.active);
      if (!info?.active) {
        bar.innerHTML = `<span class="sitezi-credit-dot"></span><span class="sitezi-plan">Créditos SITEZI</span><span class="sitezi-credit-item">Sem plano</span>`;
        return;
      }
      bar.innerHTML = `<span class="sitezi-credit-dot"></span><span class="sitezi-plan">${info.plan || "Plano ativo"}</span><span class="sitezi-credit-item"><b>✦ ${Math.max(0, Number(info.credits || 0))}</b> créditos</span>`;
    });
  }

  async function refresh() {
    if (!currentUser) { lastInfo = null; render(null); return null; }

    const [bal, sub] = await Promise.all([
      client.from("ai_balances").select("ai_credits,reset_at").eq("user_id", currentUser.id).maybeSingle(),
      client.rpc("get_my_sitezi_subscription")
    ]);

    if (bal.error) console.warn("[SITEZI ACCOUNT] Falha ao consultar créditos.", bal.error);
    if (sub.error) console.warn("[SITEZI ACCOUNT] Falha ao consultar assinatura.", sub.error);

    const s = sub.data && typeof sub.data === "object" ? sub.data : { active: false, plan: null, current_period_end: null };
    lastInfo = {
      active: s.active === true,
      plan: s.plan || "",
      credits: Math.max(0, Number(bal.data?.ai_credits ?? 0)),
      resetAt: bal.data?.reset_at || s.current_period_end || null
    };

    render(lastInfo);
    window.dispatchEvent(new CustomEvent("sitezi:account-info", { detail: lastInfo }));
    return lastInfo;
  }

  install();
  const { data } = await client.auth.getSession();
  currentUser = data.session?.user || null;
  await refresh();

  client.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    await refresh();
  });

  window.addEventListener("sitezi:credits-changed", refresh);
  window.addEventListener("sitezi:ai-credit-change", refresh);

  window.SITEZI_ACCOUNT_STATE = { refresh, getInfo: () => lastInfo };
  document.documentElement.dataset.siteziAccountState = "3.2";
})();

/* =========================================================
   Loader isolado do recurso "Meus Sites".
   ========================================================= */
(() => {
  "use strict";
  if (document.querySelector('script[data-sitezi-my-sites-loader="1"]')) return;
  const script = document.createElement("script");
  script.src = "sitezi-my-sites.js?v=1.0";
  script.defer = true;
  script.dataset.siteziMySitesLoader = "1";
  script.onerror = () => console.warn("[SITEZI] Meus Sites ainda não está disponível.");
  document.head.appendChild(script);
})();

/* =========================================================
   SITEZI — CORREÇÃO DO WHATSAPP v1.0
   Desktop: ícone + "Falar no WhatsApp"
   Mobile: somente botão redondo com o ícone do WhatsApp
   ========================================================= */
(() => {
  "use strict";

  const STYLE_ID = "sitezi-whatsapp-final-style";
  const BUTTON_CLASS = "sitezi-whatsapp-final";
  const ICON_CLASS = "sitezi-whatsapp-final-icon";
  const LABEL_CLASS = "sitezi-whatsapp-final-label";

  const whatsappSvg = `
    <span class="${ICON_CLASS}" aria-hidden="true">
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <path fill="currentColor" d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
      </svg>
    </span>`;

  function ensureStyle(doc) {
    if (!doc?.head || doc.getElementById(STYLE_ID)) return;

    const st = doc.createElement("style");
    st.id = STYLE_ID;
    st.textContent = `
      .${BUTTON_CLASS}{
        position:fixed!important;
        right:22px!important;
        top:106px!important;
        bottom:auto!important;
        z-index:999999!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:10px!important;
        min-height:54px!important;
        padding:9px 16px 9px 10px!important;
        border:0!important;
        border-radius:999px!important;
        background:#25D366!important;
        color:#fff!important;
        text-decoration:none!important;
        font:900 14px/1 Inter,Arial,sans-serif!important;
        box-shadow:0 14px 38px rgba(0,0,0,.30)!important;
        -webkit-tap-highlight-color:transparent!important;
      }

      .${ICON_CLASS}{
        width:34px!important;
        height:34px!important;
        display:grid!important;
        place-items:center!important;
        flex:0 0 34px!important;
        color:#fff!important;
      }

      .${ICON_CLASS} svg{
        width:27px!important;
        height:27px!important;
        display:block!important;
        fill:currentColor!important;
      }

      .${LABEL_CLASS}{
        display:inline!important;
        white-space:nowrap!important;
        color:#fff!important;
      }

      @media(max-width:700px){
        .${BUTTON_CLASS}{
          width:56px!important;
          height:56px!important;
          min-width:56px!important;
          min-height:56px!important;
          right:14px!important;
          top:auto!important;
          bottom:18px!important;
          padding:0!important;
          gap:0!important;
          border-radius:50%!important;
        }
        .${ICON_CLASS}{
          width:56px!important;
          height:56px!important;
          flex:0 0 56px!important;
        }
        .${ICON_CLASS} svg{
          width:30px!important;
          height:30px!important;
        }
        .${LABEL_CLASS}{
          display:none!important;
        }
      }
    `;
    doc.head.appendChild(st);
  }

  function looksLikeWhatsapp(el) {
    if (!el || el.nodeType !== 1) return false;

    const href = String(el.getAttribute?.("href") || "").toLowerCase();
    const info = [
      el.id || "",
      String(el.className || ""),
      el.getAttribute?.("aria-label") || "",
      el.getAttribute?.("title") || "",
      el.textContent || ""
    ].join(" ").toLowerCase();

    return (
      href.includes("wa.me/") ||
      href.includes("api.whatsapp.com") ||
      href.includes("whatsapp.com/send") ||
      info.includes("whatsapp")
    );
  }

  function convert(el, doc) {
    if (!el || !looksLikeWhatsapp(el)) return;

    ensureStyle(doc);

    el.classList.add(BUTTON_CLASS);
    el.setAttribute("aria-label", "Falar no WhatsApp");

    if (el.tagName === "A") {
      el.target = "_blank";
      el.rel = "noopener";
    }

    el.innerHTML =
      whatsappSvg +
      `<span class="${LABEL_CLASS}">Falar no WhatsApp</span>`;
  }

  function scan(doc = document) {
    try {
      ensureStyle(doc);

      const all = [...doc.querySelectorAll("a,button")].filter(looksLikeWhatsapp);
      if (!all.length) return;

      const floating = all.filter(el => {
        try {
          const css = doc.defaultView?.getComputedStyle(el);
          return (
            css?.position === "fixed" ||
            /float|floating|widget|whats|wa[-_]/i.test(String(el.className || ""))
          );
        } catch (_) {
          return false;
        }
      });

      const targets = floating.length
        ? floating
        : (all.length === 1 ? all : []);

      targets.forEach(el => convert(el, doc));
    } catch (_) {}
  }

  function hookFrame(id) {
    const frame = document.getElementById(id);
    if (!frame) return;

    if (frame.dataset.siteziWhatsappFinal !== "1") {
      frame.dataset.siteziWhatsappFinal = "1";
      frame.addEventListener("load", () => {
        setTimeout(() => {
          try { scan(frame.contentDocument); } catch (_) {}
        }, 80);
      });
    }

    try { scan(frame.contentDocument); } catch (_) {}
  }

  function installWhatsappFix() {
    scan(document);
    hookFrame("sitePreview");
    hookFrame("fullPreviewFrame");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installWhatsappFix, { once:true });
  } else {
    installWhatsappFix();
  }

  const observer = new MutationObserver(() => installWhatsappFix());
  observer.observe(document.documentElement, {
    childList:true,
    subtree:true
  });

  setInterval(installWhatsappFix, 1200);
})();
