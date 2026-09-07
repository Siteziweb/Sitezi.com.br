document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const state = {
    step: 1,
    businessType: "",
    businessName: "",
    slogan: "",
    template: "modern",
    color: "#1578ff",
    logoMode: "text",
    logoData: "",
    imageMode: "none",
    photos: [],
    services: [],
    whatsapp: "",
    instagram: "",
    location: ""
  };

  const steps = [...document.querySelectorAll(".step")];
  const home = $("home");
  const wizard = $("wizard");
  const result = $("result");
  const plans = $("plans");

  /* =========================================================
     SITEZI V5.6 — AJUSTES ISOLADOS
     - Modelos realmente diferentes
     - Tela cheia sempre acessível
     - Domínio próprio legível no mobile
     Sem alterar a landing/Edu.
     ========================================================= */

  const runtimeStyle = document.createElement("style");
  runtimeStyle.id = "sitezi-v56-runtime";
  runtimeStyle.textContent = `
    /* Resultado: mantém ações visíveis no celular */
    @media(max-width:850px){
      body.result-open{
        overflow:hidden!important;
      }
      body.result-open .result-screen.active{
        height:100dvh!important;
        min-height:100dvh!important;
      }
      body.result-open .result-shell{
        height:100dvh!important;
        min-height:100dvh!important;
        grid-template-rows:auto auto auto minmax(0,1fr) auto!important;
      }
      body.result-open .preview-stage{
        min-height:0!important;
        overflow:hidden!important;
      }
      body.result-open .result-actions{
        position:relative!important;
        z-index:12!important;
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        padding:8px 18px calc(12px + env(safe-area-inset-bottom))!important;
        background:#07101b!important;
        border-top:1px solid #142235!important;
      }
      body.result-open #fullPreview{
        grid-column:1 / 3!important;
        order:-1!important;
        min-height:46px!important;
        border-color:#1687ff!important;
        color:#fff!important;
        background:#0b1d31!important;
      }
      body.result-open #editSite,
      body.result-open #publishSite{
        min-height:44px!important;
      }
    }

    /* Prévia tela cheia */
    .full-preview-screen{
      position:fixed!important;
      inset:0!important;
      z-index:9999!important;
      width:100vw!important;
      height:100dvh!important;
      background:#02060a!important;
      display:grid!important;
      grid-template-rows:auto minmax(0,1fr)!important;
    }
    .full-preview-screen.hidden{
      display:none!important;
    }
    .full-preview-screen .preview-toolbar{
      margin:0!important;
      min-height:62px!important;
      border-radius:0!important;
      border-left:0!important;
      border-right:0!important;
      border-top:0!important;
      display:grid!important;
      grid-template-columns:auto 1fr auto!important;
      gap:12px!important;
      align-items:center!important;
      padding:10px 14px!important;
      background:#07101b!important;
    }
    .full-preview-screen .preview-toolbar span{
      text-align:center!important;
      max-width:none!important;
      white-space:normal!important;
    }
    .full-preview-screen iframe{
      width:100%!important;
      height:100%!important;
      border:0!important;
      background:#fff!important;
      display:block!important;
    }
    .preview-back,.preview-publish{
      min-height:42px!important;
      border-radius:11px!important;
      padding:9px 14px!important;
      font-weight:850!important;
      cursor:pointer!important;
    }
    .preview-back{
      color:#dce8f5!important;
      background:#0b1725!important;
      border:1px solid #2c4159!important;
    }
    .preview-publish{
      color:#fff!important;
      background:linear-gradient(135deg,#0875ff,#0752e8)!important;
      border:1px solid #1687ff!important;
    }

    /* Modal simples de domínio próprio */
    .sitezi-domain-modal{
      position:fixed;
      inset:0;
      z-index:10050;
      display:grid;
      place-items:center;
      padding:20px;
      background:rgba(0,3,10,.82);
      backdrop-filter:blur(12px);
    }
    .sitezi-domain-card{
      width:min(460px,100%);
      border:1px solid #235ed0;
      border-radius:24px;
      padding:24px;
      background:linear-gradient(180deg,#0c1628,#050b16);
      box-shadow:0 30px 100px rgba(0,0,0,.65);
      color:#f8fbff;
      position:relative;
    }
    .sitezi-domain-card .close-domain{
      position:absolute;
      right:12px;
      top:10px;
      width:38px;
      height:38px;
      border-radius:50%;
      border:1px solid #273b59;
      background:#0a1220;
      color:#fff;
      font-size:24px;
    }
    .sitezi-domain-card .domain-badge{
      display:inline-flex;
      align-items:center;
      gap:7px;
      color:#54bcff;
      border:1px solid #1d5fae;
      background:#091c32;
      border-radius:999px;
      padding:7px 10px;
      font-size:12px;
      font-weight:900;
      margin-bottom:14px;
    }
    .sitezi-domain-card h3{
      font-size:25px;
      margin:0 36px 10px 0;
      letter-spacing:-.8px;
    }
    .sitezi-domain-card p{
      color:#aebccc;
      line-height:1.55;
      margin:0 0 15px;
    }
    .sitezi-domain-example{
      display:grid;
      grid-template-columns:1fr;
      gap:9px;
      margin:18px 0;
    }
    .sitezi-domain-example div{
      border:1px solid #243954;
      border-radius:14px;
      padding:13px;
      background:#08111e;
    }
    .sitezi-domain-example small{
      display:block;
      color:#718399;
      margin-bottom:4px;
    }
    .sitezi-domain-example b{
      display:block;
      overflow-wrap:anywhere;
    }
    .sitezi-domain-card .domain-note{
      font-size:12px;
      color:#8495a8;
      margin-bottom:0;
    }

    @media(max-width:600px){
      .full-preview-screen .preview-toolbar{
        grid-template-columns:1fr 1fr!important;
      }
      .full-preview-screen .preview-toolbar span{
        grid-column:1 / 3!important;
        grid-row:1!important;
        font-size:11px!important;
      }
      .full-preview-screen .preview-back{
        grid-column:1!important;
        grid-row:2!important;
      }
      .full-preview-screen .preview-publish{
        grid-column:2!important;
        grid-row:2!important;
      }
      .sitezi-domain-card{
        padding:22px 18px;
        border-radius:20px;
      }
    }
  `;
  document.head.appendChild(runtimeStyle);

  function showScreen(el) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    el.classList.add("active");

    document.body.classList.remove("wizard-open", "result-open", "plans-open");
    if (el === wizard) document.body.classList.add("wizard-open");
    if (el === result) document.body.classList.add("result-open");
    if (el === plans) document.body.classList.add("plans-open");
  }

  function resetScroll() {
    const active = document.querySelector(".step.active");
    if (active) active.scrollTop = 0;
  }

  const businessPlaceholders = {
    "Oficina Mecânica": {
      name: "Ex.: Auto Prime",
      slogan: "Ex.: Manutenção automotiva com confiança"
    },
    "Restaurante": {
      name: "Ex.: Sabor da Casa",
      slogan: "Ex.: Sabor que dá vontade de voltar"
    },
    "Barbearia": {
      name: "Ex.: Barbearia Imperial",
      slogan: "Ex.: Corte, barba e estilo em um só lugar"
    },
    "Salão de Beleza": {
      name: "Ex.: Studio Bella",
      slogan: "Ex.: Beleza e cuidado para você"
    },
    "Moda e Vestuário": {
      name: "Ex.: Urban Style",
      slogan: "Ex.: Moda que combina com você"
    },
    "Loja / Comércio": {
      name: "Ex.: Loja Central",
      slogan: "Ex.: Tudo o que você procura em um só lugar"
    },
    "Clínica / Saúde": {
      name: "Ex.: Clínica Vida",
      slogan: "Ex.: Cuidado e bem-estar em primeiro lugar"
    },
    "Prestador de Serviços": {
      name: "Ex.: Prime Serviços",
      slogan: "Ex.: Soluções profissionais para você"
    },
    "Outro": {
      name: "Ex.: Meu Negócio",
      slogan: "Ex.: Qualidade, confiança e bom atendimento"
    }
  };

  const servicePlaceholders = {
    "Oficina Mecânica": "Troca de óleo, Freios, Suspensão",
    "Restaurante": "Almoço, Delivery, Reservas",
    "Barbearia": "Corte masculino, Barba, Sobrancelha",
    "Salão de Beleza": "Corte, Escova, Coloração",
    "Moda e Vestuário": "Camisetas, Calças, Acessórios",
    "Loja / Comércio": "Produtos, Entregas, Atendimento",
    "Clínica / Saúde": "Consultas, Avaliações, Procedimentos",
    "Prestador de Serviços": "Serviço 1, Serviço 2, Serviço 3",
    "Outro": "Produto ou serviço 1, Produto ou serviço 2, Produto ou serviço 3"
  };

  function updateBusinessPlaceholders() {
    const fields =
      businessPlaceholders[state.businessType] ||
      businessPlaceholders.Outro;

    if ($("businessName")) {
      $("businessName").placeholder = fields.name;
    }

    if ($("businessSlogan")) {
      $("businessSlogan").placeholder = fields.slogan;
    }
  }

  function updateServicesPlaceholder() {
    const field = $("servicesInput");
    if (!field) return;

    field.placeholder =
      servicePlaceholders[state.businessType] ||
      servicePlaceholders.Outro;
  }

  function updateStep() {
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === state.step));
    $("progressText").textContent = `${state.step} de 8`;
    $("progressBar").style.width = `${state.step / 8 * 100}%`;
    $("backBtn").style.visibility = state.step === 1 ? "hidden" : "visible";
    $("nextBtn").classList.toggle("hidden", state.step === 8);
    $("nextBtn").textContent = "Continuar →";

    document.body.classList.toggle("step-2-active", state.step === 2);

    if (state.step === 2) updateBusinessPlaceholders();
    if (state.step === 7) updateServicesPlaceholder();
    if (state.step === 8) renderReview();
    resetScroll();
  }

  function start() {
    showScreen(wizard);
    updateStep();
  }

  $("startBtn").onclick = start;
  $("topCreate").onclick = start;

  $("brandHome").onclick = e => {
    e.preventDefault();
    document.body.classList.remove("step-2-active");
    showScreen(home);
  };

  $("cancelWizard").onclick = () => showScreen(home);
  $("newSite").onclick = () => location.reload();

  document.querySelectorAll(".business").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".business").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.businessType = btn.dataset.business;

    setTimeout(() => {
      if (state.step === 1) {
        state.step = 2;
        updateStep();
        requestAnimationFrame(() =>
          document.getElementById("businessName")?.focus({ preventScroll: true })
        );
      }
    }, 120);
  });

  const fallbackSuggestions = {
    "Oficina Mecânica": [
      "Confiança para cuidar do seu carro.",
      "Manutenção automotiva com qualidade."
    ],
    "Restaurante": [
      "Sabor que dá vontade de voltar.",
      "Uma experiência deliciosa em cada pedido."
    ],
    "Barbearia": [
      "Seu estilo em boas mãos.",
      "Corte, barba e personalidade."
    ],
    "Salão de Beleza": [
      "Realce o melhor de você.",
      "Beleza e cuidado em cada detalhe."
    ],
    "Moda e Vestuário": [
      "Vista sua melhor versão.",
      "Moda para acompanhar o seu estilo."
    ],
    "Loja / Comércio": [
      "Tudo o que você procura, mais perto de você.",
      "Produtos, novidades e bom atendimento."
    ],
    "Clínica / Saúde": [
      "Cuidado profissional perto de você.",
      "Saúde e bem-estar com atenção de verdade."
    ],
    "Prestador de Serviços": [
      "A solução certa para o que você precisa.",
      "Serviço profissional, direto e confiável."
    ],
    "Outro": [
      "Uma presença profissional para o seu negócio.",
      "Qualidade, confiança e atendimento."
    ]
  };

  $("suggestBrand").onclick = async () => {
    const name = $("businessName").value.trim();
    if (!name) {
      alert("Digite primeiro o nome do seu negócio.");
      return;
    }

    const options = fallbackSuggestions[state.businessType] || fallbackSuggestions.Outro;
    const pick = options[Math.floor(Math.random() * options.length)];

    $("suggestionBox").innerHTML =
      `<b>Sugestão:</b> ${pick}<br><button type="button" id="useSuggestion">Usar esta sugestão</button>`;
    $("suggestionBox").classList.remove("hidden");

    setTimeout(() => {
      $("useSuggestion")?.addEventListener("click", () => {
        $("businessSlogan").value = pick;
        $("suggestionBox").classList.add("hidden");
      });
    }, 0);
  };

  document.querySelectorAll(".template-card").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".template-card").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.template = btn.dataset.template;
  });

  document.querySelectorAll(".color").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".color").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.color = btn.dataset.color;
    $("colorPreview").style.setProperty("--accent", state.color);
  });

  $("colorPreview").style.setProperty("--accent", state.color);

  document.querySelectorAll("[data-logo-mode]").forEach(btn => btn.onclick = () => {
    document.querySelectorAll("[data-logo-mode]").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.logoMode = btn.dataset.logoMode;

    if (state.logoMode === "ai") {
      alert("A geração de logo com IA será ativada assim que conectarmos o backend.");
    }
  });

  $("logoUpload").addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const r = new FileReader();
    r.onload = () => {
      state.logoData = r.result;
      state.logoMode = "upload";
      $("logoPreview").innerHTML = `<img src="${r.result}" alt="Prévia da logo">`;
      $("logoPreview").classList.remove("hidden");
    };
    r.readAsDataURL(file);
  });

  document.querySelectorAll("[data-image-mode]").forEach(btn => btn.onclick = () => {
    document.querySelectorAll("[data-image-mode]").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.imageMode = btn.dataset.imageMode;

    if (state.imageMode === "ai") {
      alert("A geração de imagens com IA será ativada quando conectarmos o backend.");
    }
  });

  $("photoUpload").addEventListener("change", e => {
    const files = [...(e.target.files || [])].slice(0, 6);
    if (!files.length) return;

    state.photos = [];
    $("photoPreview").innerHTML = "";

    files.forEach(file => {
      const r = new FileReader();
      r.onload = () => {
        state.photos.push(r.result);
        const img = document.createElement("img");
        img.src = r.result;
        $("photoPreview").appendChild(img);
        $("photoPreview").classList.remove("hidden");
        state.imageMode = "upload";
      };
      r.readAsDataURL(file);
    });
  });

  function normalizeWhatsApp(value) {
    let d = String(value || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("55")) return d;
    if (d.length === 10 || d.length === 11) return "55" + d;
    return d;
  }

  function collect() {
    state.businessName = $("businessName").value.trim();
    state.slogan = $("businessSlogan").value.trim();
    state.services = $("servicesInput").value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
      .slice(0, 8);

    state.whatsapp = normalizeWhatsApp($("whatsapp").value);
    state.instagram = $("instagram").value.trim();
    state.location = $("location").value.trim();
  }

  function validateStep() {
    collect();

    if (state.step === 1 && !state.businessType) {
      alert("Escolha o tipo do seu negócio.");
      return false;
    }

    if (state.step === 2 && !state.businessName) {
      alert("Digite o nome do seu negócio.");
      return false;
    }

    if (state.step === 7) {
      if (!state.services.length) {
        alert("Adicione pelo menos um serviço.");
        return false;
      }

      if (!state.whatsapp) {
        alert("Digite seu WhatsApp.");
        return false;
      }
    }

    return true;
  }

  $("nextBtn").onclick = () => {
    if (validateStep() && state.step < 8) {
      state.step++;
      updateStep();
    }
  };

  $("saveNameContinue").onclick = () => {
    if (state.step !== 2) return;
    if (!validateStep()) return;
    state.step = 3;
    updateStep();
  };

  $("backBtn").onclick = () => {
    if (state.step > 1) {
      state.step--;
      updateStep();
    }
  };

  function renderReview() {
    collect();

    const tpl = {
      modern: "Moderno",
      premium: "Premium",
      dynamic: "Dinâmico"
    }[state.template];

    const logo =
      state.logoMode === "upload" ? "Logo enviada" :
      state.logoMode === "ai" ? "Logo com IA" :
      "Nome como marca";

    const img =
      state.imageMode === "upload" ? `${state.photos.length} foto(s) enviada(s)` :
      state.imageMode === "ai" ? "Gerar com IA" :
      "Sem imagens";

    $("reviewCard").innerHTML = `
      <div class="review-row"><span>Negócio</span><b>${esc(state.businessType)}</b></div>
      <div class="review-row"><span>Nome</span><b>${esc(state.businessName)}</b></div>
      <div class="review-row"><span>Modelo</span><b>${tpl}</b></div>
      <div class="review-row"><span>Identidade</span><b>${logo}</b></div>
      <div class="review-row"><span>Imagens</span><b>${img}</b></div>
      <div class="review-row"><span>Serviços</span><b>${state.services.length}</b></div>
    `;
  }

  function esc(t) {
    return String(t || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function escapeHtml(t) {
    return esc(t);
  }

  function slug(t) {
    return String(t || "site")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "site";
  }

  function getProfile() {
    const profiles = {
      "Oficina Mecânica": {
        k: "OFICINA MECÂNICA",
        h: "Seu carro em boas mãos.",
        about: "Cuidado automotivo com transparência, agilidade e atenção em cada detalhe.",
        symbol: "⚙"
      },
      "Restaurante": {
        k: "RESTAURANTE",
        h: "Sabor que dá vontade de voltar.",
        about: "Uma experiência feita para transformar cada pedido em um momento especial.",
        symbol: "◉"
      },
      "Barbearia": {
        k: "BARBEARIA",
        h: "Seu estilo começa aqui.",
        about: "Técnica, cuidado e personalidade para você sair com o visual em dia.",
        symbol: "✂"
      },
      "Salão de Beleza": {
        k: "SALÃO DE BELEZA",
        h: "Realce o melhor de você.",
        about: "Beleza, bem-estar e atendimento personalizado em um só lugar.",
        symbol: "✦"
      },
      "Moda e Vestuário": {
        k: "MODA E VESTUÁRIO",
        h: "Vista sua melhor versão.",
        about: "Coleções, novidades e peças escolhidas para acompanhar o seu estilo.",
        symbol: "◇"
      },
      "Loja / Comércio": {
        k: "LOJA & COMÉRCIO",
        h: "Tudo o que você procura, mais perto.",
        about: "Produtos, novidades e atendimento próximo em uma experiência simples e profissional.",
        symbol: "▦"
      },
      "Clínica / Saúde": {
        k: "SAÚDE & BEM-ESTAR",
        h: "Cuidado profissional perto de você.",
        about: "Atendimento humanizado e compromisso com o seu bem-estar.",
        symbol: "✚"
      },
      "Prestador de Serviços": {
        k: "SERVIÇOS",
        h: "A solução certa para o que você precisa.",
        about: "Serviço profissional, direto e confiável para facilitar o seu dia.",
        symbol: "✓"
      },
      "Outro": {
        k: "SEU NEGÓCIO",
        h: "Uma presença profissional para sua marca.",
        about: "Um site moderno para aproximar seu negócio de novos clientes.",
        symbol: "★"
      }
    };

    return profiles[state.businessType] || profiles.Outro;
  }

  function siteHTML() {
    collect();

    const p = getProfile();
    const name = esc(state.businessName);
    const slogan = esc(state.slogan || p.h);
    const loc = esc(state.location || "Atendimento na sua região");
    const ig = esc(state.instagram.replace(/^@/, ""));
    const wa = state.whatsapp;

    const waHref = wa
      ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}`
      : "#";

    const logo = state.logoData
      ? `<img class="brand-img" src="${state.logoData}" alt="${name}">`
      : `<strong class="site-brand">${name}</strong>`;

    const heroMedia = state.photos[0]
      ? `<img src="${state.photos[0]}" alt="">`
      : `<div class="generated-visual"><span>${p.symbol}</span><b>${p.k}</b></div>`;

    const cards = state.services.map((s, i) => `
      <article>
        <span>0${i + 1}</span>
        <i>${p.symbol}</i>
        <h3>${esc(s)}</h3>
        <p>Atendimento profissional, qualidade e atenção em cada detalhe.</p>
      </article>
    `).join("");

    const gallery = state.photos.length > 1
      ? `<section class="wrap gallery">${state.photos.slice(1, 4).map(x => `<img src="${x}" alt="">`).join("")}</section>`
      : "";

    const templateClass = `tpl-${state.template}`;

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:Inter,Arial,sans-serif}
a{text-decoration:none;color:inherit}
.wrap{width:min(1140px,calc(100% - 36px));margin:auto}
.brand-img{max-height:42px;max-width:170px}
.site-brand{font-size:20px;font-weight:950}
.nav{height:74px;display:flex;align-items:center;justify-content:space-between}
.links{display:flex;gap:22px;font-size:13px}
.hero{position:relative;overflow:hidden}
.hero h1{margin:14px 0}
.hero p{line-height:1.65}
.k{font-size:11px;font-weight:950;letter-spacing:1.8px}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
.cta,.secondary{display:inline-flex;align-items:center;justify-content:center;padding:14px 17px;font-weight:900}
.media{overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover}
.generated-visual{height:100%;display:grid;place-items:center;align-content:center}
.generated-visual span{font-size:76px}
.generated-visual b{font-size:12px;letter-spacing:3px;margin-top:12px}
.section{padding:78px 0}
.section h2{margin:8px 0}
.lead{line-height:1.65}
.services{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px}
.services article{min-height:190px}
.services span{font-size:11px}
.services i{float:right;font-style:normal}
.services h3{margin-top:28px}
.services p{font-size:13px;line-height:1.55}
.about{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-bottom:72px}
.gallery img{width:100%;height:250px;object-fit:cover}
.contact{display:flex;justify-content:space-between;gap:20px;align-items:center}
.meta{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;margin-top:14px}
footer{padding:30px 0}

/* =========================================================
   MODELO MODERNO
   Dark, tecnológico, direto e forte.
   ========================================================= */
.tpl-modern{
  background:#070b11;
  color:#f7fbff;
}
.tpl-modern header{
  border-bottom:1px solid #202c39;
  background:rgba(7,11,17,.88);
  backdrop-filter:blur(16px);
  position:sticky;
  top:0;
  z-index:20;
}
.tpl-modern .links{color:#99a8b7}
.tpl-modern .hero{
  min-height:590px;
  display:grid;
  grid-template-columns:1.03fr .97fr;
  gap:42px;
  align-items:center;
  padding:56px 0;
}
.tpl-modern .hero:before{
  content:"";
  position:absolute;
  width:430px;height:430px;
  right:-150px;top:-120px;
  border-radius:50%;
  background:${state.color}22;
  filter:blur(70px);
}
.tpl-modern .k{color:${state.color}}
.tpl-modern .hero h1{
  font-size:clamp(46px,7vw,78px);
  line-height:.95;
  letter-spacing:-3.6px;
}
.tpl-modern .hero p{color:#a8b5c2;max-width:580px}
.tpl-modern .cta{
  background:${state.color};
  color:white;
  border-radius:11px;
  box-shadow:0 14px 35px ${state.color}33;
}
.tpl-modern .secondary{
  border:1px solid #304154;
  border-radius:11px;
  color:#dbe5ee;
}
.tpl-modern .media{
  height:410px;
  border-radius:28px;
  border:1px solid #2b3846;
  background:#101720;
  box-shadow:0 26px 70px rgba(0,0,0,.34);
}
.tpl-modern .generated-visual{
  background:
    radial-gradient(circle at 66% 30%,${state.color}55,transparent 28%),
    linear-gradient(145deg,#101722,#161c24);
}
.tpl-modern .generated-visual span{color:${state.color}}
.tpl-modern .section.alt{background:#0e141b}
.tpl-modern .section h2{font-size:40px;letter-spacing:-1.5px}
.tpl-modern .lead{color:#9ba8b5}
.tpl-modern .services article{
  border:1px solid #293642;
  border-radius:18px;
  padding:21px;
  background:#0b1016;
}
.tpl-modern .services span{color:#68798a}
.tpl-modern .services i{color:${state.color}}
.tpl-modern .services p{color:#8998a8}
.tpl-modern .about-box{
  border:1px solid #2b3845;
  border-radius:22px;
  padding:26px;
  background:#0d131a;
}
.tpl-modern .contact{
  border:1px solid #2b3845;
  border-radius:24px;
  padding:28px;
  background:linear-gradient(135deg,#101820,#0b1117);
}
.tpl-modern .contact p,.tpl-modern .meta{color:#93a1b0}
.tpl-modern footer{color:#718091;border-top:1px solid #242e38}

/* =========================================================
   MODELO PREMIUM
   Claro, elegante, sofisticado e editorial.
   ========================================================= */
.tpl-premium{
  background:#f5f0e8;
  color:#191714;
  font-family:Georgia,"Times New Roman",serif;
}
.tpl-premium header{
  background:#f5f0e8;
  border-bottom:1px solid #d8cbb9;
}
.tpl-premium .nav{height:86px}
.tpl-premium .site-brand{font-size:24px;letter-spacing:.2px}
.tpl-premium .links{
  color:#6e6254;
  font-family:Inter,Arial,sans-serif;
  font-size:12px;
  letter-spacing:.6px;
  text-transform:uppercase;
}
.tpl-premium .hero{
  min-height:680px;
  display:grid;
  grid-template-columns:.88fr 1.12fr;
  gap:60px;
  align-items:center;
  padding:74px 0;
}
.tpl-premium .k{
  color:${state.color};
  font-family:Inter,Arial,sans-serif;
}
.tpl-premium .hero h1{
  font-size:clamp(52px,7vw,88px);
  line-height:.94;
  letter-spacing:-3px;
  font-weight:500;
}
.tpl-premium .hero p{
  color:#72685c;
  max-width:540px;
  font-size:17px;
}
.tpl-premium .cta{
  background:#191714;
  color:#fff;
  border-radius:0;
  padding:15px 21px;
  font-family:Inter,Arial,sans-serif;
  font-size:13px;
}
.tpl-premium .secondary{
  border-bottom:1px solid #191714;
  border-radius:0;
  padding-left:2px;
  padding-right:2px;
  font-family:Inter,Arial,sans-serif;
  font-size:13px;
}
.tpl-premium .media{
  height:500px;
  border-radius:220px 220px 26px 26px;
  border:1px solid #c9bba7;
  background:#dfd2bf;
  box-shadow:0 28px 60px rgba(76,59,39,.18);
}
.tpl-premium .generated-visual{
  background:
    radial-gradient(circle at 50% 30%,rgba(255,255,255,.8),transparent 25%),
    linear-gradient(145deg,#e9dece,#cbbba5);
}
.tpl-premium .generated-visual span{color:${state.color}}
.tpl-premium .generated-visual b{color:#4c4338}
.tpl-premium .section{padding:96px 0}
.tpl-premium .section.alt{background:#eae1d5}
.tpl-premium .section h2{
  font-size:48px;
  font-weight:500;
  letter-spacing:-1.8px;
}
.tpl-premium .lead{color:#776d61}
.tpl-premium .services{
  gap:22px;
  margin-top:38px;
}
.tpl-premium .services article{
  border-top:1px solid #bfb19e;
  padding:24px 4px 12px;
  background:transparent;
  min-height:205px;
}
.tpl-premium .services span{color:#9b8b76;font-family:Inter,Arial,sans-serif}
.tpl-premium .services i{color:${state.color}}
.tpl-premium .services h3{font-size:23px;font-weight:500}
.tpl-premium .services p{color:#756b60}
.tpl-premium .about-box{
  padding:36px;
  border:1px solid #cdbfaa;
  background:#efe7dc;
}
.tpl-premium .gallery{gap:18px}
.tpl-premium .gallery img{
  height:320px;
  border-radius:2px;
}
.tpl-premium .contact{
  padding:44px;
  border:1px solid #c8b9a5;
  background:#f5f0e8;
}
.tpl-premium .contact p,.tpl-premium .meta{color:#766b5f}
.tpl-premium footer{
  color:#85786a;
  border-top:1px solid #d1c5b6;
  font-family:Inter,Arial,sans-serif;
  font-size:12px;
}

/* =========================================================
   MODELO DINÂMICO
   Comercial, energético, cheio de destaques e chamadas.
   ========================================================= */
.tpl-dynamic{
  background:#101014;
  color:#fff;
}
.tpl-dynamic header{
  background:${state.color};
  color:#fff;
}
.tpl-dynamic .nav{height:72px}
.tpl-dynamic .links{
  color:#fff;
  font-weight:800;
}
.tpl-dynamic .hero{
  width:min(1180px,calc(100% - 24px));
  min-height:570px;
  display:grid;
  grid-template-columns:1fr .92fr;
  gap:28px;
  align-items:center;
  padding:52px 44px;
  margin:18px auto 0;
  border-radius:34px;
  background:
    linear-gradient(130deg,${state.color},${state.color}bb 48%,#17171d 48.2%);
}
.tpl-dynamic .k{
  color:#fff;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(255,255,255,.3);
  padding:7px 10px;
  border-radius:999px;
  display:inline-flex;
}
.tpl-dynamic .hero h1{
  font-size:clamp(46px,7vw,78px);
  line-height:.92;
  letter-spacing:-3.8px;
  text-transform:uppercase;
  max-width:690px;
}
.tpl-dynamic .hero p{
  color:rgba(255,255,255,.88);
  max-width:560px;
}
.tpl-dynamic .cta{
  background:#fff;
  color:#111;
  border-radius:999px;
  padding:14px 20px;
}
.tpl-dynamic .secondary{
  border:1px solid rgba(255,255,255,.6);
  color:#fff;
  border-radius:999px;
}
.tpl-dynamic .media{
  height:390px;
  border:8px solid #fff;
  border-radius:26px;
  transform:rotate(2deg);
  background:#17171d;
  box-shadow:0 25px 60px rgba(0,0,0,.3);
}
.tpl-dynamic .generated-visual{
  background:
    radial-gradient(circle at 65% 30%,${state.color}88,transparent 30%),
    linear-gradient(145deg,#1b1b21,#0c0c10);
}
.tpl-dynamic .generated-visual span{color:#fff}
.tpl-dynamic .section{padding:76px 0}
.tpl-dynamic .section.alt{background:#18181e}
.tpl-dynamic .section h2{
  font-size:44px;
  text-transform:uppercase;
  letter-spacing:-2px;
}
.tpl-dynamic .lead{color:#aaaab5}
.tpl-dynamic .services{
  grid-template-columns:repeat(3,1fr);
  gap:12px;
}
.tpl-dynamic .services article{
  position:relative;
  overflow:hidden;
  border:0;
  border-radius:20px;
  padding:23px;
  background:#222229;
  box-shadow:inset 0 5px 0 ${state.color};
}
.tpl-dynamic .services article:nth-child(even){
  background:${state.color};
}
.tpl-dynamic .services span{color:#9696a3}
.tpl-dynamic .services article:nth-child(even) span,
.tpl-dynamic .services article:nth-child(even) p{color:rgba(255,255,255,.82)}
.tpl-dynamic .services i{color:#fff}
.tpl-dynamic .services p{color:#a4a4af}
.tpl-dynamic .about-box{
  border-radius:24px;
  padding:28px;
  background:${state.color};
  border:0;
}
.tpl-dynamic .gallery img{
  border-radius:20px;
  transform:rotate(-1deg);
}
.tpl-dynamic .gallery img:nth-child(2){transform:rotate(1.5deg)}
.tpl-dynamic .contact{
  padding:32px;
  border-radius:28px;
  background:${state.color};
}
.tpl-dynamic .contact .cta{
  background:#fff;
  color:#111;
}
.tpl-dynamic .contact p,.tpl-dynamic .meta{color:#c7c7d0}
.tpl-dynamic footer{color:#85858e;border-top:1px solid #2c2c33}

@media(max-width:720px){
  .links{display:none}
  .hero,.about{grid-template-columns:1fr!important}

  .tpl-modern .hero{
    min-height:auto;
    padding:44px 0;
  }
  .tpl-modern .hero h1{font-size:48px}
  .tpl-modern .media{height:310px}
  .tpl-modern .services{grid-template-columns:1fr}

  .tpl-premium .hero{
    min-height:auto;
    padding:48px 0 58px;
    gap:34px;
  }
  .tpl-premium .hero h1{font-size:50px}
  .tpl-premium .media{
    height:360px;
    border-radius:160px 160px 18px 18px;
  }
  .tpl-premium .section{padding:68px 0}
  .tpl-premium .section h2{font-size:39px}
  .tpl-premium .services{grid-template-columns:1fr}
  .tpl-premium .gallery{grid-template-columns:1fr}
  .tpl-premium .gallery img{height:260px}

  .tpl-dynamic .hero{
    width:calc(100% - 20px);
    min-height:auto;
    padding:36px 20px;
    background:
      linear-gradient(160deg,${state.color},${state.color}dd 53%,#17171d 53.2%);
  }
  .tpl-dynamic .hero h1{font-size:46px}
  .tpl-dynamic .media{
    height:300px;
    transform:none;
  }
  .tpl-dynamic .services{grid-template-columns:1fr}
  .tpl-dynamic .gallery{grid-template-columns:1fr}
  .tpl-dynamic .gallery img{height:220px}
  .tpl-dynamic .contact{
    align-items:flex-start;
    flex-direction:column;
  }

  .gallery{grid-template-columns:1fr}
  .contact{align-items:flex-start;flex-direction:column}
}
</style>
</head>

<body class="${templateClass}">
<header>
  <div class="wrap nav">
    ${logo}
    <nav class="links">
      <a href="#servicos">Serviços</a>
      <a href="#sobre">Sobre</a>
      <a href="#contato">Contato</a>
    </nav>
  </div>
</header>

<main>
  <section class="wrap hero">
    <div>
      <span class="k">${p.k}</span>
      <h1>${slogan}</h1>
      <p>${esc(p.about)}</p>
      <div class="actions">
        <a class="cta" href="${waHref}" target="_blank">Falar no WhatsApp</a>
        <a class="secondary" href="#servicos">Ver serviços</a>
      </div>
    </div>
    <div class="media">${heroMedia}</div>
  </section>

  <section id="servicos" class="section alt">
    <div class="wrap">
      <span class="k">O QUE FAZEMOS</span>
      <h2>Serviços para você.</h2>
      <p class="lead">Conheça algumas das soluções oferecidas pela ${name}.</p>
      <div class="services">${cards}</div>
    </div>
  </section>

  <section id="sobre" class="section">
    <div class="wrap about">
      <div>
        <span class="k">SOBRE NÓS</span>
        <h2>Confiança do primeiro contato ao resultado.</h2>
        <p class="lead">${esc(state.slogan || p.about)}</p>
      </div>

      <div class="about-box">
        <b>${name}</b>
        <p>${loc}</p>
        <div class="meta">
          ${ig ? `<span>Instagram: @${ig}</span>` : ""}
          <span>Atendimento direto</span>
          <span>Qualidade e confiança</span>
        </div>
      </div>
    </div>
  </section>

  ${gallery}

  <section id="contato" class="section alt">
    <div class="wrap contact">
      <div>
        <span class="k">FALE CONOSCO</span>
        <h2>Vamos conversar?</h2>
        <p>${loc}</p>
      </div>
      <a class="cta" href="${waHref}" target="_blank">Chamar no WhatsApp →</a>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">${name} • Site criado com SITEZI.</div>
</footer>
</body>
</html>`;
  }

  $("generateSite").onclick = () => {
    if (!validateStep()) return;

    $("sitePreview").srcdoc = siteHTML();
    $("previewDomain").textContent = `${slug(state.businessName)}.sitezi.com.br`;
    showScreen(result);
  };

  $("editSite").onclick = () => {
    showScreen(wizard);
    state.step = 7;
    updateStep();
  };

  document.querySelectorAll(".device").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".device").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    $("previewStage").classList.toggle("mobile", btn.dataset.device === "mobile");
  });

  $("publishSite").onclick = () => showScreen(plans);
  $("closePlans").onclick = () => showScreen(result);

  document.querySelectorAll(".choose-plan").forEach(btn => btn.onclick = () => {
    const plan = btn.dataset.plan;
    const price = btn.dataset.price;

    alert(
      `Plano ${plan} — R$ ${price}/mês\n\n` +
      "A escolha do plano já está pronta. Na próxima integração, este botão abrirá o checkout e, após o pagamento, publicará o site."
    );
  });

  /* Mantém a página de exemplos existente */
  if ($("seeExample")) {
    $("seeExample").onclick = () => {
      window.location.href = "modelos.html";
    };
  }

  /* =========================================================
     ENTRADA PELOS EXEMPLOS
     Se veio de modelos.html, abre o criador já com o tipo
     de negócio correspondente selecionado.
     ========================================================= */
  const chosenExample = new URLSearchParams(window.location.search).get("modelo");

  if (chosenExample) {
    const exampleBusinessMap = {
      "Barbearia": "Barbearia",
      "Restaurante": "Restaurante",
      "Loja de roupas": "Moda e Vestuário",
      "Estética e salão": "Salão de Beleza",
      "Oficina e Auto Center": "Oficina Mecânica",
      "Profissional e Empresa": "Prestador de Serviços"
    };

    state.businessType = exampleBusinessMap[chosenExample] || "Outro";

    document.querySelectorAll(".business").forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.business === state.businessType
      );
    });

    showScreen(wizard);
    state.step = 2;
    updateStep();

    localStorage.removeItem("sitezi_modelo_escolhido");

    if (window.history?.replaceState) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    requestAnimationFrame(() => {
      $("businessName")?.focus({ preventScroll: true });
    });
  } else {
    updateStep();
  }

  /* =========================================================
     PRÉVIA EM TELA CHEIA
     ========================================================= */
  const fullPreviewScreen = $("fullPreviewScreen");
  const fullPreviewFrame = $("fullPreviewFrame");

  function openFullPreview() {
    const sourceFrame = $("sitePreview");

    if (sourceFrame && fullPreviewFrame) {
      fullPreviewFrame.srcdoc =
        sourceFrame.srcdoc ||
        sourceFrame.getAttribute("srcdoc") ||
        siteHTML();
    }

    fullPreviewScreen?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeFullPreview() {
    fullPreviewScreen?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  if ($("fullPreview")) $("fullPreview").onclick = openFullPreview;
  if ($("exitFullPreview")) $("exitFullPreview").onclick = closeFullPreview;

  if ($("publishFromPreview")) {
    $("publishFromPreview").onclick = () => {
      closeFullPreview();
      showScreen(plans);
    };
  }

  /* =========================================================
     DOMÍNIO PRÓPRIO
     Abre explicação clara inclusive no celular.
     ========================================================= */
  function openDomainModal() {
    document.querySelector(".sitezi-domain-modal")?.remove();

    const modal = document.createElement("div");
    modal.className = "sitezi-domain-modal";
    modal.innerHTML = `
      <div class="sitezi-domain-card" role="dialog" aria-modal="true" aria-label="O que é domínio próprio?">
        <button type="button" class="close-domain" aria-label="Fechar">×</button>
        <span class="domain-badge">ⓘ DOMÍNIO PRÓPRIO</span>
        <h3>É o endereço exclusivo do seu negócio na internet.</h3>
        <p>
          Em vez de usar apenas um endereço da SITEZI, você pode ter um endereço
          com o nome da sua própria marca.
        </p>

        <div class="sitezi-domain-example">
          <div>
            <small>Endereço SITEZI</small>
            <b>minhaloja.sitezi.com.br</b>
          </div>
          <div>
            <small>Domínio próprio</small>
            <b>minhaloja.com.br</b>
          </div>
        </div>

        <p>
          A SITEZI orienta a conexão do domínio. Caso você ainda não tenha um,
          o registro pode ter custo separado.
        </p>

        <p class="domain-note">
          Depois de configurado, seu site continua protegido com HTTPS.
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();

    modal.querySelector(".close-domain").onclick = close;
    modal.addEventListener("click", e => {
      if (e.target === modal) close();
    });
  }

  if ($("domainInfo")) {
    $("domainInfo").onclick = openDomainModal;
  }

  document.querySelectorAll(".domain-help").forEach(btn => {
    btn.onclick = openDomainModal;
  });

  /* =========================================================
     DEMONSTRAÇÃO LOCAL DO CADASTRO DE PRODUTOS
     ========================================================= */
  let demoProducts = [];
  let demoProductImage = "";

  if ($("productImage")) {
    $("productImage").onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        demoProductImage = reader.result;
      };
      reader.readAsDataURL(file);
    };
  }

  function renderDemoProducts() {
    if (!$("productDemoList")) return;

    $("productDemoList").innerHTML = demoProducts.map(p => `
      <div class="product-demo">
        ${p.image ? `<img src="${p.image}" alt="">` : ""}
        <b>${escapeHtml(p.name)}</b>
        <span>${escapeHtml(p.price)}</span>
        <small>${escapeHtml(p.description)}</small>
      </div>
    `).join("");
  }

  if ($("addProduct")) {
    $("addProduct").onclick = () => {
      const name = $("productName").value.trim();
      const price = $("productPrice").value.trim();
      const description = $("productDescription").value.trim();

      if (!name) {
        alert("Digite o nome do produto.");
        return;
      }

      if (demoProducts.length >= 5) {
        alert("Nesta demonstração você pode adicionar até 5 produtos.");
        return;
      }

      demoProducts.push({
        name,
        price,
        description,
        image: demoProductImage
      });

      $("productName").value = "";
      $("productPrice").value = "";
      $("productDescription").value = "";
      $("productImage").value = "";
      demoProductImage = "";

      renderDemoProducts();
    };
  }
});
