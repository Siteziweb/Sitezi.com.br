/* =========================================================
   SITEZI — CLIENTE DE IA v1.0
   Integração isolada com Supabase Edge Function "sitezi-ai".
   Não contém a chave secreta da OpenAI.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const AI_ENDPOINT = `${SUPABASE_URL}/functions/v1/sitezi-ai`;

  const $ = (id) => document.getElementById(id);

  function getBusinessType() {
    return document.querySelector(".business.active")?.dataset.business || "Outro";
  }

  function getTemplate() {
    return document.querySelector(".template-card.active")?.dataset.template || "modern";
  }

  function getServices() {
    return ($("servicesInput")?.value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function cleanText(value, max = 300) {
    return String(value || "").trim().slice(0, max);
  }

  async function callSiteziAI(action, extra = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          action,
          businessType: getBusinessType(),
          businessName: cleanText($("businessName")?.value, 80),
          slogan: cleanText($("businessSlogan")?.value, 160),
          services: getServices(),
          template: getTemplate(),
          location: cleanText($("location")?.value, 120),
          ...extra
        }),
        signal: controller.signal
      });

      const raw = await response.text();
      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("A IA respondeu em um formato inesperado.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          `Erro ${response.status} ao acessar a IA.`
        );
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function firstText(data, keys = []) {
    for (const key of keys) {
      const value = data?.[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (Array.isArray(value) && value.length) {
        const first = value.find((item) => typeof item === "string" && item.trim());
        if (first) return first.trim();
      }
    }

    if (data?.result && typeof data.result === "object") {
      return firstText(data.result, keys);
    }

    if (data?.data && typeof data.data === "object") {
      return firstText(data.data, keys);
    }

    return "";
  }

  function extractSuggestion(data) {
    return firstText(data, [
      "slogan",
      "suggestion",
      "text",
      "content",
      "message",
      "slogans"
    ]);
  }

  function setSuggestionBox(text) {
    const box = $("suggestionBox");
    if (!box) return;

    box.innerHTML = "";

    const title = document.createElement("b");
    title.textContent = "Sugestão da IA: ";

    const suggestion = document.createElement("span");
    suggestion.textContent = text;

    const br = document.createElement("br");

    const button = document.createElement("button");
    button.type = "button";
    button.id = "useSuggestion";
    button.textContent = "Usar esta sugestão";

    button.addEventListener("click", () => {
      if ($("businessSlogan")) $("businessSlogan").value = text;
      box.classList.add("hidden");
    });

    box.append(title, suggestion, br, button);
    box.classList.remove("hidden");
  }

  function installBrandSuggestionAI() {
    const button = $("suggestBrand");
    if (!button) return;

    /* Captura o clique antes do listener antigo do script.js. */
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const name = cleanText($("businessName")?.value, 80);

      if (!name) {
        alert("Digite primeiro o nome do seu negócio.");
        return;
      }

      const oldText = button.textContent;
      button.disabled = true;
      button.textContent = "Edu está pensando...";

      try {
        const data = await callSiteziAI("suggest-brand");
        const suggestion = extractSuggestion(data);

        if (!suggestion) {
          throw new Error("A IA não retornou uma sugestão.");
        }

        setSuggestionBox(suggestion);
      } catch (error) {
        console.error("[SITEZI IA] Sugestão:", error);
        alert(
          "Não consegui consultar a IA agora. O restante do SITEZI continua funcionando normalmente."
        );
      } finally {
        button.disabled = false;
        button.textContent = oldText;
      }
    }, true);
  }

  function applyAIContent(data) {
    const source =
      (data?.result && typeof data.result === "object" && data.result) ||
      (data?.data && typeof data.data === "object" && data.data) ||
      data ||
      {};

    const slogan = firstText(source, ["slogan", "heroTitle", "headline"]);
    if (slogan && $("businessSlogan") && !$("businessSlogan").value.trim()) {
      $("businessSlogan").value = slogan;
    }

    const services =
      Array.isArray(source.services) ? source.services :
      Array.isArray(source.servicos) ? source.servicos :
      [];

    if (services.length && $("servicesInput") && !$("servicesInput").value.trim()) {
      $("servicesInput").value = services
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
        .join(", ");
    }
  }

  function installGenerateEnhancement() {
    const button = $("generateSite");
    if (!button) return;

    button.addEventListener("click", async () => {
      /*
       * O script.js continua sendo responsável por validar e gerar a prévia.
       * Esta chamada apenas enriquece os dados quando possível, sem quebrar
       * o fluxo atual caso a IA esteja indisponível.
       */
      try {
        const data = await callSiteziAI("generate-site-content");
        applyAIContent(data);
      } catch (error) {
        console.warn("[SITEZI IA] Geração complementar indisponível:", error);
      }
    }, true);
  }

  function markAIConnected() {
    document.documentElement.dataset.siteziAi = "connected";
    console.info("[SITEZI] Cliente de IA conectado.");
  }

  function init() {
    installBrandSuggestionAI();
    installGenerateEnhancement();
    markAIConnected();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
