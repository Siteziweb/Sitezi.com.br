/* =========================================================
   SITEZI — DIRETOR IA v4.0
   - uma única ação: gerar o site inteiro com IA
   - logo/imagem IA não aparecem mais como etapas separadas
   - usa uma carteira real de créditos SITEZI
   - usa assets devolvidos pelo Diretor IA sem cobrança extra
   - falha da IA NÃO gera automaticamente um site genérico
   ========================================================= */
(() => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/sitezi-ai`;
  const $ = id => document.getElementById(id);

  let clientPromise = null;
  let baseGenerate = null;
  let installed = false;
  let accountInfo = null;

  const clean = (v, max = 500) => String(v ?? "").trim().replace(/\s{3,}/g, " ").slice(0, max);
  const state = () => window.SITEZI_BUILDER_STATE || (window.SITEZI_BUILDER_STATE = {});

  async function getClient() {
    if (!clientPromise) {
      clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
        .then(mod => mod.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }));
    }
    return clientPromise;
  }

  async function getSession() {
    const sb = await getClient();
    const { data, error } = await sb.auth.getSession();
    if (error) throw new Error("Não foi possível verificar sua sessão.");
    if (!data.session?.access_token) {
      const err = new Error("Entre na sua conta SITEZI para gerar o site com IA.");
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    return data.session;
  }

  function collectProducts() {
    const s = state();
    if (Array.isArray(s.products)) {
      return s.products.slice(0, 30).map(p => ({
        name: clean(p?.name, 90), price: clean(p?.price, 40), description: clean(p?.description, 260)
      }));
    }
    return [];
  }

  function buildBrief() {
    const s = state();
    return {
      mode: "director",
      businessType: clean(s.businessType || document.querySelector(".business.active")?.dataset.business || "Outro", 80),
      businessName: clean(s.businessName || $("businessName")?.value, 80),
      slogan: clean(s.slogan || $("businessSlogan")?.value, 180),
      services: clean($("servicesInput")?.value, 1200),
      products: collectProducts(),
      template: clean(s.template || document.querySelector(".template-card.active")?.dataset.template || "modern", 60),
      color: clean(s.color, 24),
      location: clean(s.location, 120),
      instagram: clean(s.instagram, 120),
      whatsapp: clean(s.whatsapp || $("whatsapp")?.value, 40),
      customerDescription: clean(s.description || $("businessDescription")?.value || $("descriptionInput")?.value || "", 1800),
      hasLogo: !!s.logoData,
      hasPhotos: Array.isArray(s.photos) && s.photos.length > 0,
      siteId: sessionStorage.getItem("sitezi_current_site_id") || null
    };
  }

  function planCost() {
    const p = String(accountInfo?.plan || window.SITEZI_ACCOUNT_STATE?.getInfo?.()?.plan || "").toLowerCase();
    if (p.includes("profissional")) return 30;
    if (p.includes("premium") || p.includes("master")) return 20;
    return null;
  }

  async function callDirector() {
    const session = await getSession();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(buildBrief()),
        signal: controller.signal
      });
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error("A IA respondeu em formato inválido."); }
      if (!response.ok || data?.ok === false) {
        const err = new Error(data?.error || `Erro ${response.status} ao consultar a IA.`);
        err.code = data?.reason || data?.code || "AI_ERROR";
        err.details = data;
        throw err;
      }
      return data;
    } finally { clearTimeout(timeout); }
  }

  function prepareSingleAIFlow() {
    const logoAI = document.querySelector('[data-logo-mode="ai"]');
    const imageAI = document.querySelector('[data-image-mode="ai"]');
    if (logoAI) logoAI.style.display = "none";
    if (imageAI) imageAI.style.display = "none";

    const step6 = document.querySelector('.step[data-step="6"]');
    const step7 = document.querySelector('.step[data-step="7"]');
    const step8 = document.querySelector('.step[data-step="8"]');

    if (step6) {
      const h = step6.querySelector(".step-copy h2");
      const p = step6.querySelector(".step-copy p");
      if (h) h.textContent = "Você já tem uma logo?";
      if (p) p.textContent = "Envie sua logo se tiver. Se não tiver, o Diretor IA cria a identidade do site para você.";
      const textCard = step6.querySelector('[data-logo-mode="text"] b');
      const textSmall = step6.querySelector('[data-logo-mode="text"] small');
      if (textCard) textCard.textContent = "Não tenho logo";
      if (textSmall) textSmall.textContent = "A IA vai criar a direção visual e usar o nome da marca quando for melhor.";
    }

    if (step7) {
      const h = step7.querySelector(".step-copy h2");
      const p = step7.querySelector(".step-copy p");
      if (h) h.textContent = "Você já tem fotos do seu negócio?";
      if (p) p.textContent = "Envie suas fotos se quiser. Se não tiver, a IA decide a melhor solução visual para o site.";
      const none = step7.querySelector('[data-image-mode="none"] b');
      const noneSmall = step7.querySelector('[data-image-mode="none"] small');
      if (none) none.textContent = "Não tenho fotos";
      if (noneSmall) noneSmall.textContent = "O Diretor IA poderá criar uma imagem adequada ao seu ramo quando necessário.";
    }

    if (step8) {
      const h = step8.querySelector(".step-copy h2");
      const p = step8.querySelector(".step-copy p");
      if (h) h.textContent = "Tudo pronto para a IA criar seu site.";
      if (p) p.textContent = "O Diretor IA vai definir design, textos, identidade e imagens em uma única criação.";
      const btn = $("generateSite");
      if (btn) btn.innerHTML = "Gerar meu site inteiro com IA <b>✦</b>";

      if (!step8.querySelector(".sitezi-director-cost-note")) {
        const note = document.createElement("div");
        note.className = "sitezi-director-cost-note sitezi-ai-plan-note";
        note.textContent = "A criação usa um único saldo de créditos SITEZI. O custo será confirmado antes de gerar.";
        btn?.insertAdjacentElement("afterend", note);
      }
    }
  }

  function mergePlan(plan, assets) {
    const s = state();
    const design = plan?.design || {};
    const content = plan?.content || {};
    const allowed = new Set(["modern","premium","dynamic","barber-signature","restaurant-flavor","fashion-urban","beauty-essence","auto-drive","professional-neo"]);

    if (allowed.has(design.template)) s.template = design.template;
    if (/^#[0-9a-f]{6}$/i.test(design.primaryColor || "")) s.color = design.primaryColor;
    if (content.businessName && !s.businessName) s.businessName = clean(content.businessName, 80);
    if (content.slogan) s.slogan = clean(content.slogan, 180);

    const existing = Array.isArray(s.products) ? s.products : [];
    if (Array.isArray(content.services) && content.services.length) {
      if (!existing.some(p => clean(p?.name))) {
        s.products = content.services.slice(0, 12).map(item => ({
          name: clean(item?.title, 90), price: "", description: clean(item?.description, 260), photo: ""
        })).filter(x => x.name);
      } else {
        s.products = existing.map((p, i) => ({
          ...p,
          name: p.name || clean(content.services[i]?.title, 90),
          description: p.description || clean(content.services[i]?.description, 260)
        }));
      }
    }

    if (assets?.logo && !s.logoData) {
      s.logoData = assets.logo;
      s.logoMode = "upload";
      s.aiLogoGenerated = true;
    }
    if (assets?.heroImage && !(Array.isArray(s.photos) && s.photos.length)) {
      s.photos = [assets.heroImage];
      s.imageMode = "upload";
      s.aiImageGenerated = true;
    }

    s.aiDirector = {
      version: "4.0",
      generatedAt: new Date().toISOString(),
      design,
      content,
      sections: Array.isArray(plan?.sections) ? plan.sections : [],
      safety: plan?.safety || {},
      assetWarnings: assets?.warnings || []
    };
  }

  const replaceText = (el, value) => { const text = clean(value, 1200); if (el && text) el.textContent = text; };

  function applyDirectorContent(doc, plan) {
    if (!doc || !plan) return;
    const c = plan.content || {};
    replaceText(doc.querySelector(".hero h1"), c.heroTitle || c.slogan);
    replaceText(doc.querySelector(".hero p"), c.heroText);
    replaceText(doc.querySelector("#sobre p"), c.about);

    const cards = [...doc.querySelectorAll("#servicos .service-card, #servicos .services article")];
    if (Array.isArray(c.services)) cards.forEach((card, i) => {
      const item = c.services[i]; if (!item) return;
      replaceText(card.querySelector("h3"), item.title);
      replaceText(card.querySelector("p"), item.description);
    });

    if (Array.isArray(c.trustPoints)) {
      const trust = [...doc.querySelectorAll(".trustitem b, .trust-item b")];
      trust.forEach((el, i) => c.trustPoints[i] && replaceText(el, c.trustPoints[i]));
    }

    if (c.cta) [...doc.querySelectorAll(".hero .btn, #contato .btn, .contact .btn")].forEach((el, i) => {
      if (i === 0 || el.textContent?.includes("→")) el.textContent = `${clean(c.cta, 80)} →`;
    });

    doc.documentElement.dataset.siteziDirector = "4.0";
  }

  async function enrichPreview(plan) {
    const frame = $("sitePreview");
    if (!frame) return;
    await new Promise(resolve => {
      let done = false;
      const finish = () => { if (done) return; done = true; frame.removeEventListener("load", finish); resolve(); };
      frame.addEventListener("load", finish, { once: true });
      setTimeout(finish, 5000);
    });
    const doc = frame.contentDocument;
    if (!doc) return;
    applyDirectorContent(doc, plan);
    frame.srcdoc = "<!doctype html>\n" + doc.documentElement.outerHTML;
  }

  function setLoading(btn, on) {
    if (!btn) return;
    if (on) {
      if (!btn.dataset.siteziDirectorOriginal) btn.dataset.siteziDirectorOriginal = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Edu está criando seu site inteiro... <b>✦</b>";
    } else {
      btn.disabled = false;
      if (btn.dataset.siteziDirectorOriginal) btn.innerHTML = btn.dataset.siteziDirectorOriginal;
    }
  }

  function openLogin() {
    if (typeof window.SITEZI_AUTH?.openLogin === "function") return window.SITEZI_AUTH.openLogin("login");
    window.dispatchEvent(new CustomEvent("sitezi:open-login", { detail: { mode: "login" } }));
  }

  function openPlans(message) {
    if (message) alert(message);
    if (typeof window.SITEZI_SHOW_SCREEN === "function" && $("plans")) window.SITEZI_SHOW_SCREEN($("plans"));
  }

  async function handleGenerate(event, btn) {
    event?.preventDefault();
    const cost = planCost();
    if (cost != null) {
      const ok = confirm(`A criação completa com IA usará ${cost} créditos SITEZI. Isso inclui direção de design, textos e os recursos visuais necessários. Deseja continuar?`);
      if (!ok) return;
    }

    setLoading(btn, true);
    try {
      const data = await callDirector();
      mergePlan(data.generated, data.assets || {});

      if (typeof baseGenerate !== "function") throw new Error("O gerador principal do SITEZI não foi encontrado.");
      await baseGenerate.call(btn, event);
      await enrichPreview(data.generated);

      window.dispatchEvent(new CustomEvent("sitezi:credits-changed", { detail: { kind: "site", remaining: data.remainingCredits, cost: data.cost } }));
      try { await window.SITEZI_ACCOUNT_STATE?.refresh?.(); } catch (_) {}

      if (Array.isArray(data.assets?.warnings) && data.assets.warnings.length) {
        console.warn("[SITEZI DIRETOR] Site concluído com aviso de asset:", data.assets.warnings);
      }
    } catch (error) {
      console.error("[SITEZI DIRETOR]", error);
      if (error?.name === "AbortError") {
        alert("A criação demorou mais que o esperado e foi interrompida. Nenhum site genérico foi gerado. Tente novamente em alguns instantes.");
      } else if (error?.code === "AUTH_REQUIRED" || error?.code === "invalid_session") {
        openLogin();
      } else if (error?.code === "plan_not_allowed" || error?.code === "subscription_required") {
        openPlans(error.message);
      } else if (error?.code === "no_credits") {
        alert(error.message || "Você não possui créditos suficientes para esta criação.");
      } else {
        const detail = error?.details?.providerCode ? `\nCódigo: ${error.details.providerCode}` : "";
        alert(`${error?.message || "O Diretor IA não conseguiu concluir esta criação."}${detail}\n\nNenhum site genérico foi gerado e, se houve cobrança, os créditos foram devolvidos.`);
      }
    } finally { setLoading(btn, false); }
  }

  function install() {
    if (installed) return;
    const btn = $("generateSite");
    if (!btn) return;
    prepareSingleAIFlow();
    baseGenerate = btn.onclick;
    btn.onclick = event => handleGenerate(event, btn);
    installed = true;
    document.documentElement.dataset.siteziDirectorClient = "4.0";
  }

  window.addEventListener("sitezi:account-info", e => { accountInfo = e.detail || null; });
  window.addEventListener("load", () => setTimeout(install, 0), { once: true });
  if (document.readyState === "complete") setTimeout(install, 0);
})();
