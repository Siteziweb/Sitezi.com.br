/* =========================================================
   SITEZI — AUTENTICAÇÃO v1.1
   Cadastro/Login real com Supabase Auth.
   - expõe API pública SITEZI_AUTH.openLogin()
   - conecta os botões topLogin e wizardLogin
   - atualiza "Fazer login" / "Minha conta"
   - preserva publicação protegida e salvamento de rascunho
   ========================================================= */

(async () => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";

  let createClient;

  try {
    ({ createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"));
  } catch (error) {
    console.error("[SITEZI AUTH] Não foi possível carregar o Supabase JS.", error);
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  let currentUser = null;
  let pendingPublish = null;
  let savingDraft = false;

  const $ = id => document.getElementById(id);

  const style = document.createElement("style");
  style.id = "sitezi-auth-styles";
  style.textContent = `
    .sitezi-auth-trigger{margin-left:8px}
    .sitezi-auth-modal{
      position:fixed;inset:0;z-index:99999;
      display:grid;place-items:center;padding:18px;
      background:rgba(0,7,18,.80);backdrop-filter:blur(10px)
    }
    .sitezi-auth-modal.hidden{display:none}
    .sitezi-auth-card{
      width:min(430px,100%);background:#07101d;
      border:1px solid #1d3150;border-radius:24px;
      padding:24px;color:#fff;
      box-shadow:0 28px 80px rgba(0,0,0,.48);
      font-family:Inter,Arial,sans-serif
    }
    .sitezi-auth-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}
    .sitezi-auth-head strong{font-size:22px}
    .sitezi-auth-close{border:0;background:transparent;color:#9fb0c8;font-size:28px;line-height:1;cursor:pointer}
    .sitezi-auth-copy{color:#94a3b8;margin:0 0 18px;line-height:1.45}
    .sitezi-auth-tabs{
      display:grid;grid-template-columns:1fr 1fr;
      background:#040914;border:1px solid #20304a;
      border-radius:14px;padding:4px;margin-bottom:18px
    }
    .sitezi-auth-tab{border:0;border-radius:10px;background:transparent;color:#91a0b7;padding:11px;font-weight:800;cursor:pointer}
    .sitezi-auth-tab.active{background:#123cca;color:#fff}
    .sitezi-auth-form{display:grid;gap:12px}
    .sitezi-auth-form.hidden{display:none}
    .sitezi-auth-form label{display:grid;gap:6px;font-size:13px;color:#aebbd0}
    .sitezi-auth-form input{
      width:100%;border:1px solid #293c5a;
      background:#040a13;color:#fff;border-radius:12px;
      padding:14px 15px;outline:none;box-sizing:border-box
    }
    .sitezi-auth-form input:focus{border-color:#2368ff;box-shadow:0 0 0 3px rgba(35,104,255,.14)}
    .sitezi-auth-submit{
      border:0;border-radius:13px;padding:14px 16px;
      background:#123fe8;color:#fff;font-weight:900;
      font-size:15px;cursor:pointer
    }
    .sitezi-auth-submit:disabled{opacity:.6;cursor:wait}
    .sitezi-auth-message{min-height:22px;margin-top:12px;font-size:13px;line-height:1.4;color:#9fb0c8}
    .sitezi-auth-message.error{color:#ff8b8b}
    .sitezi-auth-message.ok{color:#72e6a1}
    .sitezi-auth-userbox{display:grid;gap:10px}
    .sitezi-auth-userbox.hidden{display:none}
    .sitezi-auth-email{
      padding:13px;border:1px solid #253957;
      background:#040a13;border-radius:12px;color:#c8d3e4;
      overflow-wrap:anywhere
    }
    .sitezi-auth-logout{
      border:1px solid #344965;background:transparent;
      color:#fff;border-radius:12px;padding:12px;
      font-weight:800;cursor:pointer
    }
    @media(max-width:760px){
      .sitezi-auth-modal{align-items:end;padding:10px}
      .sitezi-auth-card{
        width:100%;max-height:92vh;overflow:auto;
        border-radius:20px;padding:20px
      }
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "siteziAuthModal";
  modal.className = "sitezi-auth-modal hidden";
  modal.innerHTML = `
    <div class="sitezi-auth-card" role="dialog" aria-modal="true" aria-labelledby="siteziAuthTitle">
      <div class="sitezi-auth-head">
        <strong id="siteziAuthTitle">Sua conta SITEZI</strong>
        <button class="sitezi-auth-close" type="button" aria-label="Fechar">×</button>
      </div>

      <p class="sitezi-auth-copy">
        Entre ou crie sua conta sem perder o que você já configurou no site.
      </p>

      <div id="siteziAuthLoggedOut">
        <div class="sitezi-auth-tabs">
          <button class="sitezi-auth-tab active" data-auth-tab="login" type="button">Entrar</button>
          <button class="sitezi-auth-tab" data-auth-tab="signup" type="button">Criar conta</button>
        </div>

        <form id="siteziLoginForm" class="sitezi-auth-form">
          <label>E-mail<input id="siteziLoginEmail" type="email" autocomplete="email" required placeholder="voce@email.com"></label>
          <label>Senha<input id="siteziLoginPassword" type="password" autocomplete="current-password" required minlength="6" placeholder="Sua senha"></label>
          <button class="sitezi-auth-submit" type="submit">Entrar na SITEZI</button>
        </form>

        <form id="siteziSignupForm" class="sitezi-auth-form hidden">
          <label>Seu nome<input id="siteziSignupName" type="text" autocomplete="name" required maxlength="80" placeholder="Seu nome"></label>
          <label>E-mail<input id="siteziSignupEmail" type="email" autocomplete="email" required placeholder="voce@email.com"></label>
          <label>Senha<input id="siteziSignupPassword" type="password" autocomplete="new-password" required minlength="6" placeholder="Mínimo de 6 caracteres"></label>
          <button class="sitezi-auth-submit" type="submit">Criar minha conta</button>
        </form>
      </div>

      <div id="siteziAuthLoggedIn" class="sitezi-auth-userbox hidden">
        <div class="sitezi-auth-email" id="siteziAuthEmail"></div>
        <button id="siteziAuthContinue" class="sitezi-auth-submit" type="button">Continuar →</button>
        <button id="siteziAuthLogout" class="sitezi-auth-logout" type="button">Sair da conta</button>
      </div>

      <div id="siteziAuthMessage" class="sitezi-auth-message"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const message = $("siteziAuthMessage");

  function setMessage(text = "", type = "") {
    message.textContent = text;
    message.className = `sitezi-auth-message${type ? ` ${type}` : ""}`;
  }

  function setBusy(form, busy) {
    const btn = form?.querySelector("button[type='submit']");
    if (btn) btn.disabled = busy;
  }

  function friendlyError(error) {
    const text = String(error?.message || "").toLowerCase();
    if (text.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (text.includes("user already registered")) return "Este e-mail já possui uma conta.";
    if (text.includes("password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
    if (text.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
    return error?.message || "Não foi possível concluir. Tente novamente.";
  }

  function emitAuthState() {
    window.dispatchEvent(new CustomEvent("sitezi:auth-state", {
      detail: {
        user: currentUser,
        loggedIn: !!currentUser
      }
    }));
  }

  function updateExternalButtons() {
    const label = currentUser ? "Minha conta" : "Fazer login";
    ["topLogin", "wizardLogin", "siteziAccountButton"].forEach(id => {
      const button = $(id);
      if (button) button.textContent = label;
    });
  }

  function updateUI() {
    const loggedOut = $("siteziAuthLoggedOut");
    const loggedIn = $("siteziAuthLoggedIn");
    const email = $("siteziAuthEmail");

    if (currentUser) {
      loggedOut.classList.add("hidden");
      loggedIn.classList.remove("hidden");
      email.textContent = currentUser.email || "Conta conectada";
    } else {
      loggedOut.classList.remove("hidden");
      loggedIn.classList.add("hidden");
    }

    updateExternalButtons();
    emitAuthState();
  }

  function selectTab(mode) {
    document.querySelectorAll(".sitezi-auth-tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.authTab === mode);
    });
    $("siteziLoginForm").classList.toggle("hidden", mode !== "login");
    $("siteziSignupForm").classList.toggle("hidden", mode !== "signup");
    setMessage("");
  }

  function openModal(mode = "login") {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (!currentUser) selectTab(mode === "signup" ? "signup" : "login");
    setMessage("");
    updateUI();
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // API pública usada pelo script.js e pelo sitezi-image-ai.js.
  window.SITEZI_AUTH = {
    openLogin: openModal,
    close: closeModal,
    getUser: () => currentUser,
    getClient: () => client,
    isLoggedIn: () => !!currentUser
  };

  // Também aceita abertura por evento para evitar dependência da ordem dos scripts.
  window.addEventListener("sitezi:open-login", event => {
    openModal(event.detail?.mode || "login");
  });

  function bindExternalAccountButtons() {
    ["topLogin", "wizardLogin"].forEach(id => {
      const button = $(id);
      if (!button || button.dataset.siteziAuthBound === "1") return;
      button.addEventListener("click", event => {
        event.preventDefault();
        openModal("login");
      });
      button.dataset.siteziAuthBound = "1";
    });
  }

  function addAccountButton() {
    // Nas versões novas do index já existem topLogin e wizardLogin.
    // Não cria um terceiro botão duplicado.
    if ($("topLogin") || $("wizardLogin")) {
      bindExternalAccountButtons();
      return;
    }

    const create = $("topCreate");
    if (!create || $("siteziAccountButton")) return;

    const button = document.createElement("button");
    button.id = "siteziAccountButton";
    button.type = "button";
    button.className = "btn ghost compact sitezi-auth-trigger";
    button.textContent = "Fazer login";
    button.addEventListener("click", () => openModal("login"));
    create.parentNode.insertBefore(button, create);
  }

  function draftPayload() {
    const frame = $("sitePreview");
    const builder = window.SITEZI_BUILDER_STATE || {};

    return {
      user_id: currentUser.id,
      business_name: $("businessName")?.value?.trim() || "Meu site",
      business_type: document.querySelector(".business.active")?.dataset.business || builder.businessType || "Outro",
      template: document.querySelector(".template-card.active")?.dataset.template || builder.template || "modern",
      status: "draft",
      configuration: {
        slogan: $("businessSlogan")?.value?.trim() || "",
        services: $("servicesInput")?.value?.trim() || "",
        whatsapp: $("whatsapp")?.value?.trim() || "",
        instagram: $("instagram")?.value?.trim() || "",
        location: $("location")?.value?.trim() || "",
        color: document.querySelector(".color.active")?.dataset.color || builder.color || "#1578ff",
        logo_mode: document.querySelector("[data-logo-mode].active")?.dataset.logoMode || builder.logoMode || "text",
        image_mode: document.querySelector("[data-image-mode].active")?.dataset.imageMode || builder.imageMode || "none",
        products: Array.isArray(builder.products) ? builder.products.map(p => ({
          name: p.name || "",
          price: p.price || "",
          description: p.description || ""
        })) : []
      },
      generated_content: {
        html: frame?.srcdoc || ""
      }
    };
  }

  async function saveDraftSite() {
    if (!currentUser || savingDraft) return null;
    savingDraft = true;

    try {
      const payload = draftPayload();
      const existingId = sessionStorage.getItem("sitezi_current_site_id");

      if (existingId) {
        const { data, error } = await client
          .from("sites")
          .update({
            business_name: payload.business_name,
            business_type: payload.business_type,
            template: payload.template,
            status: payload.status,
            configuration: payload.configuration,
            generated_content: payload.generated_content,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingId)
          .eq("user_id", currentUser.id)
          .select("id")
          .maybeSingle();

        if (!error && data?.id) return data;
      }

      const { data, error } = await client.from("sites").insert(payload).select("id").single();
      if (error) throw error;

      if (data?.id) sessionStorage.setItem("sitezi_current_site_id", data.id);
      return data;
    } finally {
      savingDraft = false;
    }
  }

  async function runPendingPublish() {
    if (!currentUser) {
      openModal("signup");
      return;
    }

    const continueBtn = $("siteziAuthContinue");

    if (!pendingPublish) {
      closeModal();
      return;
    }

    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.textContent = "Salvando seu site...";
    }

    setMessage("Salvando sua prévia com segurança...");

    try {
      await saveDraftSite();
      setMessage("Site salvo. Continuando...", "ok");

      const action = pendingPublish;
      pendingPublish = null;
      closeModal();

      if (typeof action === "function") action();
    } catch (error) {
      console.error("[SITEZI AUTH] Erro ao salvar site:", error);
      setMessage("Sua conta entrou, mas não consegui salvar a prévia agora. Tente novamente.", "error");
    } finally {
      if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.textContent = "Continuar →";
      }
    }
  }

  function protectPublishButton(id) {
    const button = $(id);
    if (!button || button.dataset.siteziAuthProtected === "1" || typeof button.onclick !== "function") return;

    const original = button.onclick;

    button.onclick = async function(event) {
      event?.preventDefault?.();

      if (!currentUser) {
        pendingPublish = () => original.call(button, event);
        openModal("signup");
        return;
      }

      try {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "Salvando...";
        await saveDraftSite();
        original.call(button, event);
        button.textContent = originalText;
        button.disabled = false;
      } catch (error) {
        console.error("[SITEZI AUTH] Erro ao salvar:", error);
        button.disabled = false;
        alert("Não consegui salvar seu site agora. Tente novamente.");
      }
    };

    button.dataset.siteziAuthProtected = "1";
  }

  document.querySelectorAll(".sitezi-auth-tab").forEach(btn => {
    btn.addEventListener("click", () => selectTab(btn.dataset.authTab));
  });

  $("siteziLoginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(form, true);
    setMessage("Entrando...");

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: $("siteziLoginEmail").value.trim(),
        password: $("siteziLoginPassword").value
      });

      if (error) throw error;

      currentUser = data.user;
      updateUI();
      setMessage("Conta conectada com sucesso.", "ok");

      if (pendingPublish) await runPendingPublish();
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      setBusy(form, false);
    }
  });

  $("siteziSignupForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(form, true);
    setMessage("Criando sua conta...");

    try {
      const name = $("siteziSignupName").value.trim();
      const email = $("siteziSignupEmail").value.trim();
      const password = $("siteziSignupPassword").value;

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } }
      });

      if (error) throw error;

      currentUser = data.user || null;

      if (data.session) {
        updateUI();
        setMessage("Conta criada com sucesso.", "ok");
        if (pendingPublish) await runPendingPublish();
      } else {
        currentUser = null;
        updateUI();
        selectTab("login");
        $("siteziLoginEmail").value = email;
        setMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre na SITEZI.", "ok");
      }
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      setBusy(form, false);
    }
  });

  $("siteziAuthContinue").addEventListener("click", runPendingPublish);

  $("siteziAuthLogout").addEventListener("click", async () => {
    await client.auth.signOut();
    currentUser = null;
    pendingPublish = null;
    sessionStorage.removeItem("sitezi_current_site_id");
    updateUI();
    setMessage("Você saiu da conta.");
  });

  modal.querySelector(".sitezi-auth-close").addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  addAccountButton();

  const { data } = await client.auth.getSession();
  currentUser = data.session?.user || null;
  updateUI();

  protectPublishButton("publishSite");
  protectPublishButton("publishFromPreview");

  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateUI();
  });

  document.documentElement.dataset.siteziAuth = "1.1";
  console.info("[SITEZI] Supabase Auth v1.1 carregado.");
})();