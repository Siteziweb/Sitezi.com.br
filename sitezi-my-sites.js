/* =========================================================
   SITEZI — MEUS SITES + AUTOSAVE v1.0
   - adiciona painel "Meus Sites" sem alterar o construtor atual
   - salva rascunhos automaticamente conforme o cliente avança
   - permite retomar rascunhos e editar sites publicados
   - mantém um backup local de emergência
   ========================================================= */
(() => {
  "use strict";

  const SITE_BASE_URL = "https://sitezi.com.br/site";
  const CURRENT_SITE_KEY = "sitezi_current_site_id";
  const EDIT_PARAM = "sitezi_site";
  const AUTOSAVE_DELAY = 1200;

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[c]);
  const clone = value => {
    try { return structuredClone(value); }
    catch (_) { return JSON.parse(JSON.stringify(value ?? null)); }
  };

  let ready = false;
  let restoring = false;
  let saving = false;
  let autosaveTimer = null;
  let lastSavedSignature = "";
  let currentSites = [];

  function auth() { return window.SITEZI_AUTH || null; }
  function state() { return window.SITEZI_BUILDER_STATE || null; }
  function user() { return auth()?.getUser?.() || null; }

  function normalizeWhatsApp(value) {
    let d = String(value || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("55")) return d;
    if (d.length === 10 || d.length === 11) return "55" + d;
    return d;
  }

  function meaningfulBuilderState(s) {
    if (!s) return false;
    return !!(
      String(s.businessType || "").trim() ||
      String(s.businessName || "").trim() ||
      String(s.slogan || "").trim() ||
      (Array.isArray(s.products) && s.products.length) ||
      String(s.whatsapp || "").trim() ||
      String(s.email || "").trim() ||
      (Array.isArray(s.photos) && s.photos.length) ||
      String(s.logoData || "").trim()
    );
  }

  function backupKey() {
    const u = user();
    return `sitezi_builder_backup_${u?.id || "guest"}`;
  }

  function safeBackup(s) {
    if (!s) return;
    const copy = clone(s);
    try {
      localStorage.setItem(backupKey(), JSON.stringify(copy));
      return;
    } catch (_) {}

    // Se imagens em base64 estourarem o limite do navegador, salva ao menos os dados essenciais.
    try {
      if (typeof copy.logoData === "string" && copy.logoData.startsWith("data:")) copy.logoData = "";
      if (Array.isArray(copy.photos)) copy.photos = copy.photos.filter(x => !String(x || "").startsWith("data:"));
      if (Array.isArray(copy.products)) {
        copy.products = copy.products.map(p => ({
          ...p,
          photo: String(p?.photo || "").startsWith("data:") ? "" : (p?.photo || "")
        }));
      }
      localStorage.setItem(backupKey(), JSON.stringify(copy));
    } catch (_) {}
  }

  function signature(s) {
    if (!s) return "";
    const copy = clone(s);
    // srcdoc não faz parte do state, então aqui basta uma assinatura estável do criador.
    try { return JSON.stringify(copy); }
    catch (_) { return String(Date.now()); }
  }

  function setSaveIndicator(mode, text) {
    const el = $("siteziAutosaveStatus");
    if (!el) return;
    el.dataset.mode = mode || "";
    el.textContent = text || "";
    el.classList.toggle("visible", !!text);
  }

  async function saveNow({ force = false } = {}) {
    const a = auth();
    const s = state();
    const u = user();
    if (!a?.saveCurrentSite || !u || !s || restoring || saving || !meaningfulBuilderState(s)) return;

    const sig = signature(s);
    if (!force && sig === lastSavedSignature) return;

    saving = true;
    setSaveIndicator("saving", "Salvando…");
    try {
      const result = await a.saveCurrentSite();
      lastSavedSignature = signature(state());
      const siteId = result?.id || sessionStorage.getItem(CURRENT_SITE_KEY) || "";
      if (siteId) localStorage.setItem(`sitezi_last_site_${u.id}`, siteId);
      setSaveIndicator("saved", "✓ Salvo");
      setTimeout(() => setSaveIndicator("", ""), 1800);
      window.dispatchEvent(new CustomEvent("sitezi:autosaved", { detail: { siteId } }));
    } catch (error) {
      console.warn("[SITEZI AUTOSAVE] Não foi possível salvar agora.", error);
      setSaveIndicator("error", "Não salvo");
      setTimeout(() => setSaveIndicator("", ""), 2600);
    } finally {
      saving = false;
    }
  }

  function scheduleAutosave({ force = false } = {}) {
    const s = state();
    if (!s) return;
    safeBackup(s);
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveNow({ force }), force ? 120 : AUTOSAVE_DELAY);
  }

  function syncInputToState(target) {
    const s = state();
    if (!s || !target?.id) return false;
    const map = {
      businessName: "businessName",
      businessSlogan: "slogan",
      whatsapp: "whatsapp",
      instagram: "instagram",
      email: "email",
      location: "location"
    };
    const prop = map[target.id];
    if (!prop) return false;
    s[prop] = prop === "whatsapp" ? normalizeWhatsApp(target.value) : target.value.trim();
    return true;
  }

  function installStyles() {
    if ($("sitezi-my-sites-style")) return;
    const style = document.createElement("style");
    style.id = "sitezi-my-sites-style";
    style.textContent = `
      .sitezi-ms-modal{position:fixed;inset:0;z-index:100300;display:grid;place-items:center;padding:18px;background:rgba(0,6,16,.86);backdrop-filter:blur(12px);font-family:Inter,Arial,sans-serif}
      .sitezi-ms-modal.hidden{display:none}.sitezi-ms-shell{width:min(940px,100%);max-height:92vh;overflow:auto;border:1px solid #203653;border-radius:24px;background:#06101d;color:#f7fbff;box-shadow:0 30px 90px rgba(0,0,0,.48)}
      .sitezi-ms-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 22px;border-bottom:1px solid #1b304a;background:rgba(6,16,29,.96);backdrop-filter:blur(12px)}
      .sitezi-ms-head h2{margin:0;font-size:24px;letter-spacing:-.7px}.sitezi-ms-head p{margin:4px 0 0;color:#91a5bd;font-size:13px}.sitezi-ms-close{width:42px;height:42px;border-radius:50%;border:1px solid #2b4565;background:#0a1727;color:#fff;font-size:24px;cursor:pointer}
      .sitezi-ms-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px 0}.sitezi-ms-new{border:1px solid #176fff;background:#0b54ec;color:white;border-radius:12px;padding:12px 15px;font-weight:900;cursor:pointer}.sitezi-ms-count{color:#8195ad;font-size:12px;font-weight:800}
      .sitezi-ms-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:18px 22px 24px}.sitezi-ms-card{border:1px solid #203750;border-radius:18px;background:linear-gradient(145deg,#081522,#09111d);padding:17px;display:grid;gap:13px;min-width:0}.sitezi-ms-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.sitezi-ms-card h3{margin:0;font-size:19px;overflow-wrap:anywhere}.sitezi-ms-type{margin-top:4px;color:#8295ac;font-size:12px}.sitezi-ms-status{flex:0 0 auto;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:950;letter-spacing:.4px}.sitezi-ms-status.published{background:#0d3b2a;color:#7ce9af;border:1px solid #1b6749}.sitezi-ms-status.draft{background:#132c4c;color:#80c1ff;border:1px solid #25598c}
      .sitezi-ms-meta{display:flex;justify-content:space-between;gap:12px;color:#8195ad;font-size:11px}.sitezi-ms-link{padding:10px 11px;border:1px solid #1c3a5d;border-radius:11px;background:#05101b;color:#6abaff;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sitezi-ms-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sitezi-ms-actions button,.sitezi-ms-actions a{display:flex;align-items:center;justify-content:center;min-height:42px;border-radius:11px;font-weight:900;font-size:12px;cursor:pointer;text-decoration:none}.sitezi-ms-primary{grid-column:1/-1;border:1px solid #176fff;background:#0b54ec;color:#fff}.sitezi-ms-secondary{border:1px solid #294663;background:#0a1827;color:#e7f1fc}.sitezi-ms-empty{grid-column:1/-1;padding:28px;border:1px dashed #2a4565;border-radius:16px;text-align:center;color:#91a5bd;line-height:1.6}.sitezi-ms-loading{padding:30px;text-align:center;color:#91a5bd}
      #siteziAutosaveStatus{display:none;align-items:center;justify-content:center;min-height:30px;padding:5px 9px;border-radius:999px;border:1px solid #23415f;background:#071522;color:#9db4cb;font:800 10px Inter,Arial,sans-serif;white-space:nowrap}#siteziAutosaveStatus.visible{display:inline-flex}#siteziAutosaveStatus[data-mode="saved"]{color:#84e7b5;border-color:#1d684a}#siteziAutosaveStatus[data-mode="error"]{color:#ff9d9d;border-color:#763939}
      @media(max-width:720px){.sitezi-ms-modal{align-items:end;padding:8px}.sitezi-ms-shell{width:100%;max-height:94dvh;border-radius:20px}.sitezi-ms-grid{grid-template-columns:1fr;padding:14px}.sitezi-ms-head{padding:17px}.sitezi-ms-toolbar{padding:14px 14px 0}.sitezi-ms-actions{grid-template-columns:1fr}.sitezi-ms-primary{grid-column:auto}.sitezi-ms-meta{display:grid;gap:4px}}
    `;
    document.head.appendChild(style);
  }

  function installSaveIndicator() {
    if ($("siteziAutosaveStatus")) return;
    const el = document.createElement("span");
    el.id = "siteziAutosaveStatus";
    el.setAttribute("aria-live", "polite");
    const wizardActions = document.querySelector(".wizard-actions");
    const next = $("nextBtn");
    if (wizardActions && next) wizardActions.insertBefore(el, next);
  }

  function installModal() {
    if ($("siteziMySitesModal")) return;
    const modal = document.createElement("div");
    modal.id = "siteziMySitesModal";
    modal.className = "sitezi-ms-modal hidden";
    modal.innerHTML = `
      <div class="sitezi-ms-shell" role="dialog" aria-modal="true" aria-labelledby="siteziMySitesTitle">
        <div class="sitezi-ms-head">
          <div><h2 id="siteziMySitesTitle">Meus Sites</h2><p>Seus rascunhos e sites publicados ficam guardados aqui.</p></div>
          <button id="siteziMySitesClose" class="sitezi-ms-close" type="button" aria-label="Fechar">×</button>
        </div>
        <div class="sitezi-ms-toolbar">
          <span id="siteziMySitesCount" class="sitezi-ms-count"></span>
          <button id="siteziMySitesNew" class="sitezi-ms-new" type="button">+ Criar novo site</button>
        </div>
        <div id="siteziMySitesBody" class="sitezi-ms-grid"></div>
      </div>`;
    document.body.appendChild(modal);

    $("siteziMySitesClose")?.addEventListener("click", closeMySites);
    $("siteziMySitesNew")?.addEventListener("click", createNewSite);
    modal.addEventListener("click", e => { if (e.target === modal) closeMySites(); });
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short" }).format(new Date(value));
    } catch (_) { return ""; }
  }

  function publicUrl(site) {
    return site?.status === "published" && site?.slug ? `${SITE_BASE_URL}/${site.slug}` : "";
  }

  async function copyText(text, button) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    if (button) {
      const before = button.textContent;
      button.textContent = "✓ Link copiado";
      setTimeout(() => button.textContent = before, 1600);
    }
  }

  function renderMySites(sites) {
    currentSites = Array.isArray(sites) ? sites : [];
    const body = $("siteziMySitesBody");
    const count = $("siteziMySitesCount");
    if (!body) return;
    if (count) count.textContent = `${currentSites.length} ${currentSites.length === 1 ? "site" : "sites"}`;

    if (!currentSites.length) {
      body.innerHTML = `<div class="sitezi-ms-empty"><b>Você ainda não possui sites salvos.</b><br>Comece um novo site e a SITEZI passará a salvá-lo automaticamente conforme você avançar.</div>`;
      return;
    }

    body.innerHTML = currentSites.map(site => {
      const url = publicUrl(site);
      const isPublished = !!url;
      return `<article class="sitezi-ms-card" data-site-id="${esc(site.id)}">
        <div class="sitezi-ms-card-top">
          <div><h3>${esc(site.business_name || "Meu site")}</h3><div class="sitezi-ms-type">${esc(site.business_type || "Site SITEZI")}</div></div>
          <span class="sitezi-ms-status ${isPublished ? "published" : "draft"}">${isPublished ? "PUBLICADO" : "RASCUNHO"}</span>
        </div>
        <div class="sitezi-ms-meta"><span>Última alteração</span><b>${esc(formatDate(site.updated_at) || "Agora")}</b></div>
        ${url ? `<div class="sitezi-ms-link" title="${esc(url)}">${esc(url)}</div>` : `<div class="sitezi-ms-link">Seu endereço aparecerá aqui quando publicar.</div>`}
        <div class="sitezi-ms-actions">
          <button class="sitezi-ms-primary" type="button" data-ms-edit="${esc(site.id)}">${isPublished ? "Editar site" : "Continuar editando"}</button>
          ${url ? `<a class="sitezi-ms-secondary" href="${esc(url)}" target="_blank" rel="noopener">Abrir site</a><button class="sitezi-ms-secondary" type="button" data-ms-copy="${esc(site.id)}">Copiar link</button>` : `<button class="sitezi-ms-secondary" type="button" data-ms-save="${esc(site.id)}">Salvar agora</button>`}
        </div>
      </article>`;
    }).join("");

    body.querySelectorAll("[data-ms-edit]").forEach(button => {
      button.addEventListener("click", () => openSiteEditor(button.dataset.msEdit));
    });
    body.querySelectorAll("[data-ms-copy]").forEach(button => {
      button.addEventListener("click", () => {
        const site = currentSites.find(x => x.id === button.dataset.msCopy);
        copyText(publicUrl(site), button);
      });
    });
    body.querySelectorAll("[data-ms-save]").forEach(button => {
      button.addEventListener("click", async () => {
        const site = currentSites.find(x => x.id === button.dataset.msSave);
        if (!site) return;
        if (sessionStorage.getItem(CURRENT_SITE_KEY) !== site.id) {
          openSiteEditor(site.id);
          return;
        }
        button.disabled = true;
        const before = button.textContent;
        button.textContent = "Salvando…";
        await saveNow({ force:true });
        button.textContent = "✓ Salvo";
        setTimeout(() => { button.textContent = before; button.disabled = false; }, 1200);
      });
    });
  }

  async function openMySites() {
    const a = auth();
    if (!user()) {
      a?.openLogin?.("login");
      return;
    }
    installModal();
    const modal = $("siteziMySitesModal");
    const body = $("siteziMySitesBody");
    modal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (body) body.innerHTML = `<div class="sitezi-ms-loading">Carregando seus sites…</div>`;
    try {
      const sites = await a.listMySites();
      renderMySites(sites);
    } catch (error) {
      console.error("[SITEZI MEUS SITES]", error);
      if (body) body.innerHTML = `<div class="sitezi-ms-empty">Não foi possível carregar seus sites agora. Tente novamente em instantes.</div>`;
    }
  }

  function closeMySites() {
    $("siteziMySitesModal")?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function clearCurrentSiteReference() {
    const u = user();
    sessionStorage.removeItem(CURRENT_SITE_KEY);
    if (u?.id) localStorage.removeItem(`sitezi_last_site_${u.id}`);
    lastSavedSignature = "";
  }

  function createNewSite() {
    clearCurrentSiteReference();
    closeMySites();
    const url = new URL(location.href);
    url.searchParams.delete(EDIT_PARAM);
    url.searchParams.delete("modelo");
    location.href = url.origin + url.pathname;
  }

  function openSiteEditor(siteId) {
    const u = user();
    if (!siteId || !u) return;
    sessionStorage.setItem(CURRENT_SITE_KEY, siteId);
    localStorage.setItem(`sitezi_last_site_${u.id}`, siteId);
    const url = new URL(location.href);
    url.searchParams.set(EDIT_PARAM, siteId);
    url.searchParams.delete("modelo");
    location.href = url.toString();
  }

  function renderRestoredProducts() {
    const s = state();
    const box = $("productDemoList");
    if (!s || !box) return;
    if (!Array.isArray(s.products) || !s.products.length) {
      box.innerHTML = `<div class="sitezi-builder-empty">Nenhum produto ou serviço adicionado ainda.</div>`;
      return;
    }
    box.innerHTML = s.products.map((p, i) => `
      <div class="sitezi-builder-item ${p.photo ? "has-photo" : ""}">
        ${p.photo ? `<img class="item-thumb" src="${esc(p.photo)}" alt="${esc(p.name || "")}">` : ""}
        <div><b>${esc(p.name || "")}</b>${p.price ? `<span>${esc(p.price)}</span>` : ""}${p.description ? `<small>${esc(p.description)}</small>` : ""}</div>
        <button type="button" data-sitezi-restored-remove="${i}">Remover</button>
      </div>`).join("");
    box.querySelectorAll("[data-sitezi-restored-remove]").forEach(button => {
      button.addEventListener("click", () => {
        s.products.splice(Number(button.dataset.siteziRestoredRemove), 1);
        renderRestoredProducts();
        window.dispatchEvent(new CustomEvent("sitezi:builder-state", { detail: clone(s) }));
      });
    });
  }

  function renderRestoredAssets() {
    const s = state();
    if (!s) return;

    const logoPreview = $("logoPreview");
    if (logoPreview) {
      if (s.logoData && /^https?:|^data:image\//i.test(s.logoData)) {
        logoPreview.innerHTML = `<img src="${esc(s.logoData)}" alt="Prévia da logo">`;
        logoPreview.classList.remove("hidden");
      } else {
        logoPreview.innerHTML = "";
        logoPreview.classList.add("hidden");
      }
    }

    const photoPreview = $("photoPreview");
    if (photoPreview) {
      const photos = Array.isArray(s.photos) ? s.photos.filter(Boolean) : [];
      photoPreview.innerHTML = photos.map(src => `<img src="${esc(src)}" alt="">`).join("");
      photoPreview.classList.toggle("hidden", !photos.length);
    }
  }

  function renderRestoredReview() {
    const s = state();
    const card = $("reviewCard");
    if (!s || !card) return;
    const tplMap = { modern:"Moderno", premium:"Premium", dynamic:"Dinâmico" };
    const template = tplMap[s.template] || "Modelo personalizado";
    const logo = s.logoMode === "ai" ? "Logo criada com IA" : s.logoMode === "upload" ? "Logo enviada" : "Nome como marca";
    const images = s.imageMode === "ai" ? "Imagem criada com IA" : s.imageMode === "upload" ? `${(s.photos || []).length} foto(s)` : "Visual do modelo";
    card.innerHTML = `
      <div class="review-row"><span>Negócio</span><b>${esc(s.businessType || "Outro")}</b></div>
      <div class="review-row"><span>Nome</span><b>${esc(s.businessName || "Meu site")}</b></div>
      <div class="review-row"><span>Modelo</span><b>${esc(template)}</b></div>
      <div class="review-row"><span>Produtos/serviços</span><b>${Array.isArray(s.products) ? s.products.length : 0}</b></div>
      <div class="review-row"><span>Identidade</span><b>${esc(logo)}</b></div>
      <div class="review-row"><span>Imagens</span><b>${esc(images)}</b></div>
      <div class="review-row"><span>Contato</span><b>${s.whatsapp ? "WhatsApp" : "E-mail"}</b></div>`;
  }

  function refreshWizardUI() {
    const s = state();
    if (!s) return;
    const step = Math.max(1, Math.min(8, Number(s.step || 1)));
    s.step = step;
    document.querySelectorAll(".step").forEach(el => el.classList.toggle("active", Number(el.dataset.step) === step));
    if ($("progressText")) $("progressText").textContent = `${step} de 8`;
    if ($("progressBar")) $("progressBar").style.width = `${step / 8 * 100}%`;
    if ($("backBtn")) $("backBtn").style.visibility = step === 1 ? "hidden" : "visible";
    if ($("nextBtn")) $("nextBtn").classList.toggle("hidden", step === 8);
    if (step === 8) renderRestoredReview();
  }

  function applySiteToBuilder(site) {
    const s = state();
    if (!s || !site) return;
    const cfg = site.configuration || {};

    restoring = true;
    try {
      s.step = Math.max(1, Math.min(8, Number(cfg.wizard_step || 2)));
      s.businessType = site.business_type || "Outro";
      s.businessName = site.business_name || "";
      s.slogan = cfg.slogan || "";
      s.template = site.template || "modern";
      s.color = cfg.color || "#1578ff";
      s.products = Array.isArray(cfg.products) ? clone(cfg.products) : [];
      s.whatsapp = cfg.whatsapp || "";
      s.instagram = cfg.instagram || "";
      s.email = cfg.email || "";
      s.location = cfg.location || "";
      s.logoMode = cfg.logo_mode || "text";
      s.logoData = cfg.logo_data || "";
      s.aiLogoGenerated = !!cfg.ai_logo_generated;
      s.imageMode = cfg.image_mode || "none";
      s.photos = Array.isArray(cfg.photos) ? clone(cfg.photos) : [];
      s.aiImageGenerated = !!cfg.ai_image_generated;

      if ($("businessName")) $("businessName").value = s.businessName;
      if ($("businessSlogan")) $("businessSlogan").value = s.slogan;
      if ($("whatsapp")) $("whatsapp").value = s.whatsapp;
      if ($("instagram")) $("instagram").value = s.instagram;
      if ($("email")) $("email").value = s.email;
      if ($("location")) $("location").value = s.location;
      if ($("colorPreview")) $("colorPreview").style.setProperty("--accent", s.color);

      document.querySelectorAll(".business").forEach(el => el.classList.toggle("active", el.dataset.business === s.businessType));
      document.querySelectorAll(".template-card").forEach(el => el.classList.toggle("active", el.dataset.template === s.template));
      document.querySelectorAll(".color").forEach(el => el.classList.toggle("active", String(el.dataset.color || "").toLowerCase() === String(s.color || "").toLowerCase()));
      document.querySelectorAll("[data-logo-mode]").forEach(el => {
        const mode = s.logoMode === "ai" ? "ai" : s.logoMode === "upload" ? "upload" : "text";
        el.classList.toggle("active", el.dataset.logoMode === mode);
      });
      document.querySelectorAll("[data-image-mode]").forEach(el => el.classList.toggle("active", el.dataset.imageMode === s.imageMode));

      renderRestoredProducts();
      renderRestoredAssets();
      refreshWizardUI();

      if (typeof window.SITEZI_SHOW_SCREEN === "function" && $("wizard")) window.SITEZI_SHOW_SCREEN($("wizard"));
      sessionStorage.setItem(CURRENT_SITE_KEY, site.id);
      const u = user();
      if (u?.id) localStorage.setItem(`sitezi_last_site_${u.id}`, site.id);
      lastSavedSignature = signature(s);
      safeBackup(s);

      window.dispatchEvent(new CustomEvent("sitezi:builder-state", { detail: clone(s) }));
    } finally {
      setTimeout(() => { restoring = false; }, 80);
    }
  }

  async function restoreRequestedSite() {
    const a = auth();
    const u = user();
    if (!a || !u || !state()) return false;

    const url = new URL(location.href);
    let id = url.searchParams.get(EDIT_PARAM) || "";
    const explicit = !!id;

    if (!id) {
      // Em um simples refresh, retoma automaticamente um rascunho da sessão atual.
      const sessionId = sessionStorage.getItem(CURRENT_SITE_KEY) || "";
      if (sessionId) {
        try {
          const { data, error } = await a.getClient().from("sites")
            .select("id,business_name,business_type,template,status,slug,configuration,updated_at,published_at")
            .eq("id", sessionId).eq("user_id", u.id).maybeSingle();
          if (!error && data?.id && data.status === "draft") id = data.id;
        } catch (_) {}
      }
    }

    if (!id) return false;

    const { data, error } = await a.getClient().from("sites")
      .select("id,business_name,business_type,template,status,slug,configuration,updated_at,published_at")
      .eq("id", id).eq("user_id", u.id).maybeSingle();
    if (error || !data?.id) {
      console.warn("[SITEZI MEUS SITES] Não foi possível retomar o site.", error);
      if (explicit) {
        url.searchParams.delete(EDIT_PARAM);
        history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      }
      return false;
    }

    applySiteToBuilder(data);
    if (explicit) {
      url.searchParams.delete(EDIT_PARAM);
      history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
    return true;
  }

  function hookAccountButton() {
    const button = $("siteziManageSite");
    if (!button || button.dataset.siteziMySitesHook === "1") return;
    button.dataset.siteziMySitesHook = "1";
    button.textContent = "Meus Sites";
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      $("siteziManageModal")?.classList.add("hidden");
      openMySites();
    }, true);
  }

  function hookNewSiteButtons() {
    ["startBtn", "topCreate", "newSite"].forEach(id => {
      const button = $(id);
      if (!button || button.dataset.siteziNewSiteHook === "1") return;
      button.dataset.siteziNewSiteHook = "1";
      button.addEventListener("click", () => clearCurrentSiteReference(), true);
    });
  }

  const WA_PREVIEW_STYLE_ID = "sitezi-whatsapp-clear-fix-style";

  function whatsappIconMarkup() {
    return `<span class="sitezi-wa-clear-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 20.5 11.7Z"/><path d="M8.7 8.2c.4 2.8 2.3 4.8 5.1 5.6l1.2-1.2c.2-.2.5-.3.8-.2l2 .7"/><path d="M8.7 8.2 9.4 6c.1-.3 0-.6-.2-.8L7.9 4"/></svg></span><span>WhatsApp</span>`;
  }

  function enhancePreviewWhatsApp(frame) {
    const s = state();
    const wa = normalizeWhatsApp(s?.whatsapp || "");
    if (!frame || !wa) return;
    try {
      const doc = frame.contentDocument;
      if (!doc?.body || !doc?.head) return;

      if (!doc.getElementById(WA_PREVIEW_STYLE_ID)) {
        const style = doc.createElement("style");
        style.id = WA_PREVIEW_STYLE_ID;
        style.textContent = `
          .sitezi-wa-clear{position:fixed!important;right:16px!important;bottom:16px!important;z-index:99999!important;display:inline-flex!important;align-items:center!important;gap:9px!important;min-height:52px!important;padding:9px 14px 9px 9px!important;border-radius:999px!important;background:#25D366!important;color:#fff!important;border:1px solid rgba(255,255,255,.22)!important;box-shadow:0 14px 38px rgba(0,0,0,.32)!important;text-decoration:none!important;font:900 13px Inter,Arial,sans-serif!important}
          .sitezi-wa-clear-icon{width:32px!important;height:32px!important;display:grid!important;place-items:center!important;border-radius:50%!important;background:rgba(255,255,255,.14)!important;flex:0 0 auto!important}.sitezi-wa-clear svg{width:23px!important;height:23px!important;display:block!important;color:#fff!important}.sitezi-wa-clear>span:last-child{white-space:nowrap!important}
          @media(max-width:520px){.sitezi-wa-clear{right:12px!important;bottom:12px!important}}
        `;
        doc.head.appendChild(style);
      }

      const candidates = [...doc.querySelectorAll('a[href*="wa.me"],a[href*="api.whatsapp.com"]')];
      let floating = candidates.find(a => {
        try {
          const cs = doc.defaultView?.getComputedStyle(a);
          return cs?.position === "fixed" || /whats|wa[-_]|floating|float/i.test(String(a.className || ""));
        } catch (_) { return false; }
      });

      if (!floating) {
        floating = doc.createElement("a");
        doc.body.appendChild(floating);
      }

      floating.classList.add("sitezi-wa-clear");
      floating.href = `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}`;
      floating.target = "_blank";
      floating.rel = "noopener";
      floating.setAttribute("aria-label", "Falar no WhatsApp");
      floating.innerHTML = whatsappIconMarkup();
    } catch (_) {}
  }

  function installWhatsAppPreviewFix() {
    ["sitePreview", "fullPreviewFrame"].forEach(id => {
      const frame = $(id);
      if (!frame) return;
      if (frame.dataset.siteziWhatsappFix !== "1") {
        frame.dataset.siteziWhatsappFix = "1";
        frame.addEventListener("load", () => setTimeout(() => enhancePreviewWhatsApp(frame), 60));
      }
      enhancePreviewWhatsApp(frame);
    });
  }

  function installListeners() {
    window.addEventListener("sitezi:builder-state", event => {
      if (restoring) return;
      safeBackup(event.detail || state());
      scheduleAutosave();
    });

    window.addEventListener("sitezi:auth-state", async event => {
      hookAccountButton();
      if (event.detail?.loggedIn) {
        await restoreRequestedSite();
        scheduleAutosave();
      }
    });

    document.addEventListener("input", event => {
      if (restoring) return;
      if (syncInputToState(event.target)) scheduleAutosave();
    }, true);

    document.addEventListener("change", event => {
      if (restoring) return;
      if (syncInputToState(event.target)) scheduleAutosave();
    }, true);

    document.addEventListener("click", event => {
      if (restoring) return;
      if (event.target?.closest?.(".business,.template-card,.color,[data-logo-mode],[data-image-mode],#addProduct,#nextBtn,#saveNameContinue,#backBtn")) {
        setTimeout(() => scheduleAutosave(), 180);
      }
    }, true);

    window.addEventListener("pagehide", () => {
      safeBackup(state());
      if (user() && meaningfulBuilderState(state()) && !saving) {
        // O save assíncrono pode ser cancelado pelo navegador; o backup local cobre este caso.
        scheduleAutosave({ force:true });
      }
    });
  }

  async function waitForCore(timeout = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (window.SITEZI_AUTH && window.SITEZI_BUILDER_STATE) return true;
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    return false;
  }

  async function init() {
    if (ready) return;
    installStyles();
    installModal();
    installListeners();

    const ok = await waitForCore();
    if (!ok) {
      console.warn("[SITEZI MEUS SITES] Núcleo da SITEZI não ficou disponível a tempo.");
      return;
    }

    ready = true;
    hookAccountButton();
    hookNewSiteButtons();
    installWhatsAppPreviewFix();

    const a = auth();
    if (a?.isLoggedIn?.()) await restoreRequestedSite();

    // Alguns elementos são montados/atualizados depois do login; garante que o botão continue correto.
    setInterval(() => {
      hookAccountButton();
      hookNewSiteButtons();
      installWhatsAppPreviewFix();
    }, 1200);

    document.documentElement.dataset.siteziMySites = "1.0";
    console.info("[SITEZI] Meus Sites + Autosave v1.0 carregado.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();
