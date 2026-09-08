/* =========================================================
   SITEZI — CONTA, PLANO, CRÉDITOS E RASCUNHO v1.0

   O que este arquivo faz:
   - reconhece a sessão Supabase já existente;
   - mostra plano + créditos no topo da SITEZI e no criador;
   - atualiza os créditos após gerar logo/imagem;
   - salva automaticamente o rascunho do cliente no Supabase;
   - restaura o último rascunho quando o mesmo cliente voltar.

   Segurança:
   - o saldo exibido é apenas informativo;
   - o consumo real de créditos continua sendo validado no backend.
   ========================================================= */

(async () => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";

  let createClient;
  try {
    ({ createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"));
  } catch (error) {
    console.error("[SITEZI ACCOUNT] Falha ao carregar Supabase JS.", error);
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const $ = (id) => document.getElementById(id);

  let currentUser = null;
  let restoring = false;
  let saving = false;
  let saveTimer = null;
  let lastSnapshot = "";

  function installStyle() {
    if ($("sitezi-account-state-style")) return;

    const style = document.createElement("style");
    style.id = "sitezi-account-state-style";
    style.textContent = `
      .sitezi-creditbar{
        display:none;
        align-items:center;
        gap:8px;
        min-height:34px;
        padding:7px 10px;
        border:1px solid #173b66;
        border-radius:999px;
        background:linear-gradient(180deg,#0a192a,#07111e);
        color:#dbeaff;
        font-family:Inter,Arial,sans-serif;
        font-size:11px;
        font-weight:800;
        white-space:nowrap;
        box-shadow:0 8px 24px rgba(0,0,0,.18);
      }

      .sitezi-creditbar.visible{display:flex}

      .sitezi-creditbar .sitezi-credit-dot{
        width:7px;
        height:7px;
        border-radius:50%;
        background:#2da8ff;
        box-shadow:0 0 0 4px rgba(45,168,255,.12);
        flex:0 0 auto;
      }

      .sitezi-creditbar .sitezi-plan{
        color:#fff;
      }

      .sitezi-creditbar .sitezi-credit-item{
        color:#a9c2dd;
      }

      .sitezi-creditbar .sitezi-credit-item b{
        color:#fff;
      }

      .sitezi-creditbar.loading{
        opacity:.68;
      }

      .sitezi-creditbar.no-plan .sitezi-credit-dot{
        background:#76869a;
        box-shadow:none;
      }

      .sitezi-creditbar.no-plan .sitezi-credit-item{
        color:#8fa0b4;
      }

      #siteziTopCredits{
        margin-left:auto;
        margin-right:8px;
      }

      .wizard-head #siteziWizardCredits{
        margin-left:auto;
        margin-right:10px;
      }

      .sitezi-draft-restored{
        position:fixed;
        left:50%;
        bottom:20px;
        z-index:12000;
        transform:translateX(-50%);
        padding:11px 15px;
        border:1px solid #245287;
        border-radius:14px;
        background:#071522;
        color:#e9f4ff;
        box-shadow:0 16px 45px rgba(0,0,0,.38);
        font:700 12px/1.4 Inter,Arial,sans-serif;
        max-width:calc(100vw - 30px);
        text-align:center;
      }

      @media(max-width:850px){
        .topbar #siteziTopCredits{
          display:none!important;
        }

        .wizard-head{
          gap:7px!important;
        }

        .wizard-head #siteziWizardCredits{
          margin-left:auto;
          margin-right:2px;
          padding:6px 8px;
          gap:6px;
          font-size:10px;
        }

        .wizard-head #siteziWizardCredits .sitezi-plan{
          display:none;
        }
      }

      @media(max-width:390px){
        .wizard-head #siteziWizardCredits{
          max-width:165px;
          overflow:hidden;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function creditMarkup(id) {
    const el = document.createElement("div");
    el.id = id;
    el.className = "sitezi-creditbar loading";
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `
      <span class="sitezi-credit-dot"></span>
      <span class="sitezi-plan">Conta SITEZI</span>
      <span class="sitezi-credit-item">Carregando...</span>
    `;
    return el;
  }

  function installCreditBars() {
    const topbar = document.querySelector(".topbar");
    if (topbar && !$("siteziTopCredits")) {
      const bar = creditMarkup("siteziTopCredits");
      const create = $("topCreate");
      if (create) topbar.insertBefore(bar, create);
      else topbar.appendChild(bar);
    }

    const wizardHead = document.querySelector(".wizard-head");
    if (wizardHead && !$("siteziWizardCredits")) {
      const bar = creditMarkup("siteziWizardCredits");
      const cancel = $("cancelWizard");
      if (cancel) wizardHead.insertBefore(bar, cancel);
      else wizardHead.appendChild(bar);
    }
  }

  function renderCredits(info = null) {
    const bars = [$("siteziTopCredits"), $("siteziWizardCredits")].filter(Boolean);

    for (const bar of bars) {
      bar.classList.remove("loading", "no-plan");

      if (!currentUser) {
        bar.classList.remove("visible");
        continue;
      }

      bar.classList.add("visible");

      if (!info?.active) {
        bar.classList.add("no-plan");
        bar.innerHTML = `
          <span class="sitezi-credit-dot"></span>
          <span class="sitezi-plan">Conta SITEZI</span>
          <span class="sitezi-credit-item">Sem plano ativo</span>
        `;
        continue;
      }

      bar.innerHTML = `
        <span class="sitezi-credit-dot"></span>
        <span class="sitezi-plan">${escapeHtml(info.plan || "Plano ativo")}</span>
        <span class="sitezi-credit-item"><b>${Number(info.images || 0)}</b> imagens</span>
        <span class="sitezi-credit-item"><b>${Number(info.logos || 0)}</b> logos</span>
      `;
    }
  }

  async function refreshAccountInfo() {
    if (!currentUser) {
      renderCredits(null);
      return null;
    }

    const now = new Date().toISOString();

    const [balanceRes, subRes] = await Promise.all([
      client
        .from("ai_balances")
        .select("image_credits, logo_credits, reset_at")
        .eq("user_id", currentUser.id)
        .maybeSingle(),

      client
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", currentUser.id)
        .eq("status", "active")
        .gt("current_period_end", now)
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (balanceRes.error) {
      console.warn("[SITEZI ACCOUNT] Não foi possível consultar créditos.", balanceRes.error);
    }
    if (subRes.error) {
      console.warn("[SITEZI ACCOUNT] Não foi possível consultar assinatura.", subRes.error);
    }

    const balance = balanceRes.data || {};
    const subscription = subRes.data || null;

    const info = {
      active: Boolean(subscription),
      plan: subscription?.plan || "",
      images: balance.image_credits ?? 0,
      logos: balance.logo_credits ?? 0,
      resetAt: balance.reset_at || subscription?.current_period_end || null
    };

    renderCredits(info);

    window.dispatchEvent(new CustomEvent("sitezi:account-info", { detail: info }));
    return info;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[ch]);
  }

  function activeStep() {
    return Number(document.querySelector(".step.active")?.dataset.step || 1);
  }

  function currentDraft() {
    return {
      business_name: $("businessName")?.value?.trim() || "",
      business_type: document.querySelector(".business.active")?.dataset.business || "",
      template: document.querySelector(".template-card.active")?.dataset.template || "modern",
      configuration: {
        wizard_step: activeStep(),
        slogan: $("businessSlogan")?.value?.trim() || "",
        services: $("servicesInput")?.value?.trim() || "",
        whatsapp: $("whatsapp")?.value?.trim() || "",
        instagram: $("instagram")?.value?.trim() || "",
        location: $("location")?.value?.trim() || "",
        color: document.querySelector(".color.active")?.dataset.color || "#1578ff",
        logo_mode: document.querySelector("[data-logo-mode].active")?.dataset.logoMode || "text",
        image_mode: document.querySelector("[data-image-mode].active")?.dataset.imageMode || "none"
      }
    };
  }

  function hasMeaningfulDraft(draft) {
    return Boolean(
      draft.business_name ||
      draft.business_type ||
      draft.configuration.slogan ||
      draft.configuration.services ||
      draft.configuration.whatsapp ||
      draft.configuration.instagram ||
      draft.configuration.location ||
      draft.configuration.wizard_step > 1
    );
  }

  function draftStorageKey() {
    return currentUser ? `sitezi_draft_site_id_${currentUser.id}` : "";
  }

  function getKnownDraftId() {
    if (!currentUser) return "";
    return (
      sessionStorage.getItem("sitezi_current_site_id") ||
      localStorage.getItem(draftStorageKey()) ||
      ""
    );
  }

  function rememberDraftId(id) {
    if (!currentUser || !id) return;
    sessionStorage.setItem("sitezi_current_site_id", id);
    localStorage.setItem(draftStorageKey(), id);
  }

  async function findLatestDraft() {
    if (!currentUser) return null;

    const knownId = getKnownDraftId();

    if (knownId) {
      const { data, error } = await client
        .from("sites")
        .select("id, business_name, business_type, template, configuration, generated_content, status, updated_at")
        .eq("id", knownId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!error && data) return data;
    }

    const { data, error } = await client
      .from("sites")
      .select("id, business_name, business_type, template, configuration, generated_content, status, updated_at")
      .eq("user_id", currentUser.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[SITEZI ACCOUNT] Não foi possível procurar rascunho.", error);
      return null;
    }

    if (data?.id) rememberDraftId(data.id);
    return data || null;
  }

  async function saveDraftNow() {
    if (!currentUser || restoring || saving) return;

    const draft = currentDraft();
    if (!hasMeaningfulDraft(draft)) return;

    const snapshot = JSON.stringify(draft);
    if (snapshot === lastSnapshot) return;

    saving = true;

    try {
      const payload = {
        business_name: draft.business_name || "Meu site",
        business_type: draft.business_type || "Outro",
        template: draft.template || "modern",
        status: "draft",
        configuration: draft.configuration,
        updated_at: new Date().toISOString()
      };

      const knownId = getKnownDraftId();

      if (knownId) {
        const { data, error } = await client
          .from("sites")
          .update(payload)
          .eq("id", knownId)
          .eq("user_id", currentUser.id)
          .select("id")
          .maybeSingle();

        if (!error && data?.id) {
          rememberDraftId(data.id);
          lastSnapshot = snapshot;
          return;
        }
      }

      const { data, error } = await client
        .from("sites")
        .insert({
          ...payload,
          user_id: currentUser.id,
          generated_content: {}
        })
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        rememberDraftId(data.id);
        lastSnapshot = snapshot;
      }
    } catch (error) {
      console.warn("[SITEZI ACCOUNT] Falha no salvamento automático.", error);
    } finally {
      saving = false;
    }
  }

  function scheduleSave(delay = 700) {
    if (!currentUser || restoring) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraftNow, delay);
  }

  function setInput(id, value) {
    const el = $(id);
    if (!el || value == null) return;
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function selectByData(selector, dataName, value, click = true) {
    if (!value) return null;

    const item = [...document.querySelectorAll(selector)]
      .find(el => el.dataset[dataName] === value);

    if (!item) return null;

    if (click) {
      item.click();
    } else {
      document.querySelectorAll(selector).forEach(el => el.classList.remove("active"));
      item.classList.add("active");
    }

    return item;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function restoreDraft(site) {
    if (!site || !currentUser) return;

    const cfg = site.configuration || {};
    const targetStep = Math.max(1, Math.min(8, Number(cfg.wizard_step || 1)));

    restoring = true;

    try {
      if (site.id) rememberDraftId(site.id);

      setInput("businessName", site.business_name || "");
      setInput("businessSlogan", cfg.slogan || "");
      setInput("servicesInput", cfg.services || "");
      setInput("whatsapp", cfg.whatsapp || "");
      setInput("instagram", cfg.instagram || "");
      setInput("location", cfg.location || "");

      if (site.business_type) {
        selectByData(".business", "business", site.business_type, true);
        await wait(180);
      }

      setInput("businessName", site.business_name || "");
      setInput("businessSlogan", cfg.slogan || "");

      selectByData(".template-card", "template", site.template || "modern", true);
      selectByData(".color", "color", cfg.color || "#1578ff", true);

      if (cfg.logo_mode === "text") {
        selectByData("[data-logo-mode]", "logoMode", "text", true);
      } else if (cfg.logo_mode) {
        // Não dispara IA nem exige reupload automaticamente.
        selectByData("[data-logo-mode]", "logoMode", cfg.logo_mode, false);
      }

      if (cfg.image_mode === "none") {
        selectByData("[data-image-mode]", "imageMode", "none", true);
      } else if (cfg.image_mode) {
        // Não dispara geração automática ao restaurar.
        selectByData("[data-image-mode]", "imageMode", cfg.image_mode, false);
      }

      // Sincroniza o step interno do script principal sem alterar o arquivo aprovado.
      if (site.business_type && targetStep >= 3) {
        $("saveNameContinue")?.click();
        await wait(40);

        while (activeStep() < targetStep && activeStep() < 8) {
          const before = activeStep();
          $("nextBtn")?.click();
          await wait(40);
          if (activeStep() === before) break;
        }
      }

      lastSnapshot = JSON.stringify(currentDraft());

      if (targetStep > 1 || site.business_name) {
        showRestoredToast();
      }
    } catch (error) {
      console.warn("[SITEZI ACCOUNT] Falha ao restaurar rascunho.", error);
    } finally {
      restoring = false;
    }
  }

  function showRestoredToast() {
    document.querySelector(".sitezi-draft-restored")?.remove();

    const toast = document.createElement("div");
    toast.className = "sitezi-draft-restored";
    toast.textContent = "✓ Seu rascunho SITEZI foi restaurado.";
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  async function handleLoggedInUser(user) {
    currentUser = user || null;

    if (!currentUser) {
      renderCredits(null);
      return;
    }

    await refreshAccountInfo();

    const draft = await findLatestDraft();
    if (draft) await restoreDraft(draft);
  }

  function bindAutoSave() {
    const relevantIds = new Set([
      "businessName",
      "businessSlogan",
      "servicesInput",
      "whatsapp",
      "instagram",
      "location"
    ]);

    document.addEventListener("input", event => {
      if (relevantIds.has(event.target?.id)) scheduleSave();
    }, true);

    document.addEventListener("change", event => {
      if (
        relevantIds.has(event.target?.id) ||
        event.target?.id === "logoUpload" ||
        event.target?.id === "photoUpload"
      ) {
        scheduleSave(900);
      }
    }, true);

    document.addEventListener("click", event => {
      const target = event.target?.closest?.(
        ".business, .template-card, .color, [data-logo-mode], [data-image-mode], #nextBtn, #backBtn, #saveNameContinue"
      );
      if (target) scheduleSave(900);
    }, true);

    window.addEventListener("beforeunload", () => {
      // O salvamento principal ocorre com debounce durante o uso.
      // Não fazemos fetch bloqueante no unload.
    });
  }

  installStyle();
  installCreditBars();
  bindAutoSave();

  const { data } = await client.auth.getSession();
  await handleLoggedInUser(data.session?.user || null);

  client.auth.onAuthStateChange((event, session) => {
    const nextUser = session?.user || null;
    const changedUser = nextUser?.id !== currentUser?.id;

    currentUser = nextUser;

    if (!currentUser) {
      renderCredits(null);
      lastSnapshot = "";
      return;
    }

    refreshAccountInfo();

    if (changedUser || event === "SIGNED_IN") {
      setTimeout(async () => {
        const draft = await findLatestDraft();
        if (draft) await restoreDraft(draft);
      }, 100);
    }
  });

  window.addEventListener("sitezi:ai-credit-change", refreshAccountInfo);
  window.addEventListener("sitezi:ai-logo-generated", refreshAccountInfo);
  window.addEventListener("sitezi:ai-image-generated", refreshAccountInfo);

  // Atualiza também quando o usuário volta do checkout para a aba.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && currentUser) refreshAccountInfo();
  });

  window.siteziAccountState = {
    refreshCredits: refreshAccountInfo,
    saveDraft: saveDraftNow,
    restoreLatestDraft: async () => {
      const draft = await findLatestDraft();
      if (draft) await restoreDraft(draft);
      return draft;
    }
  };

  document.documentElement.dataset.siteziAccountState = "1.0";
  console.info("[SITEZI] Conta + créditos + rascunho v1.0 carregado.");
})();
