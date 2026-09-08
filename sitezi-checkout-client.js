/* =========================================================
   SITEZI — CHECKOUT ASAAS v1.1
   Cartão recorrente + PIX mensal manual.
   ========================================================= */

(async () => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const CHECKOUT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/sitezi-checkout`;

  let createClient;

  try {
    ({ createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"));
  } catch (error) {
    console.error("[SITEZI CHECKOUT] Não foi possível carregar o Supabase JS.", error);
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const planButtons = [...document.querySelectorAll(".choose-plan")];

  const style = document.createElement("style");
  style.id = "sitezi-payment-choice-style";
  style.textContent = `
    .sitezi-pay-modal{
      position:fixed;inset:0;z-index:100000;display:grid;place-items:center;
      padding:18px;background:rgba(0,7,18,.82);backdrop-filter:blur(12px)
    }
    .sitezi-pay-modal.hidden{display:none}
    .sitezi-pay-card{
      width:min(470px,100%);background:linear-gradient(180deg,#08111f,#040914);
      border:1px solid #203654;border-radius:24px;padding:22px;color:#fff;
      box-shadow:0 30px 90px rgba(0,0,0,.55);font-family:Inter,Arial,sans-serif
    }
    .sitezi-pay-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
    .sitezi-pay-head h3{margin:0;font-size:24px;letter-spacing:-.5px}
    .sitezi-pay-head p{margin:7px 0 0;color:#95a5bb;line-height:1.45}
    .sitezi-pay-close{
      border:0;background:transparent;color:#9eacc0;font-size:28px;cursor:pointer
    }
    .sitezi-pay-options{display:grid;gap:12px;margin-top:20px}
    .sitezi-pay-option{
      display:grid;grid-template-columns:48px 1fr auto;gap:13px;align-items:center;
      width:100%;text-align:left;padding:16px;border-radius:16px;
      border:1px solid #263b59;background:#07101c;color:#fff;cursor:pointer
    }
    .sitezi-pay-option:hover{border-color:#2a72ff;background:#091728}
    .sitezi-pay-icon{
      width:48px;height:48px;border-radius:14px;display:grid;place-items:center;
      background:#0b203a;border:1px solid #214b7c;font-size:22px
    }
    .sitezi-pay-option b{display:block;font-size:16px;margin-bottom:4px}
    .sitezi-pay-option small{display:block;color:#8fa1b8;line-height:1.35}
    .sitezi-pay-option em{font-style:normal;color:#5eb2ff;font-size:22px}
    .sitezi-pay-note{
      margin:16px 2px 0;color:#72849b;font-size:12px;line-height:1.45
    }
    @media(max-width:600px){
      .sitezi-pay-modal{align-items:end;padding:10px}
      .sitezi-pay-card{border-radius:20px;padding:20px}
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.className = "sitezi-pay-modal hidden";
  modal.innerHTML = `
    <div class="sitezi-pay-card" role="dialog" aria-modal="true" aria-labelledby="siteziPayTitle">
      <div class="sitezi-pay-head">
        <div>
          <h3 id="siteziPayTitle">Como você quer pagar?</h3>
          <p id="siteziPaySubtitle">Escolha a forma de pagamento do seu plano.</p>
        </div>
        <button type="button" class="sitezi-pay-close" aria-label="Fechar">×</button>
      </div>

      <div class="sitezi-pay-options">
        <button type="button" class="sitezi-pay-option" data-method="card">
          <span class="sitezi-pay-icon">💳</span>
          <span>
            <b>Cartão de crédito</b>
            <small>Assinatura mensal com cobrança automática.</small>
          </span>
          <em>→</em>
        </button>

        <button type="button" class="sitezi-pay-option" data-method="pix">
          <span class="sitezi-pay-icon">◆</span>
          <span>
            <b>PIX</b>
            <small>Pagamento de 1 mês por PIX. A renovação é feita no próximo ciclo.</small>
          </span>
          <em>→</em>
        </button>
      </div>

      <p class="sitezi-pay-note">
        O plano só será ativado após a confirmação real do pagamento pelo Asaas.
      </p>
    </div>
  `;
  document.body.appendChild(modal);

  let selectedButton = null;

  function setBusy(activeButton, busy) {
    planButtons.forEach((button) => {
      button.disabled = busy;
    });

    if (!activeButton) return;

    if (busy) {
      activeButton.dataset.originalText = activeButton.textContent || "";
      activeButton.textContent = "Abrindo checkout...";
    } else {
      activeButton.textContent =
        activeButton.dataset.originalText || activeButton.textContent || "Escolher plano";
    }
  }

  function showPaymentChoice(button) {
    selectedButton = button;
    const plan = button.dataset.plan || "";
    const price = button.dataset.price || "";

    const subtitle = modal.querySelector("#siteziPaySubtitle");
    if (subtitle) {
      subtitle.textContent = `Plano ${plan} — R$ ${price}/mês`;
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function hidePaymentChoice() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function friendlyError(data, status) {
    if (status === 401) return "Sua sessão expirou. Entre novamente na SITEZI.";
    if (status === 403) return "Não consegui validar este site na sua conta.";

    const asaasErrors = data?.details?.errors;
    if (Array.isArray(asaasErrors) && asaasErrors.length) {
      const text = asaasErrors.map((item) => item?.description).filter(Boolean).join("\n");
      if (text) return text;
    }

    if (data?.error) return data.error;
    return "Não consegui abrir o checkout agora. Tente novamente.";
  }

  async function openCheckout(button, paymentMethod) {
    const plan = button.dataset.plan;
    if (!plan) return;

    hidePaymentChoice();
    setBusy(button, true);

    try {
      const {
        data: { session },
        error: sessionError
      } = await client.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("SESSION_REQUIRED");
      }

      const siteId = sessionStorage.getItem("sitezi_current_site_id") || null;

      const response = await fetch(CHECKOUT_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan,
          siteId,
          paymentMethod
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok || !data?.checkoutUrl) {
        throw new Error(friendlyError(data, response.status));
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("[SITEZI CHECKOUT]", error);

      const message =
        error?.message === "SESSION_REQUIRED"
          ? "Sua sessão expirou. Entre novamente na SITEZI e tente publicar."
          : error?.message || "Não consegui abrir o checkout agora. Tente novamente.";

      alert(message);
      setBusy(button, false);
    }
  }

  planButtons.forEach((button) => {
    button.onclick = (event) => {
      event?.preventDefault?.();
      showPaymentChoice(button);
    };
  });

  modal.querySelector(".sitezi-pay-close")?.addEventListener("click", hidePaymentChoice);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) hidePaymentChoice();
  });

  modal.querySelectorAll("[data-method]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!selectedButton) return;
      openCheckout(selectedButton, button.dataset.method);
    });
  });

  document.documentElement.dataset.siteziCheckout = "1.1";
})();
