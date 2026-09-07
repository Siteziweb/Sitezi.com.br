/* =========================================================
   SITEZI — IA REAL v2.0
   Integração isolada com Supabase Edge Function "sitezi-ai".

   IMPORTANTE:
   - A chave da OpenAI NÃO fica neste arquivo.
   - A OpenAI continua protegida no Supabase.
   - A chave abaixo é a chave pública/anon do projeto Supabase,
     própria para uso no navegador.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaG9zcmhud2plcnRic2VtcGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTAxNjYsImV4cCI6MjEwNDM4NjE2Nn0.8Uyu118myYc-xbkikgHA1KxEquqgFmtjWmOjv6q_xSA";

  const AI_ENDPOINT = `${SUPABASE_URL}/functions/v1/sitezi-ai`;

  const $ = (id) => document.getElementById(id);

  function clean(value, max = 300) {
    return String(value || "").trim().slice(0, max);
  }

  function selectedBusinessType() {
    return document.querySelector(".business.active")?.dataset.business || "Outro";
  }

  function selectedTemplate() {
    return document.querySelector(".template-card.active")?.dataset.template || "modern";
  }

  function currentServicesText() {
    return clean($("servicesInput")?.value, 700);
  }

  async function askSiteziAI() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          businessType: selectedBusinessType(),
          businessName: clean($("businessName")?.value, 80),
          slogan: clean($("businessSlogan")?.value, 180),
          services: currentServicesText(),
          template: selectedTemplate()
        }),
        signal: controller.signal
      });

      const raw = await response.text();
      let data;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("A IA respondeu em formato inválido.");
      }

      if (!response.ok || data?.ok === false) {
        const detail =
          data?.details?.error?.message ||
          data?.details?.message ||
          data?.error ||
          `Erro ${response.status} ao consultar a IA.`;

        throw new Error(detail);
      }

      if (!data?.generated || typeof data.generated !== "object") {
        throw new Error("A IA não retornou o conteúdo esperado.");
      }

      return data.generated;
    } finally {
      clearTimeout(timeout);
    }
  }

  function setButtonLoading(button, loading, text) {
    if (!button) return;

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent || "";
      }
      button.disabled = true;
      button.textContent = text;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function showAISuggestion(generated) {
    const box = $("suggestionBox");
    if (!box) return;

    const suggestion =
      clean(generated?.slogan, 180) ||
      clean(generated?.heroTitle, 180);

    if (!suggestion) {
      throw new Error("A IA não retornou uma sugestão de slogan.");
    }

    box.innerHTML = "";

    const title = document.createElement("b");
    title.textContent = "Sugestão do Edu: ";

    const text = document.createElement("span");
    text.textContent = suggestion;

    const br = document.createElement("br");

    const use = document.createElement("button");
    use.type = "button";
    use.id = "useSuggestion";
    use.textContent = "Usar esta sugestão";

    use.onclick = () => {
      if ($("businessSlogan")) {
        $("businessSlogan").value = suggestion;
      }
      box.classList.add("hidden");
    };

    box.append(title, text, br, use);
    box.classList.remove("hidden");
  }

  function installSuggestionAI() {
    const button = $("suggestBrand");
    if (!button) return;

    /* O script principal já foi carregado. Guardamos o comportamento antigo
       apenas como fallback caso a IA esteja temporariamente indisponível. */
    const oldHandler = button.onclick;

    button.onclick = async (event) => {
      event?.preventDefault();

      const name = clean($("businessName")?.value, 80);

      if (!name) {
        alert("Digite primeiro o nome do seu negócio.");
        return;
      }

      setButtonLoading(button, true, "Edu está pensando...");

      try {
        const generated = await askSiteziAI();
        showAISuggestion(generated);
      } catch (error) {
        console.error("[SITEZI IA] Falha na sugestão:", error);

        /* Mantém o SITEZI funcionando mesmo se a API cair. */
        if (typeof oldHandler === "function") {
          oldHandler.call(button, event);
        } else {
          alert("Não consegui consultar a IA agora. Tente novamente em instantes.");
        }
      } finally {
        setButtonLoading(button, false);
      }
    };
  }

  function waitForFrame(frame, timeoutMs = 4000) {
    return new Promise((resolve) => {
      if (!frame) {
        resolve(null);
        return;
      }

      let finished = false;

      const done = () => {
        if (finished) return;
        finished = true;
        frame.removeEventListener("load", done);
        resolve(frame.contentDocument || null);
      };

      frame.addEventListener("load", done, { once: true });

      setTimeout(() => {
        if (!finished) done();
      }, timeoutMs);

      /* srcdoc pequeno muitas vezes já carregou antes de registrarmos o evento. */
      setTimeout(() => {
        if (
          !finished &&
          frame.contentDocument?.documentElement &&
          frame.contentDocument?.body?.innerHTML
        ) {
          done();
        }
      }, 80);
    });
  }

  function replaceText(el, value) {
    const text = clean(value, 700);
    if (el && text) el.textContent = text;
  }

  function applyGeneratedContent(doc, generated) {
    if (!doc || !generated) return false;

    const heroTitle =
      clean(generated.heroTitle, 180) ||
      clean(generated.slogan, 180);

    const heroText = clean(generated.heroText, 450);
    const about = clean(generated.about, 700);
    const cta = clean(generated.cta, 80);

    replaceText(doc.querySelector(".hero h1"), heroTitle);
    replaceText(doc.querySelector(".hero p"), heroText);

    /* SOBRE */
    const aboutSection = doc.querySelector("#sobre");
    if (aboutSection) {
      replaceText(aboutSection.querySelector(".lead"), about);
    }

    /* SERVIÇOS — usa título e descrição criados pela IA. */
    const aiServices = Array.isArray(generated.services)
      ? generated.services
      : [];

    const cards = [...doc.querySelectorAll("#servicos .services article")];

    cards.forEach((card, index) => {
      const service = aiServices[index];
      if (!service || typeof service !== "object") return;

      replaceText(card.querySelector("h3"), service.title);
      replaceText(card.querySelector("p"), service.description);
    });

    /* CTA — mantém o link do WhatsApp, troca somente o texto. */
    if (cta) {
      replaceText(doc.querySelector(".hero .cta"), cta);

      const contactCTA = doc.querySelector("#contato .cta");
      if (contactCTA) {
        contactCTA.textContent = `${cta} →`;
      }
    }

    doc.documentElement.setAttribute("data-sitezi-ai", "generated");
    return true;
  }

  async function enrichPreviewWithAI(generated) {
    const frame = $("sitePreview");
    if (!frame) return;

    const doc = await waitForFrame(frame);
    if (!doc) throw new Error("Não foi possível acessar a prévia do site.");

    const changed = applyGeneratedContent(doc, generated);
    if (!changed) return;

    /* Grava o HTML enriquecido no próprio srcdoc.
       Assim "Ver site em tela cheia" também recebe o conteúdo da IA. */
    const serialized =
      "<!doctype html>\n" +
      doc.documentElement.outerHTML;

    frame.srcdoc = serialized;
  }

  function basicFormReady() {
    const business = selectedBusinessType();
    const name = clean($("businessName")?.value, 80);
    const services = currentServicesText();
    const whatsapp = clean($("whatsapp")?.value, 40);

    return Boolean(business && name && services && whatsapp);
  }

  function installRealGenerateAI() {
    const button = $("generateSite");
    if (!button) return;

    /* O handler original gera todo o layout já aprovado do SITEZI. */
    const originalGenerate = button.onclick;

    if (typeof originalGenerate !== "function") {
      console.warn("[SITEZI IA] Gerador principal não encontrado.");
      return;
    }

    button.onclick = async (event) => {
      event?.preventDefault();

      /* Se algo obrigatório estiver faltando, deixa o script antigo
         exibir exatamente os avisos que já existiam. */
      if (!basicFormReady()) {
        originalGenerate.call(button, event);
        return;
      }

      setButtonLoading(button, true, "Edu está criando seu site...");

      let generated = null;

      try {
        /* 1. Espera a IA responder ANTES de montar a prévia. */
        generated = await askSiteziAI();
      } catch (error) {
        console.error("[SITEZI IA] Falha ao gerar conteúdo:", error);
      }

      /* 2. Gera o layout aprovado normalmente. */
      originalGenerate.call(button, event);

      /* 3. Se a IA respondeu, substitui os textos genéricos
            pelos textos realmente criados pela OpenAI. */
      if (generated) {
        try {
          await enrichPreviewWithAI(generated);
          console.info("[SITEZI] Site criado com conteúdo real de IA.", generated);
        } catch (error) {
          console.error("[SITEZI IA] Erro ao aplicar conteúdo:", error);
        }
      } else {
        console.warn(
          "[SITEZI] IA indisponível. Prévia criada usando o conteúdo local de segurança."
        );
      }

      setButtonLoading(button, false);
    };
  }

  function init() {
    installSuggestionAI();
    installRealGenerateAI();

    document.documentElement.dataset.siteziAiClient = "2.0";
    console.info("[SITEZI] Integração de IA v2.0 carregada.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
