/* =========================================================
   SITEZI — DIRETOR IA v3.0
   Substitui sitezi-ai-client.js

   Objetivo:
   - preservar o gerador e o motor visual existentes;
   - dar à IA liberdade para dirigir identidade, layout e conteúdo;
   - nunca inventar fatos comerciais;
   - integrar logo/imagem IA já existentes;
   - respeitar plano e créditos do backend.
   ========================================================= */
(() => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/sitezi-ai`;

  const $ = id => document.getElementById(id);
  let clientPromise = null;
  let installed = false;
  let baseGenerate = null;

  const clean = (value, max = 500) =>
    String(value ?? "").trim().replace(/\s{3,}/g, " ").slice(0, max);

  function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then(mod => mod.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }));
    return clientPromise;
  }

  async function getSession({ required = true } = {}) {
    const sb = await getClient();
    const { data, error } = await sb.auth.getSession();
    if (error) throw new Error("Não foi possível verificar sua sessão.");
    if (!data.session?.access_token && required) {
      const err = new Error("Entre na sua conta SITEZI para usar o Diretor IA.");
      err.code = "AUTH_REQUIRED";
      throw err;
    }
    return data.session || null;
  }

  function state() {
    if (!window.SITEZI_BUILDER_STATE) window.SITEZI_BUILDER_STATE = {};
    return window.SITEZI_BUILDER_STATE;
  }

  function selectedBusinessType() {
    return clean(
      state().businessType ||
      document.querySelector(".business.active")?.dataset.business ||
      "Outro",
      80
    );
  }

  function selectedTemplate() {
    return clean(
      state().template ||
      document.querySelector(".template-card.active")?.dataset.template ||
      "modern",
      60
    );
  }

  function collectProducts() {
    const s = state();
    if (Array.isArray(s.products) && s.products.length) {
      return s.products.slice(0, 30).map(p => ({
        name: clean(p?.name, 90),
        price: clean(p?.price, 40),
        description: clean(p?.description, 240),
        photo: p?.photo || ""
      }));
    }

    const services = clean($("servicesInput")?.value, 1200);
    if (!services) return [];
    return services.split(/\n|;/)
      .map(x => clean(x, 140))
      .filter(Boolean)
      .slice(0, 12)
      .map(name => ({ name, price: "", description: "", photo: "" }));
  }

  function buildBrief(mode = "director") {
    const s = state();
    return {
      mode,
      businessType: selectedBusinessType(),
      businessName: clean(s.businessName || $("businessName")?.value, 80),
      slogan: clean(s.slogan || $("businessSlogan")?.value, 180),
      services: clean($("servicesInput")?.value, 1200),
      products: collectProducts().map(({name, price, description}) => ({
        name, price, description
      })),
      template: selectedTemplate(),
      color: clean(s.color, 24),
      location: clean(s.location, 120),
      instagram: clean(s.instagram, 120),
      whatsapp: clean(s.whatsapp || $("whatsapp")?.value, 40),
      customerDescription: clean(
        s.description ||
        $("businessDescription")?.value ||
        $("descriptionInput")?.value ||
        "",
        1800
      ),
      siteId: sessionStorage.getItem("sitezi_current_site_id") || null
    };
  }

  async function callAI(mode = "director") {
    const session = await getSession({ required: mode === "director" });
    const token = session?.access_token || SUPABASE_KEY;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mode === "director" ? 70000 : 45000);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(buildBrief(mode)),
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
    } finally {
      clearTimeout(timeout);
    }
  }

  function setButtonLoading(button, on, text = "Edu está criando seu site...") {
    if (!button) return;
    if (on) {
      if (!button.dataset.siteziDirectorOriginal) {
        button.dataset.siteziDirectorOriginal = button.innerHTML;
      }
      button.disabled = true;
      button.innerHTML = `${text} <b>✦</b>`;
    } else {
      button.disabled = false;
      if (button.dataset.siteziDirectorOriginal) {
        button.innerHTML = button.dataset.siteziDirectorOriginal;
      }
    }
  }

  function openLogin() {
    if (typeof window.SITEZI_AUTH?.openLogin === "function") {
      window.SITEZI_AUTH.openLogin("login");
      return;
    }
    window.dispatchEvent(new CustomEvent("sitezi:open-login", {
      detail: { mode: "login" }
    }));
  }

  function openPlans(message) {
    if (message) alert(message);
    if (typeof window.SITEZI_SHOW_SCREEN === "function" && $("plans")) {
      window.SITEZI_SHOW_SCREEN($("plans"));
    }
  }

  function mergeDirectorPlan(plan) {
    if (!plan || typeof plan !== "object") return;

    const s = state();
    const design = plan.design || {};
    const content = plan.content || {};

    const allowedTemplates = new Set([
      "modern", "premium", "dynamic",
      "barber-signature", "restaurant-flavor", "fashion-urban",
      "beauty-essence", "auto-drive", "professional-neo"
    ]);

    if (allowedTemplates.has(design.template)) s.template = design.template;
    if (/^#[0-9a-f]{6}$/i.test(design.primaryColor || "")) s.color = design.primaryColor;

    if (content.businessName && !s.businessName) s.businessName = clean(content.businessName, 80);
    if (content.slogan) s.slogan = clean(content.slogan, 180);

    if (Array.isArray(content.services) && content.services.length) {
      const existing = Array.isArray(s.products) ? s.products : [];
      const hasRealProducts = existing.some(p => clean(p?.name));

      if (!hasRealProducts) {
        s.products = content.services.slice(0, 12).map(item => ({
          name: clean(item?.title, 90),
          price: "",
          description: clean(item?.description, 240),
          photo: ""
        })).filter(x => x.name);
      } else {
        s.products = existing.map((p, index) => {
          const ai = content.services[index];
          if (!ai) return p;
          return {
            ...p,
            name: p.name || clean(ai.title, 90),
            description: p.description || clean(ai.description, 240)
          };
        });
      }
    }

    s.aiDirector = {
      version: "3.0",
      generatedAt: new Date().toISOString(),
      design,
      content,
      sections: Array.isArray(plan.sections) ? plan.sections : [],
      assetPlan: plan.assetPlan || {},
      safety: plan.safety || {}
    };

    const templateCard = document.querySelector(
      `.template-card[data-template="${CSS.escape(s.template || "")}"]`
    );
    if (templateCard) {
      document.querySelectorAll(".template-card").forEach(el => el.classList.remove("active"));
      templateCard.classList.add("active");
    }

    const sloganInput = $("businessSlogan");
    if (sloganInput && s.slogan) sloganInput.value = s.slogan;

    window.dispatchEvent(new CustomEvent("sitezi:director-plan-applied", {
      detail: { plan: s.aiDirector }
    }));
  }

  function waitForAsset(eventName, timeoutMs = 65000) {
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        window.removeEventListener(eventName, handler);
        reject(new Error("A geração do recurso demorou mais que o esperado."));
      }, timeoutMs);

      const handler = event => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener(eventName, handler);
        resolve(event.detail || {});
      };

      window.addEventListener(eventName, handler, { once: true });
    });
  }

  async function generateSelectedAssets(plan) {
    const s = state();
    const assetPlan = plan?.assetPlan || {};

    const logoMode = document.querySelector('[data-logo-mode="ai"]');
    const imageMode = document.querySelector('[data-image-mode="ai"]');

    const wantsLogo =
      assetPlan.logo === true ||
      logoMode?.classList.contains("active");

    const wantsHero =
      assetPlan.heroImage === true ||
      imageMode?.classList.contains("active");

    if (wantsLogo && !s.logoData && logoMode) {
      try {
        const pending = waitForAsset("sitezi:ai-logo-generated");
        logoMode.click();
        await pending;
      } catch (e) {
        console.warn("[SITEZI DIRETOR] Logo não foi gerada; seguindo com marca em texto.", e);
      }
    }

    if (wantsHero && !(Array.isArray(s.photos) && s.photos.length) && imageMode) {
      try {
        const pending = waitForAsset("sitezi:ai-image-generated");
        imageMode.click();
        await pending;
      } catch (e) {
        console.warn("[SITEZI DIRETOR] Imagem não foi gerada; seguindo com composição do modelo.", e);
      }
    }
  }

  function waitForFrame(frame, timeoutMs = 5000) {
    return new Promise(resolve => {
      if (!frame) return resolve(null);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        frame.removeEventListener("load", finish);
        resolve(frame.contentDocument || null);
      };
      frame.addEventListener("load", finish, { once: true });
      setTimeout(finish, timeoutMs);
      setTimeout(() => {
        if (!done && frame.contentDocument?.body?.innerHTML) finish();
      }, 120);
    });
  }

  const replaceText = (el, value) => {
    const text = clean(value, 1200);
    if (el && text) el.textContent = text;
  };

  function applyDirectorContent(doc, plan) {
    if (!doc || !plan) return;
    const content = plan.content || {};

    replaceText(doc.querySelector(".hero h1"), content.heroTitle || content.slogan);
    replaceText(doc.querySelector(".hero p"), content.heroText);

    const about = doc.querySelector("#sobre");
    if (about) {
      const paragraphs = [...about.querySelectorAll("p")];
      if (paragraphs[0]) replaceText(paragraphs[0], content.about);
    }

    if (Array.isArray(content.services)) {
      const cards = [...doc.querySelectorAll("#servicos .service-card, #servicos .services article")];
      cards.forEach((card, i) => {
        const item = content.services[i];
        if (!item) return;
        replaceText(card.querySelector("h3"), item.title);
        replaceText(card.querySelector("p"), item.description);
      });
    }

    if (Array.isArray(content.trustPoints)) {
      const trust = [...doc.querySelectorAll(".trustitem b, .trust-item b")];
      trust.forEach((el, i) => {
        if (content.trustPoints[i]) replaceText(el, content.trustPoints[i]);
      });
    }

    if (content.cta) {
      [...doc.querySelectorAll(".hero .btn, #contato .btn, .contact .btn")].forEach((el, i) => {
        if (i === 0 || el.textContent?.includes("→")) {
          el.textContent = `${clean(content.cta, 80)} →`;
        }
      });
    }

    doc.documentElement.dataset.siteziDirector = "3.0";
  }

  async function enrichPreview(plan) {
    const frame = $("sitePreview");
    const doc = await waitForFrame(frame);
    if (!doc) return;
    applyDirectorContent(doc, plan);
    frame.srcdoc = "<!doctype html>\n" + doc.documentElement.outerHTML;
  }

  function showCreditsResult(data) {
    const remaining = data?.remainingDirectorCredits;
    const cost = data?.cost;
    if (typeof remaining !== "number") return;

    window.dispatchEvent(new CustomEvent("sitezi:credits-changed", {
      detail: { kind: "director", remaining, cost }
    }));

    try {
      const p = window.SITEZI_ACCOUNT_STATE?.refresh?.();
      if (p?.catch) p.catch(() => {});
    } catch (_) {}
  }

  async function handleDirectorGenerate(event, button) {
    event?.preventDefault();

    setButtonLoading(button, true);

    try {
      const data = await callAI("director");
      const plan = data.generated;

      mergeDirectorPlan(plan);
      showCreditsResult(data);

      await generateSelectedAssets(plan);

      if (typeof baseGenerate !== "function") {
        throw new Error("O gerador principal do SITEZI não foi encontrado.");
      }

      await baseGenerate.call(button, event);
      await enrichPreview(plan);

      console.info("[SITEZI] Diretor IA v3 concluiu a criação.", {
        cost: data.cost,
        remaining: data.remainingDirectorCredits
      });
    } catch (error) {
      console.error("[SITEZI DIRETOR]", error);

      if (error?.code === "AUTH_REQUIRED" || error?.code === "invalid_session") {
        openLogin();
        return;
      }

      if (
        error?.code === "plan_not_allowed" ||
        error?.code === "subscription_required"
      ) {
        openPlans(error.message);
        return;
      }

      if (error?.code === "no_director_credits") {
        alert(error.message || "Seus créditos do Diretor IA acabaram para este ciclo.");
        return;
      }

      // Falha de IA nunca derruba o gerador já aprovado.
      const useSafeFallback = confirm(
        "O Diretor IA não conseguiu concluir esta criação agora. " +
        "Deseja gerar o site pelo modo seguro do SITEZI sem gastar novos créditos?"
      );

      if (useSafeFallback && typeof baseGenerate === "function") {
        await baseGenerate.call(button, event);
      }
    } finally {
      setButtonLoading(button, false);
    }
  }

  function installSuggestionAI() {
    const button = $("suggestBrand");
    if (!button || button.dataset.siteziDirectorSuggestion === "1") return;
    button.dataset.siteziDirectorSuggestion = "1";

    const oldHandler = button.onclick;

    button.onclick = async event => {
      event?.preventDefault();

      const name = clean($("businessName")?.value, 80);
      if (!name) {
        alert("Digite primeiro o nome do seu negócio.");
        return;
      }

      setButtonLoading(button, true, "Edu está pensando...");

      try {
        const data = await callAI("suggestion");
        const suggestion = clean(
          data?.generated?.slogan || data?.generated?.heroTitle,
          180
        );

        if (!suggestion) throw new Error("A IA não retornou uma sugestão.");

        const box = $("suggestionBox");
        if (box) {
          box.innerHTML = "";
          const title = document.createElement("b");
          title.textContent = "Sugestão do Edu: ";
          const text = document.createElement("span");
          text.textContent = suggestion;
          const br = document.createElement("br");
          const use = document.createElement("button");
          use.type = "button";
          use.textContent = "Usar esta sugestão";
          use.onclick = () => {
            if ($("businessSlogan")) $("businessSlogan").value = suggestion;
            box.classList.add("hidden");
          };
          box.append(title, text, br, use);
          box.classList.remove("hidden");
        }
      } catch (error) {
        console.warn("[SITEZI DIRETOR] Sugestão IA indisponível.", error);
        if (typeof oldHandler === "function") oldHandler.call(button, event);
      } finally {
        setButtonLoading(button, false);
      }
    };
  }

  function installDirectorGenerate() {
    const button = $("generateSite");
    if (!button || button.dataset.siteziDirectorInstalled === "1") return false;

    // Este arquivo carrega antes do motor premium. A instalação é feita no window.load,
    // quando o último onclick já é o gerador aprovado.
    baseGenerate = button.onclick;

    if (typeof baseGenerate !== "function") {
      console.warn("[SITEZI DIRETOR] Gerador base ainda não disponível.");
      return false;
    }

    button.dataset.siteziDirectorInstalled = "1";
    button.onclick = event => handleDirectorGenerate(event, button);

    document.documentElement.dataset.siteziDirectorAi = "3.0";
    console.info("[SITEZI] Diretor IA v3.0 conectado ao gerador aprovado.");
    return true;
  }

  function install() {
    if (installed) return;
    installSuggestionAI();

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (installDirectorGenerate() || tries >= 30) {
        clearInterval(timer);
        installed = true;
      }
    }, 100);
  }

  // Importante: window.load ocorre depois de todos os scripts do index,
  // inclusive sitezi-premium-engine.js, evitando perder o onclick final.
  if (document.readyState === "complete") {
    setTimeout(install, 0);
  } else {
    window.addEventListener("load", () => setTimeout(install, 0), { once: true });
  }
})();
