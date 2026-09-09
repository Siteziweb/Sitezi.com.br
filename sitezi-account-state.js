/* =========================================================
   SITEZI — ESTADO DA CONTA v2.3
   - exibe UM saldo unificado de créditos para o cliente
   - mantém saldos internos separados apenas para controle técnico
   - NÃO sobrescreve rascunhos/sites publicados
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
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const $ = id => document.getElementById(id);
  let currentUser = null;

  const style = document.createElement("style");
  style.id = "sitezi-account-state-style";
  style.textContent = `
    .sitezi-creditbar{
      display:none;align-items:center;gap:8px;min-height:34px;padding:7px 10px;
      border:1px solid #173b66;border-radius:999px;
      background:linear-gradient(180deg,#0a192a,#07111e);
      color:#dbeaff;font-family:Inter,Arial,sans-serif;
      font-size:11px;font-weight:800;white-space:nowrap
    }
    .sitezi-creditbar.visible{display:flex}
    .sitezi-credit-dot{
      width:7px;height:7px;border-radius:50%;background:#2da8ff;
      box-shadow:0 0 0 4px rgba(45,168,255,.12);flex:0 0 auto
    }
    .sitezi-credit-item{color:#a9c2dd}
    .sitezi-credit-item b{color:#fff}
    .sitezi-creditbar.no-plan .sitezi-credit-dot{background:#76869a;box-shadow:none}

    #siteziTopCredits{margin-left:auto;margin-right:8px}
    .wizard-head #siteziWizardCredits{margin-left:auto;margin-right:10px}
    .result-top #siteziResultCredits{margin-left:auto;margin-right:10px}

    @media(max-width:850px){
      .wizard-head{flex-wrap:wrap}
      .wizard-head #siteziWizardCredits.visible{
        order:3;width:100%;box-sizing:border-box;justify-content:center;
        margin:6px 0 0!important
      }
      .topbar #siteziTopCredits.visible{
        display:flex!important;margin-left:auto;margin-right:4px;padding:6px 8px;
        gap:5px;min-height:32px;font-size:9.5px;max-width:180px;overflow:hidden
      }
      .topbar #siteziTopCredits .sitezi-credit-dot{display:none}
      .topbar #siteziTopCredits .sitezi-plan{
        max-width:72px;overflow:hidden;text-overflow:ellipsis
      }
      .wizard-head #siteziWizardCredits{
        margin-left:auto;margin-right:2px;padding:6px 8px;gap:6px;font-size:10px
      }
      .wizard-head #siteziWizardCredits .sitezi-plan{display:none}
      .result-top #siteziResultCredits.visible{
        display:flex!important;margin-left:auto;margin-right:8px;padding:6px 8px;
        gap:5px;min-height:32px;font-size:9.5px;max-width:185px;overflow:hidden
      }
      .result-top #siteziResultCredits .sitezi-credit-dot{display:none}
      .result-top #siteziResultCredits .sitezi-plan{display:none}
    }

    @media(max-width:560px){
      .topbar #siteziTopCredits.visible{
        max-width:150px;font-size:9px;padding:5px 7px
      }
      .topbar #siteziTopCredits .sitezi-plan{max-width:58px}
      .topbar #siteziTopCredits .sitezi-credit-item{font-size:9px}
      .result-top #siteziResultCredits.visible{
        max-width:160px;font-size:9px;padding:5px 7px
      }
      .result-top #siteziResultCredits .sitezi-credit-item{font-size:9px}
    }
  `;
  document.head.appendChild(style);

  function makeBar(id) {
    const el = document.createElement("div");
    el.id = id;
    el.className = "sitezi-creditbar";
    el.innerHTML = `
      <span class="sitezi-credit-dot"></span>
      <span class="sitezi-plan">Créditos SITEZI</span>
      <span class="sitezi-credit-item">Carregando...</span>
    `;
    return el;
  }

  function install() {
    const top = document.querySelector(".topbar");
    if (top && !$("siteziTopCredits")) {
      const b = makeBar("siteziTopCredits");
      const create = $("topCreate");
      if (create && create.parentElement === top) top.insertBefore(b, create);
      else top.appendChild(b);
    }

    const head = document.querySelector(".wizard-head");
    if (head && !$("siteziWizardCredits")) {
      const b = makeBar("siteziWizardCredits");
      const actions = $("wizardLogin")?.parentElement;
      if (actions && actions.parentElement === head) head.insertBefore(b, actions);
      else head.appendChild(b);
    }

    const result = document.querySelector(".result-top");
    if (result && !$("siteziResultCredits")) {
      const b = makeBar("siteziResultCredits");
      const create = $("newSite");
      if (create && create.parentElement === result) result.insertBefore(b, create);
      else result.appendChild(b);
    }
  }

  function unifiedCredits(info) {
    if (!info?.active) return 0;

    // O cliente enxerga apenas um saldo.
    // Internamente continuamos com image/logo/director separados.
    return Math.max(
      0,
      Number(info.director || 0) +
      Number(info.images || 0) +
      Number(info.logos || 0)
    );
  }

  function render(info) {
    const total = unifiedCredits(info);

    [
      $("siteziTopCredits"),
      $("siteziWizardCredits"),
      $("siteziResultCredits")
    ].filter(Boolean).forEach(bar => {
      if (!currentUser) {
        bar.classList.remove("visible");
        return;
      }

      bar.classList.add("visible");
      bar.classList.toggle("no-plan", !info?.active);

      if (!info?.active) {
        bar.innerHTML = `
          <span class="sitezi-credit-dot"></span>
          <span class="sitezi-plan">Créditos SITEZI</span>
          <span class="sitezi-credit-item">Sem plano</span>
        `;
        return;
      }

      bar.innerHTML = `
        <span class="sitezi-credit-dot"></span>
        <span class="sitezi-plan">${info.plan || "Plano ativo"}</span>
        <span class="sitezi-credit-item"><b>✦ ${total}</b> créditos</span>
      `;
    });
  }

  async function refresh() {
    if (!currentUser) {
      render(null);
      return null;
    }

    const [bal, sub] = await Promise.all([
      client
        .from("ai_balances")
        .select("image_credits,logo_credits,director_credits,reset_at")
        .eq("user_id", currentUser.id)
        .maybeSingle(),
      client.rpc("get_my_sitezi_subscription")
    ]);

    if (sub.error) {
      console.warn("[SITEZI ACCOUNT] Falha ao consultar assinatura centralizada.", sub.error);
    }

    const s =
      sub.data && typeof sub.data === "object"
        ? sub.data
        : { active: false, plan: null, current_period_end: null };

    const info = {
      active: s.active === true,
      plan: s.plan || "",
      images: bal.data?.image_credits ?? 0,
      logos: bal.data?.logo_credits ?? 0,
      director: bal.data?.director_credits ?? 0,
      resetAt: bal.data?.reset_at || s.current_period_end || null
    };

    info.credits = unifiedCredits(info);

    render(info);

    window.dispatchEvent(new CustomEvent("sitezi:account-info", {
      detail: info
    }));

    return info;
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

  window.SITEZI_ACCOUNT_STATE = { refresh };

  document.documentElement.dataset.siteziAccountState = "2.3";
})();
