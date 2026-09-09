document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);

  const state = {
    step: 1,
    businessType: "",
    businessName: "",
    slogan: "",
    template: "modern",
    color: "#1578ff",
    products: [],
    whatsapp: "",
    instagram: "",
    email: "",
    location: "",
    logoMode: "text",
    logoData: "",
    aiLogoGenerated: false,
    imageMode: "none",
    photos: [],
    aiImageGenerated: false
  };

  window.SITEZI_BUILDER_STATE = state;

  const steps = [...document.querySelectorAll(".step")];
  const home = $("home");
  const wizard = $("wizard");
  const result = $("result");
  const plans = $("plans");

  /* =========================================================
     ESTILOS RUNTIME — mantém prévia e tela cheia utilizáveis
     ========================================================= */
  const runtimeStyle = document.createElement("style");
  runtimeStyle.id = "sitezi-580-runtime";
  runtimeStyle.textContent = `
    @media(max-width:850px){
      body.result-open{overflow:hidden!important}
      body.result-open .result-screen.active{height:100dvh!important;min-height:100dvh!important}
      body.result-open .result-shell{height:100dvh!important;min-height:100dvh!important;grid-template-rows:auto auto auto minmax(0,1fr) auto auto!important;overflow:auto!important}
      body.result-open .preview-stage{min-height:300px!important}
      body.result-open .result-actions{
        position:relative!important;z-index:12!important;display:grid!important;
        grid-template-columns:1fr 1fr!important;gap:8px!important;
        padding:8px 18px calc(12px + env(safe-area-inset-bottom))!important;
        background:#07101b!important;border-top:1px solid #142235!important
      }
      body.result-open #fullPreview{grid-column:1 / 3!important;order:-1!important}
    }
    .full-preview-screen{
      position:fixed!important;inset:0!important;z-index:9999!important;width:100vw!important;height:100dvh!important;
      background:#02060a!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important
    }
    .full-preview-screen.hidden{display:none!important}
    .full-preview-screen .preview-toolbar{
      margin:0!important;min-height:62px!important;border-radius:0!important;display:grid!important;
      grid-template-columns:auto 1fr auto!important;gap:12px!important;align-items:center!important;padding:10px 14px!important;background:#07101b!important
    }
    .full-preview-screen iframe{width:100%!important;height:100%!important;border:0!important;background:#fff!important;display:block!important}
    .preview-back,.preview-publish{min-height:42px!important;border-radius:11px!important;padding:9px 14px!important;font-weight:850!important;cursor:pointer!important}
    .preview-back{color:#dce8f5!important;background:#0b1725!important;border:1px solid #2c4159!important}
    .preview-publish{color:#fff!important;background:linear-gradient(135deg,#0875ff,#0752e8)!important;border:1px solid #1687ff!important}
    @media(max-width:600px){
      .full-preview-screen .preview-toolbar{grid-template-columns:1fr 1fr!important}
      .full-preview-screen .preview-toolbar span{grid-column:1/3!important;grid-row:1!important;font-size:11px!important;text-align:center}
      .full-preview-screen .preview-back{grid-column:1!important;grid-row:2!important}
      .full-preview-screen .preview-publish{grid-column:2!important;grid-row:2!important}
    }
  `;
  document.head.appendChild(runtimeStyle);

  function safeClone(obj) {
    if (typeof structuredClone === "function") {
      try { return structuredClone(obj); } catch {}
    }
    return JSON.parse(JSON.stringify(obj));
  }

  function emitBuilderState() {
    window.dispatchEvent(new CustomEvent("sitezi:builder-state", {
      detail: safeClone(state)
    }));
  }

  function showScreen(el) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    el.classList.add("active");

    document.body.classList.remove("wizard-open", "result-open", "plans-open");
    if (el === wizard) document.body.classList.add("wizard-open");
    if (el === result) document.body.classList.add("result-open");
    if (el === plans) document.body.classList.add("plans-open");
  }

  window.SITEZI_SHOW_SCREEN = showScreen;

  function triggerLogin(mode = "login") {
    if (typeof window.SITEZI_AUTH?.openLogin === "function") {
      window.SITEZI_AUTH.openLogin(mode);
      return;
    }

    window.dispatchEvent(new CustomEvent("sitezi:open-login", {
      detail: { mode }
    }));
  }

  $("topLogin")?.addEventListener("click", () => triggerLogin("login"));
  $("wizardLogin")?.addEventListener("click", () => triggerLogin("login"));

  window.addEventListener("sitezi:auth-state", e => {
    const logged = e.detail?.loggedIn ?? !!e.detail?.user;
    const label = logged ? "Minha conta" : "Fazer login";
    if ($("topLogin")) $("topLogin").textContent = label;
    if ($("wizardLogin")) $("wizardLogin").textContent = label;
  });

  const businessPlaceholders = {
    "Oficina Mecânica":["Ex.: Auto Prime","Ex.: Manutenção automotiva com confiança"],
    "Restaurante":["Ex.: Sabor da Casa","Ex.: Sabor que dá vontade de voltar"],
    "Barbearia":["Ex.: Barbearia Imperial","Ex.: Corte, barba e estilo em um só lugar"],
    "Salão de Beleza":["Ex.: Studio Bella","Ex.: Beleza e cuidado para você"],
    "Moda e Vestuário":["Ex.: Urban Style","Ex.: Moda que combina com você"],
    "Loja / Comércio":["Ex.: Loja Central","Ex.: Tudo o que você procura em um só lugar"],
    "Clínica / Saúde":["Ex.: Clínica Vida","Ex.: Cuidado e bem-estar em primeiro lugar"],
    "Prestador de Serviços":["Ex.: Prime Serviços","Ex.: Soluções profissionais para você"],
    "Outro":["Ex.: Meu Negócio","Ex.: Qualidade, confiança e bom atendimento"]
  };

  function updateStep() {
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === state.step));
    $("progressText").textContent = `${state.step} de 8`;
    $("progressBar").style.width = `${state.step / 8 * 100}%`;
    $("backBtn").style.visibility = state.step === 1 ? "hidden" : "visible";
    $("nextBtn").classList.toggle("hidden", state.step === 8);

    if (state.step === 2) {
      const p = businessPlaceholders[state.businessType] || businessPlaceholders.Outro;
      $("businessName").placeholder = p[0];
      $("businessSlogan").placeholder = p[1];
    }

    if (state.step === 8) renderReview();
    emitBuilderState();
  }

  function start() {
    showScreen(wizard);
    updateStep();
  }

  $("startBtn").onclick = start;
  $("topCreate").onclick = start;

  $("brandHome").onclick = e => {
    e.preventDefault();
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
        $("businessName")?.focus({ preventScroll: true });
      }
    }, 100);
  });

  const fallbackSuggestions = {
    "Oficina Mecânica":["Confiança para cuidar do seu carro.","Seu carro em boas mãos, todos os dias."],
    "Restaurante":["Sabor que dá vontade de voltar.","Uma experiência deliciosa em cada pedido."],
    "Barbearia":["Seu estilo em boas mãos.","Corte, barba e personalidade."],
    "Salão de Beleza":["Realce o melhor de você.","Beleza e cuidado em cada detalhe."],
    "Moda e Vestuário":["Vista sua melhor versão.","Moda para acompanhar o seu estilo."],
    "Loja / Comércio":["Tudo o que você procura, mais perto de você.","Produtos, novidades e atendimento de verdade."],
    "Clínica / Saúde":["Cuidado profissional perto de você.","Saúde e bem-estar com atenção de verdade."],
    "Prestador de Serviços":["A solução certa para o que você precisa.","Serviço profissional, direto e confiável."],
    "Outro":["Uma presença profissional para o seu negócio.","Qualidade, confiança e atendimento."]
  };

  $("suggestBrand").onclick = () => {
    const name = $("businessName").value.trim();
    if (!name) {
      alert("Digite primeiro o nome do seu negócio.");
      return;
    }

    const options = fallbackSuggestions[state.businessType] || fallbackSuggestions.Outro;
    const pick = options[Math.floor(Math.random() * options.length)];

    $("suggestionBox").innerHTML = `
      <b>Sugestão:</b> ${esc(pick)}
      <br><button type="button" id="useSuggestion">Usar esta sugestão</button>
    `;
    $("suggestionBox").classList.remove("hidden");

    setTimeout(() => {
      $("useSuggestion")?.addEventListener("click", () => {
        $("businessSlogan").value = pick;
        $("suggestionBox").classList.add("hidden");
        collect();
      });
    }, 0);
  };

  document.querySelectorAll(".template-card").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".template-card").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.template = btn.dataset.template;
    emitBuilderState();
  });

  document.querySelectorAll(".color").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".color").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.color = btn.dataset.color;
    $("colorPreview").style.setProperty("--accent", state.color);
    emitBuilderState();
  });

  $("colorPreview").style.setProperty("--accent", state.color);

  let draftProductDescription = "";

  function descriptionSuggestion(name) {
    const item = name || "este serviço";
    const byType = {
      "Oficina Mecânica": `${item} com cuidado técnico, transparência e atenção em cada detalhe.`,
      "Restaurante": `${item} preparado com qualidade para transformar cada pedido em uma experiência especial.`,
      "Barbearia": `${item} com técnica, acabamento e atenção ao seu estilo.`,
      "Salão de Beleza": `${item} pensado para valorizar sua beleza com cuidado e atendimento personalizado.`,
      "Moda e Vestuário": `${item} selecionado para unir estilo, qualidade e versatilidade no seu dia a dia.`,
      "Loja / Comércio": `${item} com qualidade, praticidade e atendimento próximo.`,
      "Clínica / Saúde": `${item} com atendimento profissional, acolhimento e atenção ao seu bem-estar.`,
      "Prestador de Serviços": `${item} realizado com agilidade, qualidade e compromisso com o resultado.`,
      "Outro": `${item} com qualidade, confiança e atendimento profissional.`
    };
    return byType[state.businessType] || byType.Outro;
  }

  $("suggestProductDescription").onclick = () => {
    const name = $("productName").value.trim();
    if (!name) {
      alert("Digite primeiro o nome do produto ou serviço.");
      return;
    }
    const suggestion = descriptionSuggestion(name);
    $("productDescription").value = suggestion;
    draftProductDescription = suggestion;
  };

  function renderProducts() {
    const box = $("productDemoList");
    if (!box) return;

    if (!state.products.length) {
      box.innerHTML = `<div class="sitezi-builder-empty">Nenhum produto ou serviço adicionado ainda.</div>`;
      return;
    }

    box.innerHTML = state.products.map((p, i) => `
      <div class="sitezi-builder-item">
        <div>
          <b>${esc(p.name)}</b>
          ${p.price ? `<span>${esc(p.price)}</span>` : ""}
          ${p.description ? `<small>${esc(p.description)}</small>` : ""}
        </div>
        <button type="button" data-remove-product="${i}">Remover</button>
      </div>
    `).join("");

    box.querySelectorAll("[data-remove-product]").forEach(btn => {
      btn.onclick = () => {
        state.products.splice(Number(btn.dataset.removeProduct), 1);
        renderProducts();
        emitBuilderState();
      };
    });
  }

  renderProducts();

  $("addProduct").onclick = () => {
    const name = $("productName").value.trim();
    const price = $("productPrice").value.trim();
    const description = $("productDescription").value.trim();

    if (!name) {
      alert("Digite o nome do produto ou serviço.");
      return;
    }

    state.products.push({
      name,
      price,
      description: description || descriptionSuggestion(name)
    });

    $("productName").value = "";
    $("productPrice").value = "";
    $("productDescription").value = "";
    draftProductDescription = "";

    renderProducts();
    emitBuilderState();
  };

  document.querySelectorAll('[data-logo-mode]:not([data-logo-mode="ai"])').forEach(btn => btn.onclick = () => {
    document.querySelectorAll("[data-logo-mode]").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.logoMode = btn.dataset.logoMode;
    state.aiLogoGenerated = false;
    emitBuilderState();
  });

  $("logoUpload").addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      state.logoData = reader.result;
      if (!state.aiLogoGenerated) state.logoMode = "upload";
      $("logoPreview").innerHTML = `<img src="${reader.result}" alt="Prévia da logo">`;
      $("logoPreview").classList.remove("hidden");
      emitBuilderState();
    };
    reader.readAsDataURL(file);
  });

  document.querySelectorAll('[data-image-mode]:not([data-image-mode="ai"])').forEach(btn => btn.onclick = () => {
    document.querySelectorAll("[data-image-mode]").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.imageMode = btn.dataset.imageMode;
    state.aiImageGenerated = false;
    emitBuilderState();
  });

  $("photoUpload").addEventListener("change", e => {
    const files = [...(e.target.files || [])].slice(0, 6);
    if (!files.length) return;

    state.photos = [];
    $("photoPreview").innerHTML = "";

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        state.photos.push(reader.result);
        const img = document.createElement("img");
        img.src = reader.result;
        $("photoPreview").appendChild(img);
        $("photoPreview").classList.remove("hidden");
        if (!state.aiImageGenerated) state.imageMode = "upload";
        emitBuilderState();
      };
      reader.readAsDataURL(file);
    });
  });

  window.addEventListener("sitezi:ai-logo-generated", e => {
    state.aiLogoGenerated = true;
    state.logoMode = "ai";
    if (e.detail?.src) state.logoData = e.detail.src;
    emitBuilderState();
  });

  window.addEventListener("sitezi:ai-image-generated", e => {
    state.aiImageGenerated = true;
    state.imageMode = "ai";
    if (e.detail?.src) state.photos = [e.detail.src, ...state.photos.filter(x => x !== e.detail.src)].slice(0, 6);
    emitBuilderState();
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
    state.whatsapp = normalizeWhatsApp($("whatsapp").value);
    state.instagram = $("instagram").value.trim();
    state.email = $("email").value.trim();
    state.location = $("location").value.trim();
    emitBuilderState();
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

    if (state.step === 5) {
      if (!state.products.length) {
        alert("Adicione pelo menos um produto ou serviço.");
        return false;
      }
      if (!state.whatsapp && !state.email) {
        alert("Informe pelo menos um WhatsApp ou e-mail para contato.");
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

  function esc(t) {
    return String(t || "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  function slug(t) {
    return String(t || "site")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "site";
  }

  function profile() {
    const map = {
      "Oficina Mecânica": {
        eyebrow:"OFICINA MECÂNICA",
        headline:"Seu carro merece cuidado de verdade.",
        about:"Atendimento automotivo com transparência, agilidade e atenção em cada detalhe.",
        icon:"⚙",
        trust:["Atendimento direto","Serviço com confiança","Agilidade no orçamento"]
      },
      "Restaurante": {
        eyebrow:"RESTAURANTE",
        headline:"Sabor que transforma qualquer momento.",
        about:"Uma experiência feita para transformar cada pedido em um momento especial.",
        icon:"◉",
        trust:["Ingredientes selecionados","Pedido fácil","Atendimento próximo"]
      },
      "Barbearia": {
        eyebrow:"BARBEARIA",
        headline:"Seu estilo começa aqui.",
        about:"Técnica, cuidado e personalidade para você sair com o visual em dia.",
        icon:"✂",
        trust:["Acabamento preciso","Atendimento personalizado","Seu estilo em primeiro lugar"]
      },
      "Salão de Beleza": {
        eyebrow:"SALÃO DE BELEZA",
        headline:"Realce o melhor de você.",
        about:"Beleza, bem-estar e atendimento personalizado em um só lugar.",
        icon:"✦",
        trust:["Cuidado personalizado","Ambiente acolhedor","Resultados que valorizam você"]
      },
      "Moda e Vestuário": {
        eyebrow:"MODA & ESTILO",
        headline:"Vista sua melhor versão.",
        about:"Peças e novidades escolhidas para acompanhar o seu estilo todos os dias.",
        icon:"◇",
        trust:["Novidades selecionadas","Atendimento fácil","Estilo para cada momento"]
      },
      "Loja / Comércio": {
        eyebrow:"LOJA & COMÉRCIO",
        headline:"Tudo o que você procura, mais perto.",
        about:"Produtos, novidades e atendimento próximo em uma experiência simples e profissional.",
        icon:"▦",
        trust:["Compra simples","Atendimento rápido","Produtos em destaque"]
      },
      "Clínica / Saúde": {
        eyebrow:"SAÚDE & BEM-ESTAR",
        headline:"Cuidado profissional perto de você.",
        about:"Atendimento humanizado e compromisso com o seu bem-estar.",
        icon:"✚",
        trust:["Atendimento humanizado","Cuidado profissional","Mais proximidade"]
      },
      "Prestador de Serviços": {
        eyebrow:"SERVIÇOS",
        headline:"A solução certa para o que você precisa.",
        about:"Serviço profissional, direto e confiável para facilitar o seu dia.",
        icon:"✓",
        trust:["Agilidade","Compromisso","Atendimento direto"]
      },
      "Outro": {
        eyebrow:"SEU NEGÓCIO",
        headline:"Uma presença profissional para sua marca.",
        about:"Uma apresentação moderna para aproximar seu negócio de novos clientes.",
        icon:"★",
        trust:["Atendimento próximo","Qualidade","Confiança"]
      }
    };
    return map[state.businessType] || map.Outro;
  }

  function renderReview() {
    collect();

    const tpl = {modern:"Moderno",premium:"Premium",dynamic:"Dinâmico"}[state.template];
    const logo = state.logoMode === "ai" ? "Logo criada com IA" : state.logoMode === "upload" ? "Logo enviada" : "Nome como marca";
    const images = state.imageMode === "ai" ? "Imagem criada com IA" : state.imageMode === "upload" ? `${state.photos.length} foto(s)` : "Visual do modelo";

    $("reviewCard").innerHTML = `
      <div class="review-row"><span>Negócio</span><b>${esc(state.businessType)}</b></div>
      <div class="review-row"><span>Nome</span><b>${esc(state.businessName)}</b></div>
      <div class="review-row"><span>Modelo</span><b>${tpl}</b></div>
      <div class="review-row"><span>Produtos/serviços</span><b>${state.products.length}</b></div>
      <div class="review-row"><span>Identidade</span><b>${logo}</b></div>
      <div class="review-row"><span>Imagens</span><b>${images}</b></div>
      <div class="review-row"><span>Contato</span><b>${state.whatsapp ? "WhatsApp" : "E-mail"}</b></div>
    `;
  }

  function siteHTML() {
    collect();

    const p = profile();
    const name = esc(state.businessName);
    const headline = esc(state.slogan || p.headline);
    const loc = esc(state.location || "Atendimento na sua região");
    const ig = esc(state.instagram.replace(/^@/, ""));
    const email = esc(state.email);
    const wa = state.whatsapp;
    const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}` : "#";

    const logo = state.logoData
      ? `<img class="brand-img" src="${state.logoData}" alt="${name}">`
      : `<strong class="site-brand">${name}</strong>`;

    const heroMedia = state.photos[0]
      ? `<img class="hero-photo" src="${state.photos[0]}" alt="${name}">`
      : `
        <div class="visual-art">
          <div class="visual-orb"></div>
          <div class="visual-card vc-a"><small>${esc(p.eyebrow)}</small><b>${esc(state.products[0]?.name || "Qualidade")}</b></div>
          <div class="visual-card vc-b"><span>${p.icon}</span><b>${name}</b><small>${loc}</small></div>
          <div class="visual-lines"></div>
        </div>
      `;

    const productCards = state.products.map((item, i) => `
      <article class="service-card">
        <div class="service-index">${String(i + 1).padStart(2, "0")}</div>
        <div class="service-icon">${p.icon}</div>
        <h3>${esc(item.name)}</h3>
        ${item.price ? `<strong class="service-price">${esc(item.price)}</strong>` : ""}
        <p>${esc(item.description || descriptionSuggestion(item.name))}</p>
      </article>
    `).join("");

    const trust = p.trust.map((t, i) => `
      <div class="trust-item"><span>${["01","02","03"][i]}</span><b>${esc(t)}</b></div>
    `).join("");

    const gallery = state.photos.length > 1
      ? `<section class="gallery wrap">${state.photos.slice(1, 4).map(x => `<img src="${x}" alt="">`).join("")}</section>`
      : "";

    const contactBits = [
      state.whatsapp ? `<span>WhatsApp disponível</span>` : "",
      ig ? `<span>@${ig}</span>` : "",
      email ? `<span>${email}</span>` : "",
      `<span>${loc}</span>`
    ].filter(Boolean).join("");

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
img{display:block}
.wrap{width:min(1160px,calc(100% - 36px));margin:auto}
.nav{height:78px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.brand-img{max-height:46px;max-width:190px;object-fit:contain}
.site-brand{font-size:22px;font-weight:950;letter-spacing:-.7px}
.links{display:flex;gap:24px;font-size:13px;font-weight:750}
.hero{display:grid;grid-template-columns:1.02fr .98fr;gap:48px;align-items:center;position:relative}
.hero-copy{position:relative;z-index:2}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:950;letter-spacing:1.8px}
.hero h1{margin:16px 0 16px;max-width:760px}
.hero p{max-width:600px;line-height:1.7}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}
.cta,.secondary{display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;font-weight:900}
.media{position:relative;overflow:hidden}
.hero-photo{width:100%;height:100%;object-fit:cover}
.visual-art{height:100%;position:relative;overflow:hidden}
.visual-orb{position:absolute;width:250px;height:250px;border-radius:50%;right:-20px;top:-10px}
.visual-card{position:absolute;padding:18px;border-radius:18px;backdrop-filter:blur(14px)}
.visual-card small,.visual-card b{display:block}
.visual-card span{font-size:34px}
.vc-a{left:8%;top:14%;width:52%}
.vc-b{right:7%;bottom:11%;width:56%}
.visual-lines{position:absolute;inset:auto 7% 7% 7%;height:38%;border-radius:20px}
.section{padding:88px 0}
.section-head{max-width:720px;margin-bottom:34px}
.section-head h2{margin:10px 0;font-size:clamp(34px,5vw,56px);line-height:1;letter-spacing:-2px}
.section-head p{line-height:1.7}
.services{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.service-card{position:relative;min-height:230px;padding:22px}
.service-index{font-size:11px;font-weight:900}
.service-icon{float:right;font-size:22px}
.service-card h3{margin:34px 0 7px;font-size:21px}
.service-price{display:block;margin-bottom:10px}
.service-card p{font-size:13px;line-height:1.6}
.trust-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:1px}
.trust-item{padding:22px;display:flex;gap:12px;align-items:center}
.trust-item span{font-size:11px}
.about-grid{display:grid;grid-template-columns:1fr .92fr;gap:44px;align-items:center}
.about-panel{padding:30px}
.about-panel h3{font-size:28px;margin:0 0 12px}
.about-panel p{line-height:1.7}
.contact-card{display:flex;justify-content:space-between;gap:26px;align-items:center;padding:34px}
.contact-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.contact-meta span{font-size:12px}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-bottom:72px}
.gallery img{width:100%;height:280px;object-fit:cover}
footer{padding:32px 0}

/* MODERNO */
body.tpl-modern{background:#070b11;color:#f7fbff}
.tpl-modern header{border-bottom:1px solid #202c39;background:rgba(7,11,17,.90);backdrop-filter:blur(16px);position:sticky;top:0;z-index:20}
.tpl-modern .links{color:#9fb0c0}
.tpl-modern .hero{min-height:620px;padding:62px 0}
.tpl-modern .hero:before{content:"";position:absolute;width:480px;height:480px;right:-180px;top:-160px;border-radius:50%;background:${state.color}22;filter:blur(80px)}
.tpl-modern .eyebrow{color:${state.color}}
.tpl-modern .hero h1{font-size:clamp(48px,7vw,82px);line-height:.94;letter-spacing:-4px}
.tpl-modern .hero p{color:#a8b5c2;font-size:17px}
.tpl-modern .cta{background:${state.color};color:white;border-radius:12px;box-shadow:0 14px 35px ${state.color}33}
.tpl-modern .secondary{border:1px solid #304154;border-radius:12px;color:#dbe5ee}
.tpl-modern .media{height:440px;border-radius:30px;border:1px solid #2b3846;background:#101720;box-shadow:0 28px 75px rgba(0,0,0,.35)}
.tpl-modern .visual-art{background:radial-gradient(circle at 72% 22%,${state.color}44,transparent 30%),linear-gradient(145deg,#101722,#111923)}
.tpl-modern .visual-orb{background:${state.color}22;box-shadow:0 0 80px ${state.color}44}
.tpl-modern .visual-card{border:1px solid #324356;background:rgba(9,16,25,.78)}
.tpl-modern .visual-card small{color:#7f93a8}.tpl-modern .visual-card b{margin-top:7px}
.tpl-modern .visual-lines{border:1px solid #273747;background:linear-gradient(90deg,${state.color}22,transparent)}
.tpl-modern .section.alt{background:#0e141b}
.tpl-modern .section-head p{color:#98a7b7}
.tpl-modern .service-card{border:1px solid #293642;border-radius:20px;background:#0b1016}
.tpl-modern .service-index{color:#66798d}.tpl-modern .service-icon{color:${state.color}}.tpl-modern .service-price{color:${state.color}}.tpl-modern .service-card p{color:#8d9bac}
.tpl-modern .trust-strip{border:1px solid #263543;border-radius:18px;overflow:hidden}.tpl-modern .trust-item{background:#0b1118}.tpl-modern .trust-item span{color:${state.color}}
.tpl-modern .about-panel{border:1px solid #2b3845;border-radius:24px;background:#0d131a}
.tpl-modern .about-panel p{color:#99a8b8}
.tpl-modern .contact-card{border:1px solid #2b3845;border-radius:26px;background:linear-gradient(135deg,#101820,#0b1117)}
.tpl-modern .contact-meta{color:#93a1b0}
.tpl-modern footer{color:#718091;border-top:1px solid #242e38}

/* PREMIUM */
body.tpl-premium{background:#f5f0e8;color:#191714;font-family:Georgia,"Times New Roman",serif}
.tpl-premium header{background:#f5f0e8;border-bottom:1px solid #d8cbb9}
.tpl-premium .nav{height:88px}
.tpl-premium .site-brand{font-size:25px}
.tpl-premium .links{color:#6e6254;font-family:Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.7px;font-size:11px}
.tpl-premium .hero{min-height:700px;padding:78px 0}
.tpl-premium .eyebrow{color:${state.color};font-family:Inter,Arial,sans-serif}
.tpl-premium .hero h1{font-size:clamp(52px,7vw,90px);line-height:.92;letter-spacing:-3px;font-weight:500}
.tpl-premium .hero p{color:#72685c;font-size:18px}
.tpl-premium .cta{background:#191714;color:#fff;border-radius:0;font-family:Inter,Arial,sans-serif}
.tpl-premium .secondary{border-bottom:1px solid #191714;padding-left:2px;padding-right:2px;font-family:Inter,Arial,sans-serif}
.tpl-premium .media{height:520px;border-radius:230px 230px 28px 28px;border:1px solid #c9bba7;background:#dfd2bf;box-shadow:0 28px 60px rgba(76,59,39,.18)}
.tpl-premium .visual-art{background:radial-gradient(circle at 50% 26%,rgba(255,255,255,.85),transparent 26%),linear-gradient(145deg,#e9dece,#cbbba5)}
.tpl-premium .visual-orb{background:rgba(255,255,255,.35)}
.tpl-premium .visual-card{border:1px solid rgba(93,72,48,.25);background:rgba(245,240,232,.72)}
.tpl-premium .visual-card small{color:#887a68}
.tpl-premium .visual-lines{border:1px solid rgba(93,72,48,.18);background:rgba(255,255,255,.20)}
.tpl-premium .section{padding:100px 0}
.tpl-premium .section.alt{background:#eae1d5}
.tpl-premium .section-head h2{font-weight:500}
.tpl-premium .section-head p{color:#776d61}
.tpl-premium .services{gap:24px}
.tpl-premium .service-card{border-top:1px solid #bfb19e;padding:26px 4px 18px}
.tpl-premium .service-index{color:#9b8b76;font-family:Inter,Arial,sans-serif}.tpl-premium .service-icon{color:${state.color}}.tpl-premium .service-price{color:#4e4439}
.tpl-premium .service-card p{color:#756b60}
.tpl-premium .trust-strip{border-top:1px solid #c7b8a5;border-bottom:1px solid #c7b8a5}.tpl-premium .trust-item span{color:${state.color};font-family:Inter,Arial,sans-serif}
.tpl-premium .about-panel{border:1px solid #cdbfaa;background:#efe7dc}.tpl-premium .about-panel p{color:#776d61}
.tpl-premium .contact-card{border:1px solid #c8b9a5;background:#f5f0e8}.tpl-premium .contact-meta{color:#766b5f;font-family:Inter,Arial,sans-serif}
.tpl-premium .gallery{gap:18px}.tpl-premium .gallery img{height:320px}
.tpl-premium footer{color:#85786a;border-top:1px solid #d1c5b6;font-family:Inter,Arial,sans-serif;font-size:12px}

/* DINÂMICO */
body.tpl-dynamic{background:#101014;color:#fff}
.tpl-dynamic header{background:${state.color};color:#fff}
.tpl-dynamic .links{color:#fff;font-weight:850}
.tpl-dynamic .hero{width:min(1200px,calc(100% - 24px));min-height:600px;padding:54px 46px;margin:18px auto 0;border-radius:36px;background:linear-gradient(130deg,${state.color},${state.color}c8 48%,#17171d 48.2%)}
.tpl-dynamic .eyebrow{color:#fff;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.28);padding:7px 10px;border-radius:999px}
.tpl-dynamic .hero h1{font-size:clamp(46px,7vw,80px);line-height:.91;letter-spacing:-4px;text-transform:uppercase}
.tpl-dynamic .hero p{color:rgba(255,255,255,.88);font-size:17px}
.tpl-dynamic .cta{background:#fff;color:#111;border-radius:999px}
.tpl-dynamic .secondary{border:1px solid rgba(255,255,255,.65);color:#fff;border-radius:999px}
.tpl-dynamic .media{height:410px;border:8px solid #fff;border-radius:28px;transform:rotate(2deg);background:#17171d;box-shadow:0 26px 60px rgba(0,0,0,.3)}
.tpl-dynamic .visual-art{background:radial-gradient(circle at 65% 30%,${state.color}88,transparent 30%),linear-gradient(145deg,#1b1b21,#0c0c10)}
.tpl-dynamic .visual-orb{background:#ffffff20}.tpl-dynamic .visual-card{border:1px solid rgba(255,255,255,.22);background:rgba(15,15,18,.76)}.tpl-dynamic .visual-lines{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06)}
.tpl-dynamic .section.alt{background:#18181e}
.tpl-dynamic .section-head h2{text-transform:uppercase}.tpl-dynamic .section-head p{color:#aaaab5}
.tpl-dynamic .services{gap:12px}
.tpl-dynamic .service-card{border-radius:22px;background:#222229;box-shadow:inset 0 5px 0 ${state.color}}
.tpl-dynamic .service-card:nth-child(even){background:${state.color}}
.tpl-dynamic .service-index{color:#9696a3}.tpl-dynamic .service-card:nth-child(even) .service-index,.tpl-dynamic .service-card:nth-child(even) p{color:rgba(255,255,255,.82)}
.tpl-dynamic .service-price{color:#fff}.tpl-dynamic .service-card p{color:#a4a4af}
.tpl-dynamic .trust-strip{border-radius:22px;overflow:hidden}.tpl-dynamic .trust-item{background:#1d1d23}.tpl-dynamic .trust-item:nth-child(2){background:${state.color}}.tpl-dynamic .trust-item span{color:#fff}
.tpl-dynamic .about-panel{border-radius:26px;background:${state.color}}.tpl-dynamic .about-panel p{color:rgba(255,255,255,.86)}
.tpl-dynamic .contact-card{border-radius:30px;background:${state.color}}.tpl-dynamic .contact-card .cta{background:#fff;color:#111}.tpl-dynamic .contact-meta{color:#d6d6df}
.tpl-dynamic .gallery img{border-radius:20px}
.tpl-dynamic footer{color:#85858e;border-top:1px solid #2c2c33}

@media(max-width:760px){
  .links{display:none}
  .hero,.about-grid{grid-template-columns:1fr!important}
  .services,.trust-strip{grid-template-columns:1fr}
  .hero{min-height:auto!important}
  .tpl-modern .hero{padding:46px 0}.tpl-modern .hero h1{font-size:50px}.tpl-modern .media{height:330px}
  .tpl-premium .hero{padding:50px 0 60px}.tpl-premium .hero h1{font-size:52px}.tpl-premium .media{height:380px;border-radius:170px 170px 20px 20px}
  .tpl-dynamic .hero{width:calc(100% - 20px);padding:38px 20px;background:linear-gradient(160deg,${state.color},${state.color}df 54%,#17171d 54.2%)}.tpl-dynamic .hero h1{font-size:46px}.tpl-dynamic .media{height:310px;transform:none}
  .section{padding:66px 0!important}
  .contact-card{align-items:flex-start;flex-direction:column}
  .gallery{grid-template-columns:1fr}.gallery img{height:240px!important}
}
</style>
</head>
<body class="tpl-${state.template}">
<header>
  <div class="wrap nav">
    ${logo}
    <nav class="links"><a href="#destaques">Destaques</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>
  </div>
</header>

<main>
  <section class="wrap hero">
    <div class="hero-copy">
      <span class="eyebrow">${esc(p.eyebrow)}</span>
      <h1>${headline}</h1>
      <p>${esc(p.about)}</p>
      <div class="actions">
        ${wa ? `<a class="cta" href="${waHref}" target="_blank">Falar no WhatsApp →</a>` : email ? `<a class="cta" href="mailto:${email}">Entrar em contato →</a>` : ""}
        <a class="secondary" href="#destaques">Conhecer mais</a>
      </div>
    </div>
    <div class="media">${heroMedia}</div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="trust-strip">${trust}</div>
    </div>
  </section>

  <section id="destaques" class="section alt">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow">O QUE VOCÊ ENCONTRA AQUI</span>
        <h2>Destaques do nosso negócio.</h2>
        <p>Conheça algumas das principais opções da ${name}.</p>
      </div>
      <div class="services">${productCards}</div>
    </div>
  </section>

  <section id="sobre" class="section">
    <div class="wrap about-grid">
      <div>
        <span class="eyebrow">SOBRE A MARCA</span>
        <div class="section-head">
          <h2>Uma experiência feita para aproximar você do que precisa.</h2>
          <p>${esc(state.slogan || p.about)}</p>
        </div>
      </div>
      <div class="about-panel">
        <h3>${name}</h3>
        <p>${loc}</p>
        <p>Atendimento próximo, apresentação profissional e informações claras para facilitar o primeiro contato.</p>
      </div>
    </div>
  </section>

  ${gallery}

  <section id="contato" class="section alt">
    <div class="wrap contact-card">
      <div>
        <span class="eyebrow">FALE CONOSCO</span>
        <h2>Vamos conversar?</h2>
        <div class="contact-meta">${contactBits}</div>
      </div>
      ${wa ? `<a class="cta" href="${waHref}" target="_blank">Chamar no WhatsApp →</a>` : email ? `<a class="cta" href="mailto:${email}">Enviar e-mail →</a>` : ""}
    </div>
  </section>
</main>

<footer><div class="wrap">${name} • Site criado com SITEZI.</div></footer>
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
    state.step = 5;
    updateStep();
  };

  document.querySelectorAll(".device").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".device").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    $("previewStage").classList.toggle("mobile", btn.dataset.device === "mobile");
  });

  $("publishSite").onclick = () => showScreen(plans);
  $("upgradeWithAI").onclick = () => showScreen(plans);
  $("closePlans").onclick = () => showScreen(result);

  document.querySelectorAll(".choose-plan").forEach(btn => btn.onclick = () => {
    alert(
      `Plano ${btn.dataset.plan} — R$ ${btn.dataset.price}/mês\n\n` +
      "O checkout conectado será aberto pelo sitezi-checkout-client.js."
    );
  });

  if ($("seeExample")) {
    $("seeExample").onclick = () => {
      window.location.href = "modelos.html";
    };
  }

  const chosenExample = new URLSearchParams(window.location.search).get("modelo");
  if (chosenExample) {
    const map = {
      "Barbearia":"Barbearia",
      "Restaurante":"Restaurante",
      "Loja de roupas":"Moda e Vestuário",
      "Estética e salão":"Salão de Beleza",
      "Oficina e Auto Center":"Oficina Mecânica",
      "Profissional e Empresa":"Prestador de Serviços"
    };

    state.businessType = map[chosenExample] || "Outro";
    document.querySelectorAll(".business").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.business === state.businessType);
    });

    showScreen(wizard);
    state.step = 2;
    updateStep();

    if (window.history?.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    requestAnimationFrame(() => $("businessName")?.focus({ preventScroll: true }));
  } else {
    updateStep();
  }

  const fullPreviewScreen = $("fullPreviewScreen");
  const fullPreviewFrame = $("fullPreviewFrame");

  function openFullPreview() {
    fullPreviewFrame.srcdoc = $("sitePreview").srcdoc || siteHTML();
    fullPreviewScreen.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeFullPreview() {
    fullPreviewScreen.classList.add("hidden");
    document.body.style.overflow = "";
  }

  $("fullPreview") && ($("fullPreview").onclick = openFullPreview);
  $("exitFullPreview") && ($("exitFullPreview").onclick = closeFullPreview);
  $("publishFromPreview") && ($("publishFromPreview").onclick = () => {
    closeFullPreview();
    showScreen(plans);
  });
});