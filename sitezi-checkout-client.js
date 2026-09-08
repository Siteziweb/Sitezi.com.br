/* =========================================================
   SITEZI — CHECKOUT ASAAS v1.0
   Conecta os botões dos planos ao Edge Function sitezi-checkout.
   Ambiente atual: Sandbox.
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

  function friendlyError(data, status) {
    if (status === 401) return "Sua sessão expirou. Entre novamente na SITEZI.";
    if (status === 403) return "Não consegui validar este site na sua conta.";
    if (data?.error) return data.error;
    return "Não consegui abrir o checkout agora. Tente novamente.";
  }

  async function openCheckout(button) {
    const plan = button.dataset.plan;
    if (!plan) return;

    setBusy(button, true);

    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession();

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
        body: JSON.stringify({ plan, siteId })
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
      openCheckout(button);
    };
  });

  document.documentElement.dataset.siteziCheckout = "1.0";
})();
