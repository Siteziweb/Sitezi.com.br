document.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    whatsapp: "5548996942186",
    defaultMessage: "Olá, João! Vi seu trabalho com desenvolvimento de sites e gostaria de solicitar um orçamento."
  };

  const waUrl = message => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

  document.querySelectorAll(".wa-link").forEach(link => {
    link.href = waUrl(CONFIG.defaultMessage);
    link.target = "_blank";
    link.rel = "noopener";
  });

  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("nav");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  }));

  const form = document.getElementById("quoteForm");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.getElementById("clientName").value.trim();
    const business = document.getElementById("businessName").value.trim();
    const type = document.getElementById("siteType").value;
    const details = document.getElementById("projectDetails").value.trim();

    const message = [
      `Olá, João! Meu nome é ${name}.`,
      business ? `Meu negócio é: ${business}.` : "",
      `Tenho interesse em: ${type}.`,
      details ? `O que eu preciso: ${details}` : "Gostaria de conversar sobre um orçamento.",
      "Vi seu site de desenvolvimento web."
    ].filter(Boolean).join("\n");

    window.open(waUrl(message), "_blank", "noopener");
  });

  document.getElementById("year").textContent = new Date().getFullYear();
});
