/* =========================================================
   SITEZI — ESTADO DA CONTA v3.6
   - mantém créditos/assinatura funcionando
   - transforma a barrinha do plano em acesso da conta
   - adiciona menu: Minha conta, Meus Sites, Plano e Sair
   - adiciona suporte no topo, ao lado esquerdo de Minha conta
   - oculta o antigo botão flutuante antes da pintura da tela
   - restaura o detalhe colorido do nome SITEZI no cabeçalho do criador
   - mantém o módulo Meus Sites + Autosave isolado
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
  let legacySupportElement = null;
  const protectedLegacySupport = new WeakSet();
  let legacySupportGuard = null;
  let legacyScanQueued = false;

  const style = document.createElement("style");
  style.id = "sitezi-account-state-style";
  style.textContent = `
    .sitezi-creditbar{
      display:none;align-items:center;gap:8px;min-height:34px;padding:7px 10px;
      border:1px solid #173b66;border-radius:999px;
      background:linear-gradient(180deg,#0a192a,#07111e);
      color:#dbeaff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:800;
      white-space:nowrap;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;
      transition:.18s ease
    }
    .sitezi-creditbar:hover{border-color:#2e73bb;background:linear-gradient(180deg,#0b2138,#081725)}
    .sitezi-creditbar:focus-visible{outline:2px solid #258fff;outline-offset:2px}
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

    .sitezi-top-support{
      display:inline-grid;place-items:center;justify-items:center;gap:2px;
      min-width:40px;padding:0 3px;background:transparent;border:0;color:#f5fbff;
      text-decoration:none;-webkit-tap-highlight-color:transparent
    }
    .sitezi-top-support:hover .sitezi-top-support-icon{transform:translateY(-1px)}
    .sitezi-top-support:focus-visible{outline:2px solid #258fff;outline-offset:3px;border-radius:12px}
    .sitezi-top-support-icon{
      width:28px;height:28px;border-radius:50%;display:grid;place-items:center;
      background:linear-gradient(135deg,#1dc85d,#14aa4a);color:#fff;
      border:1px solid rgba(255,255,255,.16);box-shadow:0 7px 16px rgba(0,0,0,.20);
      transition:transform .16s ease
    }
    .sitezi-top-support-icon svg{width:14px;height:14px;display:block}
    .sitezi-top-support-label{font-size:8px;font-weight:850;line-height:1;color:#ffffffd6}
    .sitezi-brand-accent-z{color:#4dbbff}
    .sitezi-brand-accent-i{color:#ff4a66}

    .sitezi-account-menu-overlay{
      position:fixed;inset:0;z-index:100600;display:grid;align-items:start;justify-items:end;
      padding:88px 18px 18px;background:rgba(0,5,13,.64);backdrop-filter:blur(8px);
      font-family:Inter,Arial,sans-serif
    }
    .sitezi-account-menu-overlay.hidden{display:none}
    .sitezi-account-menu-card{
      width:min(370px,calc(100vw - 28px));overflow:hidden;
      border:1px solid #244568;border-radius:22px;background:#07121f;color:#f7fbff;
      box-shadow:0 28px 85px rgba(0,0,0,.52)
    }
    .sitezi-account-menu-head{
      display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
      padding:20px;border-bottom:1px solid #18304a
    }
    .sitezi-account-menu-head strong{display:block;font-size:20px;letter-spacing:-.5px}
    .sitezi-account-menu-email{
      display:block;margin-top:5px;color:#8ea4bc;font-size:12px;overflow-wrap:anywhere
    }
    .sitezi-account-menu-close{
      width:38px;height:38px;border:1px solid #294663;border-radius:50%;
      background:#0b1a2a;color:#dce9f7;font-size:22px;cursor:pointer;flex:0 0 auto
    }
    .sitezi-account-summary{
      display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 16px
    }
    .sitezi-account-summary-box{
      min-width:0;padding:12px;border:1px solid #1d3958;border-radius:14px;background:#081827
    }
    .sitezi-account-summary-box span{
      display:block;color:#7f95ad;font-size:10px;font-weight:800;text-transform:uppercase;
      letter-spacing:.55px
    }
    .sitezi-account-summary-box b{
      display:block;margin-top:5px;color:#fff;font-size:14px;overflow:hidden;
      text-overflow:ellipsis;white-space:nowrap
    }
    .sitezi-account-menu-actions{display:grid;gap:8px;padding:0 16px 16px}
    .sitezi-account-menu-action{
      width:100%;min-height:48px;display:flex;align-items:center;justify-content:space-between;
      gap:12px;padding:12px 14px;border:1px solid #203d5c;border-radius:13px;
      background:#0a1928;color:#eef6ff;text-align:left;font-weight:850;cursor:pointer
    }
    .sitezi-account-menu-action:hover{border-color:#326da9;background:#0b2137}
    .sitezi-account-menu-action small{display:block;margin-top:3px;color:#7890aa;font-size:10px;font-weight:700}
    .sitezi-account-menu-action .sitezi-menu-arrow{color:#4cb3ff;font-size:18px}
    .sitezi-account-menu-action.danger{color:#ffb1b1;border-color:#4b2e38;background:#1b1117}
    .sitezi-account-menu-action.danger .sitezi-menu-arrow{color:#ff7f92}

    @media(max-width:850px){
      .wizard-head{flex-wrap:wrap}
      .wizard-head #siteziWizardCredits.visible{
        order:3;width:100%;box-sizing:border-box;justify-content:center;margin:6px 0 0!important
      }
      .topbar #siteziTopCredits.visible{
        display:flex!important;margin-left:auto;margin-right:4px;padding:6px 8px;gap:5px;
        min-height:32px;font-size:9.5px;max-width:180px;overflow:hidden
      }
      .topbar #siteziTopCredits .sitezi-credit-dot{display:none}
      .topbar #siteziTopCredits .sitezi-plan{max-width:72px;overflow:hidden;text-overflow:ellipsis}
      .wizard-head #siteziWizardCredits{margin-left:auto;margin-right:2px;padding:6px 8px;gap:6px;font-size:10px}
      .wizard-head #siteziWizardCredits .sitezi-plan{display:none}
      .result-top #siteziResultCredits.visible{
        display:flex!important;margin-left:auto;margin-right:8px;padding:6px 8px;gap:5px;
        min-height:32px;font-size:9.5px;max-width:185px;overflow:hidden
      }
      .result-top #siteziResultCredits .sitezi-credit-dot{display:none}
      .result-top #siteziResultCredits .sitezi-plan{display:none}
    }

    @media(max-width:700px){
      .sitezi-account-menu-overlay{
        align-items:end;justify-items:stretch;padding:10px;background:rgba(0,5,13,.74)
      }
      .sitezi-account-menu-card{
        width:100%;max-height:88dvh;border-radius:22px
      }
      .sitezi-account-menu-head{padding:18px}
      .sitezi-account-summary{padding:13px 14px}
      .sitezi-account-menu-actions{padding:0 14px 14px}
    }

    @media(max-width:560px){
      .topbar #siteziTopCredits.visible{max-width:170px;font-size:9px;padding:5px 8px}
      .topbar #siteziTopCredits .sitezi-plan{max-width:72px}
      .topbar #siteziTopCredits .sitezi-credit-item{font-size:9px}
      .result-top #siteziResultCredits.visible{max-width:170px;font-size:9px;padding:5px 7px}
      .result-top #siteziResultCredits .sitezi-credit-item{font-size:9px}
      .sitezi-top-support{min-width:38px;padding:0 2px}
      .sitezi-top-support-icon{width:26px;height:26px}
      .sitezi-top-support-icon svg{width:13px;height:13px}
      .sitezi-top-support-label{font-size:8px}
    }
  `;
  document.head.appendChild(style);

  function supportMarkup() {
    return `
      <span class="sitezi-top-support-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"/>
        </svg>
      </span>
      <span class="sitezi-top-support-label">Suporte</span>`;
  }

  function openSupport() {
    // Reaproveita a ação do botão de suporte que já existia na SITEZI.
    // Assim não alteramos número, integração ou atendimento configurado.
    if (legacySupportElement && document.body.contains(legacySupportElement)) {
      legacySupportElement.click();
      return;
    }

    const existingLink = [...document.querySelectorAll('a[href*="wa.me"],a[href*="api.whatsapp.com"]')]
      .find(el => !el.classList.contains("sitezi-top-support"));

    if (existingLink?.href) {
      window.open(existingLink.href, "_blank", "noopener");
      return;
    }

    // Fallback neutro: abre a área de ajuda da própria SITEZI.
    location.href = "/#ajuda";
  }

  function makeSupportLink(id) {
    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.className = "sitezi-top-support";
    button.setAttribute("aria-label", "Abrir suporte da SITEZI");
    button.innerHTML = supportMarkup();
    button.addEventListener("click", openSupport);
    return button;
  }

  function installSupportLinks() {
    const topLogin = $("topLogin");
    if (topLogin && !$("siteziTopSupport")) {
      const parent = topLogin.parentElement;
      if (parent) parent.insertBefore(makeSupportLink("siteziTopSupport"), topLogin);
    }

    const wizardLogin = $("wizardLogin");
    if (wizardLogin && !$("siteziWizardSupport")) {
      const parent = wizardLogin.parentElement;
      if (parent) parent.insertBefore(makeSupportLink("siteziWizardSupport"), wizardLogin);
    }
  }

  function fixWizardBrand() {
    const brand = document.querySelector(".wizard-head .wizard-brand strong");
    if (!brand || brand.dataset.siteziBrandFixed === "1") return;
    if (brand.textContent.trim().toUpperCase() !== "SITEZI") return;

    brand.innerHTML = `SITE<span class="sitezi-brand-accent-z">Z</span><span class="sitezi-brand-accent-i">I</span>`;
    brand.dataset.siteziBrandFixed = "1";
  }

  function forceHideLegacySupport(el) {
    if (!(el instanceof HTMLElement)) return;

    if (el.style.getPropertyValue("opacity") !== "0" || el.style.getPropertyPriority("opacity") !== "important")
      el.style.setProperty("opacity", "0", "important");
    if (el.style.getPropertyValue("pointer-events") !== "none" || el.style.getPropertyPriority("pointer-events") !== "important")
      el.style.setProperty("pointer-events", "none", "important");
    if (el.style.getPropertyValue("transform") !== "scale(.01)" || el.style.getPropertyPriority("transform") !== "important")
      el.style.setProperty("transform", "scale(.01)", "important");
    if (el.style.getPropertyValue("position") !== "fixed" || el.style.getPropertyPriority("position") !== "important")
      el.style.setProperty("position", "fixed", "important");
    if (el.style.getPropertyValue("right") !== "-200px" || el.style.getPropertyPriority("right") !== "important")
      el.style.setProperty("right", "-200px", "important");

    if (el.getAttribute("aria-hidden") !== "true") el.setAttribute("aria-hidden", "true");
    if (el.getAttribute("data-sitezi-hidden-legacy-support") !== "1") el.setAttribute("data-sitezi-hidden-legacy-support", "1");
  }

  function protectLegacySupport(el) {
    if (!(el instanceof HTMLElement) || protectedLegacySupport.has(el)) return;
    protectedLegacySupport.add(el);
    forceHideLegacySupport(el);

    const observer = new MutationObserver(() => forceHideLegacySupport(el));
    observer.observe(el, { attributes:true, attributeFilter:["style","class","hidden"] });
  }

  function hideLegacyFloatingSupport() {
    const all = [...document.body.querySelectorAll("*")];
    for (const el of all) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.id === "siteziOwnerButton" || el.id === "siteziAccountQuickMenu") continue;
      if (el.closest("#siteziAccountQuickMenu, #siteziOwnerPanel, .sitezi-top-support")) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "LINK") continue;

      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") continue;
      if (cs.display === "none" || cs.visibility === "hidden") continue;

      const rect = el.getBoundingClientRect();
      const nearRight = window.innerWidth - rect.right <= 40;
      const sizeOk = rect.width >= 38 && rect.width <= 96 && rect.height >= 38 && rect.height <= 96;
      const circular = Math.abs(rect.width - rect.height) <= 18;
      const topZone = rect.top >= 70 && rect.top <= 380;
      const text = (el.textContent || "").trim();
      const bg = (cs.backgroundColor || "") + " " + (cs.backgroundImage || "");
      const greenish = /rgb\(\s*(?:2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9])\s*,\s*(?:9[0-9]|1[0-9]{2}|2[0-4][0-9])\s*,\s*(?:4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9])/.test(bg) || /#25d366|#1dc85d|#14aa4a/i.test(bg);

      if (nearRight && sizeOk && circular && topZone && (greenish || text.length <= 2)) {
        if (!legacySupportElement) legacySupportElement = el;
        protectLegacySupport(el);
      }
    }
  }

  function queueLegacySupportScan() {
    if (legacyScanQueued) return;
    legacyScanQueued = true;
    requestAnimationFrame(() => {
      legacyScanQueued = false;
      hideLegacyFloatingSupport();
    });
  }

  function installLegacySupportGuard() {
    if (legacySupportGuard || !document.body) return;

    legacySupportGuard = new MutationObserver(() => queueLegacySupportScan());
    legacySupportGuard.observe(document.body, { childList:true, subtree:true });

    const navigationSelector = "#seeExample,#brandHome,#cancelWizard,#backBtn,#exitFullPreview,#closePlans,#newSite";
    document.addEventListener("click", event => {
      if (!event.target.closest?.(navigationSelector)) return;
      queueLegacySupportScan();
    }, true);

    window.addEventListener("pageshow", queueLegacySupportScan);
    window.addEventListener("popstate", queueLegacySupportScan);
    window.addEventListener("hashchange", queueLegacySupportScan);
  }

  function ensureAccountMenu() {
    if ($("siteziAccountQuickMenu")) return;

    const overlay = document.createElement("div");
    overlay.id = "siteziAccountQuickMenu";
    overlay.className = "sitezi-account-menu-overlay hidden";
    overlay.innerHTML = `
      <section class="sitezi-account-menu-card" role="dialog" aria-modal="true" aria-labelledby="siteziAccountMenuTitle">
        <div class="sitezi-account-menu-head">
          <div>
            <strong id="siteziAccountMenuTitle">Minha conta</strong>
            <span id="siteziAccountMenuEmail" class="sitezi-account-menu-email">Conta SITEZI</span>
          </div>
          <button id="siteziAccountMenuClose" class="sitezi-account-menu-close" type="button" aria-label="Fechar">×</button>
        </div>

        <div class="sitezi-account-summary">
          <div class="sitezi-account-summary-box">
            <span>Plano</span>
            <b id="siteziAccountMenuPlan">—</b>
          </div>
          <div class="sitezi-account-summary-box">
            <span>Créditos</span>
            <b id="siteziAccountMenuCredits">✦ 0</b>
          </div>
        </div>

        <div class="sitezi-account-menu-actions">
          <button class="sitezi-account-menu-action" type="button" data-sitezi-account-action="account">
            <span><b>Minha conta</b><small>Dados e acesso da sua conta</small></span>
            <span class="sitezi-menu-arrow">›</span>
          </button>

          <button class="sitezi-account-menu-action" type="button" data-sitezi-account-action="sites">
            <span><b>Meus Sites</b><small>Rascunhos e sites publicados</small></span>
            <span class="sitezi-menu-arrow">›</span>
          </button>

          <button class="sitezi-account-menu-action" type="button" data-sitezi-account-action="plan">
            <span><b>Plano e recursos</b><small>Veja as opções disponíveis</small></span>
            <span class="sitezi-menu-arrow">›</span>
          </button>

          <button class="sitezi-account-menu-action danger" type="button" data-sitezi-account-action="logout">
            <span><b>Sair da conta</b><small>Encerrar esta sessão</small></span>
            <span class="sitezi-menu-arrow">›</span>
          </button>
        </div>
      </section>
    `;
    document.body.appendChild(overlay);

    $("siteziAccountMenuClose")?.addEventListener("click", closeAccountMenu);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeAccountMenu();
    });

    overlay.querySelectorAll("[data-sitezi-account-action]").forEach(button => {
      button.addEventListener("click", async () => {
        const action = button.dataset.siteziAccountAction;

        if (action === "account") {
          closeAccountMenu();
          window.SITEZI_AUTH?.openLogin?.("login");
          return;
        }

        if (action === "sites") {
          closeAccountMenu();
          openMySitesFromMenu();
          return;
        }

        if (action === "plan") {
          closeAccountMenu();
          const plans = $("plans");
          if (plans && typeof window.SITEZI_SHOW_SCREEN === "function") {
            window.SITEZI_SHOW_SCREEN(plans);
          } else {
            $("upgradeWithAI")?.click();
          }
          return;
        }

        if (action === "logout") {
          button.disabled = true;
          try {
            await client.auth.signOut();
            sessionStorage.removeItem("sitezi_current_site_id");
            currentUser = null;
            lastInfo = null;
            render(null);
            closeAccountMenu();
          } finally {
            button.disabled = false;
          }
        }
      });
    });
  }

  function updateAccountMenu() {
    ensureAccountMenu();

    const email = $("siteziAccountMenuEmail");
    const plan = $("siteziAccountMenuPlan");
    const credits = $("siteziAccountMenuCredits");

    if (email) email.textContent = currentUser?.email || "Conta SITEZI";
    if (plan) plan.textContent = lastInfo?.active ? (lastInfo.plan || "Plano ativo") : "Sem plano";
    if (credits) credits.textContent = `✦ ${Math.max(0, Number(lastInfo?.credits || 0))}`;
  }

  function openAccountMenu() {
    if (!currentUser) {
      window.SITEZI_AUTH?.openLogin?.("login");
      return;
    }

    updateAccountMenu();
    $("siteziAccountQuickMenu")?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeAccountMenu() {
    $("siteziAccountQuickMenu")?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function openMySitesFromMenu() {
    let tries = 0;

    const attempt = () => {
      const button = $("siteziManageSite");

      if (button?.dataset?.siteziMySitesHook === "1") {
        button.click();
        return;
      }

      tries += 1;
      if (tries < 25) {
        setTimeout(attempt, 100);
        return;
      }

      window.SITEZI_AUTH?.openLogin?.("login");
    };

    attempt();
  }

  function bindBarInteraction(el) {
    if (!el || el.dataset.siteziAccountMenuBound === "1") return;

    el.dataset.siteziAccountMenuBound = "1";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-haspopup", "dialog");
    el.setAttribute("aria-label", "Abrir menu da conta");

    el.addEventListener("click", openAccountMenu);
    el.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAccountMenu();
      }
    });
  }

  function makeBar(id) {
    const el = document.createElement("div");
    el.id = id;
    el.className = "sitezi-creditbar";
    el.innerHTML = `<span class="sitezi-credit-dot"></span><span class="sitezi-plan">Créditos SITEZI</span><span class="sitezi-credit-item">Carregando...</span>`;
    bindBarInteraction(el);
    return el;
  }

  function install() {
    ensureAccountMenu();
    installSupportLinks();
    fixWizardBrand();
    installLegacySupportGuard();

    const top = document.querySelector(".topbar");
    if (top && !$("siteziTopCredits")) {
      const b = makeBar("siteziTopCredits");
      const create = $("topCreate");
      if (create && create.parentElement === top) top.insertBefore(b, create);
      else top.appendChild(b);
    } else {
      bindBarInteraction($("siteziTopCredits"));
    }

    const head = document.querySelector(".wizard-head");
    if (head && !$("siteziWizardCredits")) {
      const b = makeBar("siteziWizardCredits");
      const actions = $("wizardLogin")?.parentElement;
      if (actions && actions.parentElement === head) head.insertBefore(b, actions);
      else head.appendChild(b);
    } else {
      bindBarInteraction($("siteziWizardCredits"));
    }

    const result = document.querySelector(".result-top");
    if (result && !$("siteziResultCredits")) {
      const b = makeBar("siteziResultCredits");
      const create = $("newSite");
      if (create && create.parentElement === result) result.insertBefore(b, create);
      else result.appendChild(b);
    } else {
      bindBarInteraction($("siteziResultCredits"));
    }

    hideLegacyFloatingSupport();
    setTimeout(hideLegacyFloatingSupport, 350);
    setTimeout(hideLegacyFloatingSupport, 1500);
    setTimeout(hideLegacyFloatingSupport, 3500);
  }

  function render(info) {
    installSupportLinks();
    fixWizardBrand();

    [$("siteziTopCredits"), $("siteziWizardCredits"), $("siteziResultCredits")]
      .filter(Boolean)
      .forEach(bar => {
        if (!currentUser) {
          bar.classList.remove("visible");
          return;
        }

        bar.classList.add("visible");
        bar.classList.toggle("no-plan", !info?.active);

        if (!info?.active) {
          bar.innerHTML = `<span class="sitezi-credit-dot"></span><span class="sitezi-plan">Minha conta</span><span class="sitezi-credit-item">Sem plano</span>`;
          return;
        }

        bar.innerHTML = `
          <span class="sitezi-credit-dot"></span>
          <span class="sitezi-plan">${info.plan || "Plano ativo"}</span>
          <span class="sitezi-credit-item"><b>✦ ${Math.max(0, Number(info.credits || 0))}</b> créditos</span>
        `;
      });

    updateAccountMenu();
  }

  async function refresh() {
    if (!currentUser) {
      lastInfo = null;
      render(null);
      return null;
    }

    const [bal, sub] = await Promise.all([
      client.from("ai_balances").select("ai_credits,reset_at").eq("user_id", currentUser.id).maybeSingle(),
      client.rpc("get_my_sitezi_subscription")
    ]);

    if (bal.error) console.warn("[SITEZI ACCOUNT] Falha ao consultar créditos.", bal.error);
    if (sub.error) console.warn("[SITEZI ACCOUNT] Falha ao consultar assinatura.", sub.error);

    const s = sub.data && typeof sub.data === "object"
      ? sub.data
      : { active: false, plan: null, current_period_end: null };

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

    if (!currentUser) closeAccountMenu();

    await refresh();
  });

  window.addEventListener("sitezi:credits-changed", refresh);
  window.addEventListener("sitezi:ai-credit-change", refresh);
  window.addEventListener("resize", hideLegacyFloatingSupport, { passive: true });

  window.SITEZI_ACCOUNT_STATE = {
    refresh,
    getInfo: () => lastInfo,
    openMenu: openAccountMenu,
    closeMenu: closeAccountMenu
  };

  document.documentElement.dataset.siteziAccountState = "3.6";
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
