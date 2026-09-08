/* =========================================================
   SITEZI — IA DE IMAGENS + CRÉDITOS v1.1

   - usa sessão Supabase do cliente;
   - backend valida assinatura + saldo;
   - gera logo/imagem via Edge Function sitezi-images;
   - integra o resultado ao criador atual sem reescrever script.js;
   - atualiza a barrinha de créditos após sucesso ou erro.
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/sitezi-images`;

  const $ = id => document.getElementById(id);

  let clientPromise = null;

  async function getClient() {
    if (clientPromise) return clientPromise;

    clientPromise = (async () => {
      const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      return mod.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    })();

    return clientPromise;
  }

  async function getSession() {
    const client = await getClient();
    const { data, error } = await client.auth.getSession();

    if (error) throw new Error("Não foi possível verificar sua sessão.");

    if (!data.session?.access_token) {
      const err = new Error("Entre na sua conta SITEZI para usar a IA.");
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    return data.session;
  }

  function businessType() {
    return document.querySelector(".business.active")?.dataset.business || "Outro";
  }

  function businessName() {
    return $("businessName")?.value?.trim() || "Meu negócio";
  }

  function template() {
    return document.querySelector(".template-card.active")?.dataset.template || "modern";
  }

  function buildRequest(kind) {
    const body = {
      purpose: kind === "logo" ? "logo" : "hero",
      businessType: businessType(),
      businessName: businessName(),
      template: template()
    };

    const siteId = sessionStorage.getItem("sitezi_current_site_id");
    if (siteId) body.siteId = siteId;

    return body;
  }

  function friendlyBackendError(response, data) {
    const backendMessage =
      data?.error ||
      data?.message ||
      data?.details?.error?.message ||
      data?.details?.message ||
      "";

    const text = String(backendMessage).toLowerCase();

    if (
      response.status === 401 ||
      text.includes("sessão") ||
      text.includes("login") ||
      text.includes("jwt")
    ) {
      const err = new Error("Entre novamente na sua conta SITEZI.");
      err.code = "AUTH_REQUIRED";
      return err;
    }

    if (
      response.status === 403 &&
      (
        text.includes("plano") ||
        text.includes("assinatura") ||
        text.includes("crédito")
      )
    ) {
      const err = new Error(backendMessage || "Seu plano não possui crédito disponível.");
      err.code = "NO_CREDIT";
      return err;
    }

    // A OpenAI pode estar sem saldo mesmo quando o cliente possui créditos SITEZI.
    if (
      response.status === 429 ||
      text.includes("insufficient_quota") ||
      text.includes("credit_balance") ||
      text.includes("quota")
    ) {
      const err = new Error(
        "A geração de imagens está temporariamente indisponível. Seu crédito SITEZI não será perdido."
      );
      err.code = "PROVIDER_CREDIT";
      return err;
    }

    return new Error(backendMessage || "Não foi possível gerar a imagem agora.");
  }

  async function generate(kind) {
    const session = await getSession();

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(buildRequest(kind))
    });

    const raw = await response.text();

    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error("A IA retornou uma resposta inválida.");
    }

    if (!response.ok || data.ok === false) {
      throw friendlyBackendError(response, data);
    }

    // sitezi-images v4 retorna:
    // image: "data:image/png;base64,..."
    // remainingCredits: número
    let src = "";

    if (typeof data.image === "string") {
      src = data.image.startsWith("data:")
        ? data.image
        : `data:image/png;base64,${data.image}`;
    } else if (typeof data.image_url === "string") {
      src = data.image_url;
    } else if (typeof data.image_base64 === "string") {
      src = `data:image/png;base64,${data.image_base64}`;
    } else if (typeof data.b64_json === "string") {
      src = `data:image/png;base64,${data.b64_json}`;
    }

    if (!src) {
      throw new Error("A IA não retornou a imagem esperada.");
    }

    return {
      src,
      remaining:
        typeof data.remainingCredits === "number"
          ? data.remainingCredits
          : typeof data.remaining === "number"
            ? data.remaining
            : null
    };
  }

  function setLoading(button, on, title) {
    if (!button) return;

    if (on) {
      if (!button.dataset.siteziOriginalHtml) {
        button.dataset.siteziOriginalHtml = button.innerHTML;
      }

      button.disabled = true;
      button.innerHTML = `
        <span class="option-icon">✦</span>
        <div>
          <b>${title}</b>
          <small>Aguarde alguns segundos.</small>
        </div>
        <em>…</em>
      `;
    } else {
      button.disabled = false;

      if (button.dataset.siteziOriginalHtml) {
        button.innerHTML = button.dataset.siteziOriginalHtml;
      }
    }
  }

  function dataUrlToFile(dataUrl, filename) {
    const parts = dataUrl.split(",");
    const meta = parts[0] || "data:image/png;base64";
    const base64 = parts[1] || "";
    const mime = meta.match(/data:([^;]+)/)?.[1] || "image/png";

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mime });
  }

  function feedGeneratedAssetIntoCurrentBuilder(kind, src) {
    if (!src.startsWith("data:")) return false;

    try {
      const file = dataUrlToFile(
        src,
        kind === "logo" ? "sitezi-logo-ia.png" : "sitezi-imagem-ia.png"
      );

      const transfer = new DataTransfer();
      transfer.items.add(file);

      const input = kind === "logo" ? $("logoUpload") : $("photoUpload");
      if (!input) return false;

      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (error) {
      console.warn("[SITEZI IMAGE AI] Não foi possível integrar via upload.", error);
      return false;
    }
  }

  function showPreview(kind, src, remaining) {
    const box = kind === "logo" ? $("logoPreview") : $("photoPreview");
    if (!box) return;

    // O handler original de upload pode preencher o preview logo depois.
    setTimeout(() => {
      if (!box.querySelector("img")) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = kind === "logo"
          ? `Logo criada por IA para ${businessName()}`
          : `Imagem criada por IA para ${businessName()}`;
        box.innerHTML = "";
        box.appendChild(img);
      }

      box.classList.remove("hidden");

      let msg = box.querySelector(".sitezi-ai-status");
      if (!msg) {
        msg = document.createElement("div");
        msg.className = "sitezi-ai-status";
        box.appendChild(msg);
      }

      msg.textContent =
        typeof remaining === "number"
          ? `✓ Criado com IA. Restam ${remaining} crédito(s) deste tipo.`
          : "✓ Criado com IA.";
    }, 80);
  }

  function markModeActive(kind, button) {
    const selector = kind === "logo" ? "[data-logo-mode]" : "[data-image-mode]";
    document.querySelectorAll(selector).forEach(el => el.classList.remove("active"));
    button.classList.add("active");
  }

  function notifyCreditRefresh() {
    window.dispatchEvent(new CustomEvent("sitezi:ai-credit-change"));
  }

  async function handle(kind, button) {
    setLoading(
      button,
      true,
      kind === "logo" ? "Edu está criando sua logo..." : "Edu está criando sua imagem..."
    );

    try {
      const result = await generate(kind);

      feedGeneratedAssetIntoCurrentBuilder(kind, result.src);
      markModeActive(kind, button);
      showPreview(kind, result.src, result.remaining);

      window.dispatchEvent(new CustomEvent(
        kind === "logo" ? "sitezi:ai-logo-generated" : "sitezi:ai-image-generated",
        { detail: result }
      ));

      notifyCreditRefresh();
    } catch (error) {
      console.error("[SITEZI IMAGE AI]", error);

      if (error?.code === "AUTH_REQUIRED") {
        alert("Entre na sua conta SITEZI para usar a geração com IA.");
      } else if (error?.code === "NO_CREDIT") {
        alert(error.message || "Você não possui crédito disponível para esta geração.");
      } else if (error?.code === "PROVIDER_CREDIT") {
        alert(error.message);
      } else {
        alert(error?.message || "Não consegui gerar a imagem agora.");
      }

      // O backend v4 reembolsa o crédito quando a OpenAI falha.
      notifyCreditRefresh();
    } finally {
      setLoading(button, false);
    }
  }

  function installStyle() {
    if ($("sitezi-image-ai-style-v11")) return;

    const style = document.createElement("style");
    style.id = "sitezi-image-ai-style-v11";
    style.textContent = `
      .sitezi-ai-status{
        margin-top:10px;
        padding:9px 11px;
        border:1px solid #1d694d;
        border-radius:11px;
        background:#071b14;
        color:#bdf3d7;
        font:700 12px/1.4 Inter,Arial,sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  function installHandlers() {
    const logoBtn = document.querySelector('[data-logo-mode="ai"]');
    const imageBtn = document.querySelector('[data-image-mode="ai"]');

    if (logoBtn) {
      logoBtn.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        handle("logo", logoBtn);
      };
    }

    if (imageBtn) {
      imageBtn.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        handle("image", imageBtn);
      };
    }
  }

  function init() {
    installStyle();
    installHandlers();

    document.documentElement.dataset.siteziImageAi = "1.1";
    console.info("[SITEZI] IA de imagens + créditos v1.1 carregada.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
