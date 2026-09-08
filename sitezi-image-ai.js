/* =========================================================
   SITEZI — IA DE IMAGENS + CRÉDITOS v1.0
   Arquivo isolado para ligar:
   - "Criar logo com IA"
   - "Gerar com IA"

   Regras:
   - exige usuário autenticado
   - usa o JWT da sessão atual
   - chama a Edge Function "sitezi-images"
   - o backend valida assinatura + saldo
   - o backend desconta 1 crédito de forma atômica
   - se a OpenAI falhar, o backend devolve o crédito
   - frontend NUNCA decide saldo

   IMPORTANTE:
   - não coloque chave da OpenAI aqui
   - este arquivo usa somente a chave pública do Supabase
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";

  const IMAGES_ENDPOINT = `${SUPABASE_URL}/functions/v1/sitezi-images`;

  const $ = (id) => document.getElementById(id);

  function clean(value, max = 400) {
    return String(value || "").trim().slice(0, max);
  }

  function selectedBusinessType() {
    return document.querySelector(".business.active")?.dataset.business || "Outro";
  }

  function selectedTemplate() {
    return document.querySelector(".template-card.active")?.dataset.template || "modern";
  }

  function selectedColor() {
    return document.querySelector(".color.active")?.dataset.color || "#1578ff";
  }

  function businessName() {
    return clean($("businessName")?.value, 80) || "Meu negócio";
  }

  function slogan() {
    return clean($("businessSlogan")?.value, 180);
  }

  function services() {
    return clean($("servicesInput")?.value, 500);
  }

  async function getSupabaseClient() {
    if (window.siteziSupabase) {
      return window.siteziSupabase;
    }

    if (window.supabase?.createClient) {
      window.siteziSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );
      return window.siteziSupabase;
    }

    const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    window.siteziSupabase = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window.siteziSupabase;
  }

  async function getSessionOrThrow() {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw new Error("Não foi possível verificar sua sessão.");
    }

    const session = data?.session;

    if (!session?.access_token) {
      const err = new Error("Você precisa entrar na sua conta para usar a IA.");
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    return session;
  }

  async function getBalances() {
    try {
      const client = await getSupabaseClient();
      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) return null;

      const { data, error } = await client
        .from("ai_balances")
        .select("image_credits, logo_credits, reset_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return null;
      return data || null;
    } catch {
      return null;
    }
  }

  function buildPrompt(kind) {
    const type = selectedBusinessType();
    const name = businessName();
    const brandSlogan = slogan();
    const svc = services();
    const template = selectedTemplate();
    const color = selectedColor();

    if (kind === "logo") {
      return [
        `Crie uma logo profissional para um negócio chamado "${name}".`,
        `Segmento: ${type}.`,
        brandSlogan ? `Slogan: ${brandSlogan}.` : "",
        `Estilo do site: ${template}.`,
        `Cor principal: ${color}.`,
        "A logo deve ser simples, legível, moderna, comercial e funcionar bem em site.",
        "Evite mockups, fotos, papelaria, paredes e fundos complexos.",
        "Prefira símbolo + nome da marca em composição limpa."
      ].filter(Boolean).join(" ");
    }

    return [
      `Crie uma imagem profissional para o site de "${name}".`,
      `Segmento: ${type}.`,
      brandSlogan ? `Slogan/posicionamento: ${brandSlogan}.` : "",
      svc ? `Serviços/produtos: ${svc}.` : "",
      `Estilo visual: ${template}.`,
      `Cor principal da marca: ${color}.`,
      "A imagem deve parecer fotografia comercial premium para hero de site.",
      "Sem texto escrito na imagem, sem marcas d'água e sem logotipos de terceiros."
    ].filter(Boolean).join(" ");
  }

  async function callImageAI(kind) {
    const session = await getSessionOrThrow();

    const body = {
      purpose: kind === "logo" ? "logo" : "image",
      prompt: buildPrompt(kind),
      businessType: selectedBusinessType(),
      businessName: businessName(),
      template: selectedTemplate(),
      color: selectedColor()
    };

    const siteId = sessionStorage.getItem("sitezi_current_site_id");
    if (siteId) {
      body.siteId = siteId;
    }

    const response = await fetch(IMAGES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });

    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error("A IA respondeu em formato inválido.");
    }

    if (!response.ok || data?.ok === false) {
      const message =
        data?.error ||
        data?.message ||
        data?.details?.error?.message ||
        data?.details?.message ||
        `Erro ${response.status} ao gerar com IA.`;

      const err = new Error(message);

      if (
        response.status === 401 ||
        /auth|jwt|token|sess[aã]o/i.test(message)
      ) {
        err.code = "AUTH_REQUIRED";
      }

      if (
        response.status === 402 ||
        response.status === 403 ||
        /credit|cr[eé]dito|saldo|subscription|assinatura|plano/i.test(message)
      ) {
        err.code = "NO_CREDIT";
      }

      throw err;
    }

    const imageBase64 =
      data?.image_base64 ||
      data?.b64_json ||
      data?.image ||
      data?.data?.[0]?.b64_json ||
      "";

    const imageUrl =
      data?.image_url ||
      data?.url ||
      data?.data?.[0]?.url ||
      "";

    if (!imageBase64 && !imageUrl) {
      throw new Error("A IA não retornou a imagem esperada.");
    }

    return {
      src: imageUrl || `data:image/png;base64,${imageBase64}`,
      remaining:
        typeof data?.remaining === "number"
          ? data.remaining
          : null
    };
  }

  function setLoading(button, loading, label) {
    if (!button) return;

    if (loading) {
      if (!button.dataset.siteziOriginalText) {
        button.dataset.siteziOriginalText = button.innerHTML;
      }

      button.disabled = true;
      button.innerHTML = `
        <span class="option-icon">✦</span>
        <div>
          <b>${label}</b>
          <small>Aguarde alguns segundos.</small>
        </div>
        <em>…</em>
      `;
    } else {
      button.disabled = false;

      if (button.dataset.siteziOriginalText) {
        button.innerHTML = button.dataset.siteziOriginalText;
      }
    }
  }

  function balanceText(kind, remaining) {
    if (typeof remaining !== "number") return "";

    if (kind === "logo") {
      return remaining === 1
        ? "1 crédito de logo restante."
        : `${remaining} créditos de logo restantes.`;
    }

    return remaining === 1
      ? "1 crédito de imagem restante."
      : `${remaining} créditos de imagem restantes.`;
  }

  function showAssetMessage(container, text, type = "info") {
    if (!container) return;

    let msg = container.querySelector(".sitezi-ai-credit-message");

    if (!msg) {
      msg = document.createElement("div");
      msg.className = "sitezi-ai-credit-message";
      container.appendChild(msg);
    }

    msg.textContent = text;
    msg.dataset.type = type;
  }

  function installRuntimeStyle() {
    if (document.getElementById("sitezi-image-ai-v1-style")) return;

    const style = document.createElement("style");
    style.id = "sitezi-image-ai-v1-style";
    style.textContent = `
      .sitezi-ai-credit-message{
        margin-top:10px;
        padding:10px 12px;
        border-radius:12px;
        font-size:12px;
        line-height:1.45;
        color:#b9c8d8;
        background:#081321;
        border:1px solid #1b3552;
      }

      .sitezi-ai-credit-message[data-type="success"]{
        color:#c9f7db;
        border-color:#1b6b49;
        background:#071c14;
      }

      .sitezi-ai-credit-message[data-type="error"]{
        color:#ffd0d0;
        border-color:#753030;
        background:#210a0a;
      }

      #logoPreview.sitezi-ai-ready,
      #photoPreview.sitezi-ai-ready{
        display:block;
      }

      #logoPreview .sitezi-generated-logo{
        display:block;
        width:min(320px,100%);
        max-height:220px;
        object-fit:contain;
        margin:0 auto;
        border-radius:16px;
        background:#fff;
        padding:14px;
      }

      #photoPreview .sitezi-generated-photo{
        width:100%;
        max-height:360px;
        object-fit:cover;
        border-radius:16px;
        display:block;
      }
    `;

    document.head.appendChild(style);
  }

  function selectLogoAIButton(button) {
    document
      .querySelectorAll("[data-logo-mode]")
      .forEach((x) => x.classList.remove("active"));

    button.classList.add("active");
  }

  function selectImageAIButton(button) {
    document
      .querySelectorAll("[data-image-mode]")
      .forEach((x) => x.classList.remove("active"));

    button.classList.add("active");
  }

  async function handleLogoAI(button) {
    const preview = $("logoPreview");

    setLoading(button, true, "Edu está criando sua logo...");

    try {
      const result = await callImageAI("logo");

      selectLogoAIButton(button);

      if (preview) {
        preview.innerHTML = "";

        const img = document.createElement("img");
        img.src = result.src;
        img.alt = `Logo criada por IA para ${businessName()}`;
        img.className = "sitezi-generated-logo";

        preview.appendChild(img);
        preview.classList.remove("hidden");
        preview.classList.add("sitezi-ai-ready");

        const text = balanceText("logo", result.remaining);
        if (text) {
          showAssetMessage(preview, `Logo criada com sucesso. ${text}`, "success");
        }
      }

      window.dispatchEvent(
        new CustomEvent("sitezi:ai-logo-generated", {
          detail: {
            src: result.src,
            remaining: result.remaining
          }
        })
      );
    } catch (error) {
      console.error("[SITEZI IA IMAGEM] Erro ao gerar logo:", error);

      if (preview) {
        preview.classList.remove("hidden");
        preview.classList.add("sitezi-ai-ready");
      }

      if (error?.code === "AUTH_REQUIRED") {
        alert("Entre na sua conta SITEZI para gerar uma logo com IA.");
      } else if (error?.code === "NO_CREDIT") {
        alert(
          "Você não tem crédito de logo disponível ou sua assinatura não está ativa."
        );
      } else {
        alert(
          error?.message ||
          "Não consegui gerar a logo agora. Tente novamente em instantes."
        );
      }

      if (preview && error?.message) {
        showAssetMessage(preview, error.message, "error");
      }
    } finally {
      setLoading(button, false);
    }
  }

  async function handleImageAI(button) {
    const preview = $("photoPreview");

    setLoading(button, true, "Edu está criando sua imagem...");

    try {
      const result = await callImageAI("image");

      selectImageAIButton(button);

      if (preview) {
        preview.innerHTML = "";

        const img = document.createElement("img");
        img.src = result.src;
        img.alt = `Imagem criada por IA para ${businessName()}`;
        img.className = "sitezi-generated-photo";

        preview.appendChild(img);
        preview.classList.remove("hidden");
        preview.classList.add("sitezi-ai-ready");

        const text = balanceText("image", result.remaining);
        if (text) {
          showAssetMessage(preview, `Imagem criada com sucesso. ${text}`, "success");
        }
      }

      window.dispatchEvent(
        new CustomEvent("sitezi:ai-image-generated", {
          detail: {
            src: result.src,
            remaining: result.remaining
          }
        })
      );
    } catch (error) {
      console.error("[SITEZI IA IMAGEM] Erro ao gerar imagem:", error);

      if (preview) {
        preview.classList.remove("hidden");
        preview.classList.add("sitezi-ai-ready");
      }

      if (error?.code === "AUTH_REQUIRED") {
        alert("Entre na sua conta SITEZI para gerar imagens com IA.");
      } else if (error?.code === "NO_CREDIT") {
        alert(
          "Você não tem crédito de imagem disponível ou sua assinatura não está ativa."
        );
      } else {
        alert(
          error?.message ||
          "Não consegui gerar a imagem agora. Tente novamente em instantes."
        );
      }

      if (preview && error?.message) {
        showAssetMessage(preview, error.message, "error");
      }
    } finally {
      setLoading(button, false);
    }
  }

  function installHandlers() {
    const logoButton = document.querySelector('[data-logo-mode="ai"]');
    const imageButton = document.querySelector('[data-image-mode="ai"]');

    if (logoButton) {
      logoButton.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await handleLogoAI(logoButton);
      };
    }

    if (imageButton) {
      imageButton.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await handleImageAI(imageButton);
      };
    }
  }

  async function refreshVisibleBalances() {
    const balance = await getBalances();
    if (!balance) return;

    const logoButton = document.querySelector('[data-logo-mode="ai"]');
    const imageButton = document.querySelector('[data-image-mode="ai"]');

    const logoSmall = logoButton?.querySelector("small");
    const imageSmall = imageButton?.querySelector("small");

    if (logoSmall) {
      logoSmall.textContent =
        `Gera opções de logo para o seu negócio. ` +
        `Saldo: ${balance.logo_credits ?? 0}`;
    }

    if (imageSmall) {
      imageSmall.textContent =
        `A SITEZI cria imagens relacionadas ao seu negócio. ` +
        `Saldo: ${balance.image_credits ?? 0}`;
    }
  }

  function init() {
    installRuntimeStyle();
    installHandlers();
    refreshVisibleBalances();

    document.documentElement.dataset.siteziImageAiClient = "1.0";
    console.info("[SITEZI] IA de imagens + créditos v1.0 carregada.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
