/* =========================================================
   SITEZI — IA DE MARCA + IMAGENS + CRÉDITOS v1.6
   - login obrigatório
   - plano ativo obrigatório
   - separa plano, crédito e falha do provedor
   - envia produtos/serviços e identidade para personalização
   - solicita logo PNG com fundo transparente
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

  function builderState() {
    return window.SITEZI_BUILDER_STATE || {};
  }

  function inferBrandContext(s) {
    const items = Array.isArray(s.products) ? s.products : [];
    const corpus = [s.businessType, s.businessName, s.slogan, ...items.flatMap(p => [p?.name, p?.description])]
      .filter(Boolean).join(" ").toLowerCase();

    const rules = [
      ["electrical", /(elétr|eletr|fiação|fiacao|disjunt|quadro de luz|energia|instalação elétrica)/],
      ["plumbing", /(encan|hidrául|hidraul|vazamento|torneira|tubula)/],
      ["automotive", /(mecân|mecan|oficina|automot|carro|moto|óleo|oleo|pneu)/],
      ["restaurant", /(restaurante|lanch|pizza|hamb|comida|cozinha|delivery|cafeteria)/],
      ["barber", /(barbear|barber|corte masculino|barba)/],
      ["beauty", /(salão|salao|beleza|estética|estetica|manicure|cabelo|make)/],
      ["fashion", /(moda|roupa|camisa|vestido|calçado|calcado|tênis|tenis)/],
      ["health", /(clínica|clinica|saúde|saude|dent|fisi|psic|nutri)/],
      ["retail", /(loja|varejo|produto|catálogo|catalogo)/]
    ];
    const category = rules.find(([,rx]) => rx.test(corpus))?.[0] || "professional-service";
    const style = String(s.template || document.querySelector(".template-card.active")?.dataset.template || "modern");
    return {
      category,
      style,
      objective: kind === "logo" ? "brand-identity-logo" : "website-commercial-hero",
      audience: "clientes reais procurando este tipo de negócio",
      locale: "pt-BR",
      creativeRule: kind === "logo"
        ? "Crie um símbolo de marca original, simples, memorável e específico para o ramo; não faça fotografia, mockup, cartaz ou tela de site."
        : "Crie uma imagem comercial realista e específica do serviço/produto em ação; não faça logo, mockup, tela de computador, anúncio ou página de site."
    };
  }

  function buildRequest(kind) {
    const s = builderState();
    const brandContext = inferBrandContext(s);

    const body = {
      purpose: kind === "logo" ? "logo" : "hero",
      businessType: s.businessType || document.querySelector(".business.active")?.dataset.business || "Outro",
      businessName: s.businessName || $("businessName")?.value?.trim() || "Meu negócio",
      template: s.template || document.querySelector(".template-card.active")?.dataset.template || "modern",
      color: s.color || "#1578ff",
      slogan: s.slogan || $("businessSlogan")?.value?.trim() || "",
      products: Array.isArray(s.products)
        ? s.products.map(p => ({
            name: p.name || "",
            price: p.price || "",
            description: p.description || ""
          })).slice(0, 30)
        : [],
      contact: {
        location: s.location || "",
        instagram: s.instagram || ""
      },
      brandContext,
      generationIntent: brandContext.objective,
      brandBrief: {
        name: s.businessName || $("businessName")?.value?.trim() || "Meu negócio",
        type: s.businessType || document.querySelector(".business.active")?.dataset.business || "Outro",
        slogan: s.slogan || $("businessSlogan")?.value?.trim() || "",
        category: brandContext.category,
        visualStyle: brandContext.style,
        primaryColor: s.color || "#1578ff",
        offerings: Array.isArray(s.products) ? s.products.slice(0, 30).map(p => ({name:p.name||"", description:p.description||""})) : []
      },

      // O backend/provider deve respeitar estes campos para a logo.
      outputFormat: "png",
      transparentBackground: kind === "logo",
      background: kind === "logo" ? "transparent" : "auto"
    };

    const siteId = sessionStorage.getItem("sitezi_current_site_id");
    if (siteId) body.siteId = siteId;

    return body;
  }

  function friendlyBackendError(response, data) {
    const message =
      data?.error ||
      data?.message ||
      data?.details?.error?.message ||
      data?.details?.message ||
      "";

    const text = String(message).toLowerCase();

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
      (text.includes("plano") || text.includes("assinatura") || text.includes("subscription"))
    ) {
      const err = new Error(message || "A geração com IA exige um plano ativo.");
      err.code = "PLAN_REQUIRED";
      return err;
    }

    if (
      response.status === 403 &&
      (text.includes("crédito") || text.includes("credito") || text.includes("saldo"))
    ) {
      const err = new Error(message || "Você não possui crédito disponível para esta geração.");
      err.code = "NO_CREDIT";
      return err;
    }

    if (
      response.status === 429 ||
      text.includes("insufficient_quota") ||
      text.includes("credit_balance") ||
      text.includes("quota")
    ) {
      const err = new Error("A geração de imagens está temporariamente indisponível. Seu crédito SITEZI não será perdido.");
      err.code = "PROVIDER_CREDIT";
      return err;
    }

    const err = new Error(message || "Não foi possível gerar a imagem agora.");
    err.code = "GENERIC";
    return err;
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

    if (!src) throw new Error("A IA não retornou a imagem esperada.");

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

  function openLogin(mode = "login") {
    if (typeof window.SITEZI_AUTH?.openLogin === "function") {
      window.SITEZI_AUTH.openLogin(mode);
      return;
    }

    window.dispatchEvent(new CustomEvent("sitezi:open-login", {
      detail: { mode }
    }));
  }

  function openPlanNotice() {
    document.querySelector(".sitezi-ai-plan-modal")?.remove();

    const modal = document.createElement("div");
    modal.className = "sitezi-ai-plan-modal";
    modal.innerHTML = `
      <div class="sitezi-ai-plan-card" role="dialog" aria-modal="true">
        <button class="sitezi-ai-plan-close" aria-label="Fechar">×</button>
        <span>✦ GERAÇÃO AVANÇADA COM IA</span>
        <h3>Para usar Inteligência Artificial, é necessário ter um plano ativo.</h3>
        <p>Seu site continua completo no modo simples.</p>
        <p>Com o plano ativo, a SITEZI pode criar identidade, logo e imagens personalizadas usando as informações que você já cadastrou.</p>
        <div>
          <button class="btn outline sitezi-ai-simple">Continuar sem IA</button>
          <button class="btn primary sitezi-ai-plans">Ver planos</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector(".sitezi-ai-plan-close").onclick = close;
    modal.querySelector(".sitezi-ai-simple").onclick = close;
    modal.querySelector(".sitezi-ai-plans").onclick = () => {
      close();
      if (window.SITEZI_SHOW_SCREEN && $("plans")) window.SITEZI_SHOW_SCREEN($("plans"));
    };

    modal.addEventListener("click", e => {
      if (e.target === modal) close();
    });
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
        <div><b>${title}</b><small>Aguarde alguns segundos.</small></div>
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


  async function trimTransparentImage(src) {
    if (!String(src || "").startsWith("data:image/")) return src;
    return await new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth || img.width;
          c.height = img.naturalHeight || img.height;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const a = data[(y * c.width + x) * 4 + 3];
              if (a > 18) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX < minX || maxY < minY) return resolve(src);
          const bw = maxX - minX + 1, bh = maxY - minY + 1;
          const pad = Math.max(8, Math.round(Math.max(bw, bh) * 0.07));
          const sx = Math.max(0, minX - pad), sy = Math.max(0, minY - pad);
          const sw = Math.min(c.width - sx, bw + pad * 2), sh = Math.min(c.height - sy, bh + pad * 2);
          const out = document.createElement("canvas");
          out.width = sw; out.height = sh;
          out.getContext("2d").drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh);
          resolve(out.toDataURL("image/png"));
        } catch (_) { resolve(src); }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  }

  function feedGeneratedAsset(kind, src) {
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

    setTimeout(() => {
      if (!box.querySelector("img")) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = kind === "logo" ? "Logo criada por IA" : "Imagem criada por IA";
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

  function notifyCreditRefresh(kind=null, remaining=null) {
    const detail = { kind, remaining };
    window.dispatchEvent(new CustomEvent("sitezi:credits-changed", { detail }));
    window.dispatchEvent(new CustomEvent("sitezi:ai-credit-change", { detail }));
    try {
      const p = window.SITEZI_ACCOUNT_STATE?.refresh?.();
      if (p?.catch) p.catch(() => {});
    } catch (_) {}
  }

  async function handle(kind, button) {
    setLoading(
      button,
      true,
      kind === "logo" ? "Edu está criando sua logo..." : "Edu está criando sua imagem..."
    );

    try {
      const result = await generate(kind);

      if (kind === "logo") result.src = await trimTransparentImage(result.src);

      feedGeneratedAsset(kind, result.src);
      markModeActive(kind, button);
      showPreview(kind, result.src, result.remaining);

      window.dispatchEvent(new CustomEvent(
        kind === "logo" ? "sitezi:ai-logo-generated" : "sitezi:ai-image-generated",
        { detail: result }
      ));

      notifyCreditRefresh(kind, result.remaining);
    } catch (error) {
      console.error("[SITEZI IMAGE AI]", error);

      if (error?.code === "AUTH_REQUIRED") {
        openLogin("login");
      } else if (error?.code === "PLAN_REQUIRED") {
        openPlanNotice();
      } else if (error?.code === "NO_CREDIT") {
        alert(error.message || "Você não possui crédito disponível para esta geração.");
      } else {
        alert(error?.message || "Não consegui gerar a imagem agora.");
      }

      notifyCreditRefresh();
    } finally {
      setLoading(button, false);
    }
  }

  function installStyle() {
    if ($("sitezi-image-ai-style-v16")) return;

    const style = document.createElement("style");
    style.id = "sitezi-image-ai-style-v16";
    style.textContent = `
      .sitezi-ai-status{margin-top:10px;padding:9px 11px;border:1px solid #1d694d;border-radius:11px;background:#071b14;color:#bdf3d7;font:700 12px/1.4 Inter,Arial,sans-serif}
      .sitezi-ai-plan-modal{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:20px;background:rgba(0,3,10,.82);backdrop-filter:blur(12px)}
      .sitezi-ai-plan-card{width:min(520px,100%);position:relative;padding:26px;border:1px solid #225dd0;border-radius:24px;background:linear-gradient(180deg,#0c1628,#050b16);color:#f8fbff;box-shadow:0 30px 100px rgba(0,0,0,.65)}
      .sitezi-ai-plan-card>span{color:#53b9ff;font-size:12px;font-weight:900}
      .sitezi-ai-plan-card h3{font-size:25px;margin:12px 30px 10px 0}
      .sitezi-ai-plan-card p{color:#aebccc;line-height:1.55}
      .sitezi-ai-plan-card>div{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
      .sitezi-ai-plan-close{position:absolute;right:12px;top:10px;width:38px;height:38px;border-radius:50%;border:1px solid #273b59;background:#0a1220;color:#fff;font-size:24px}
    `;
    document.head.appendChild(style);
  }

  function installHandlers() {
    const logoBtn = document.querySelector('[data-logo-mode="ai"]');
    const imageBtn = document.querySelector('[data-image-mode="ai"]');

    if (logoBtn) {
      logoBtn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        handle("logo", logoBtn);
      };
    }

    if (imageBtn) {
      imageBtn.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        handle("image", imageBtn);
      };
    }
  }

  function init() {
    installStyle();
    installHandlers();
    document.documentElement.dataset.siteziImageAi = "1.6";
    console.info("[SITEZI] IA de imagens + créditos v1.4 carregada.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();