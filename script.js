document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const state = {
    step: 1, businessType: "", businessName: "", slogan: "", template: "modern",
    color: "#1578ff", logoMode: "text", logoData: "", imageMode: "none", photos: [],
    services: [], whatsapp: "", instagram: "", location: "", products: []
  };

  window.SITEZI_BUILDER_STATE = state;

  const steps = [...document.querySelectorAll(".step")];
  const home = $("home"), wizard = $("wizard"), result = $("result"), plans = $("plans");

  function showScreen(el) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    el.classList.add("active");
    document.body.classList.remove("wizard-open", "result-open", "plans-open");
    if (el === wizard) document.body.classList.add("wizard-open");
    if (el === result) document.body.classList.add("result-open");
    if (el === plans) document.body.classList.add("plans-open");
  }

  window.SITEZI_SHOW_SCREEN = showScreen;

  function emitBuilderState() {
    window.dispatchEvent(new CustomEvent("sitezi:builder-state", { detail: structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state)) }));
  }

  function triggerLogin(mode = "login") {
    if (typeof window.SITEZI_AUTH?.openLogin === "function") {
      window.SITEZI_AUTH.openLogin(mode);
      return;
    }

    window.dispatchEvent(new CustomEvent("sitezi:open-login", {
      detail: { mode }
    }));
  }

  $("topLogin")?.addEventListener("click", triggerLogin);
  $("wizardLogin")?.addEventListener("click", triggerLogin);

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

  const servicePlaceholders = {
    "Oficina Mecânica":"Troca de óleo, Freios, Suspensão",
    "Restaurante":"Almoço, Delivery, Reservas",
    "Barbearia":"Corte masculino, Barba, Sobrancelha",
    "Salão de Beleza":"Corte, Escova, Coloração",
    "Moda e Vestuário":"Camisetas, Calças, Acessórios",
    "Loja / Comércio":"Produtos, Entregas, Atendimento",
    "Clínica / Saúde":"Consultas, Avaliações, Procedimentos",
    "Prestador de Serviços":"Serviço 1, Serviço 2, Serviço 3",
    "Outro":"Produto ou serviço 1, Produto ou serviço 2, Produto ou serviço 3"
  };

  function updateStep() {
    steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === state.step));
    $("progressText").textContent = `${state.step} de 9`;
    $("progressBar").style.width = `${state.step / 9 * 100}%`;
    $("backBtn").style.visibility = state.step === 1 ? "hidden" : "visible";
    $("nextBtn").classList.toggle("hidden", state.step === 9);
    if (state.step === 2) {
      const p = businessPlaceholders[state.businessType] || businessPlaceholders.Outro;
      $("businessName").placeholder = p[0]; $("businessSlogan").placeholder = p[1];
    }
    if (state.step === 8) $("servicesInput").placeholder = servicePlaceholders[state.businessType] || servicePlaceholders.Outro;
    if (state.step === 9) renderReview();
    emitBuilderState();
  }

  function start(){ showScreen(wizard); updateStep(); }
  $("startBtn").onclick = start;
  $("topCreate").onclick = start;
  $("brandHome").onclick = e => { e.preventDefault(); showScreen(home); };
  $("cancelWizard").onclick = () => showScreen(home);
  $("newSite").onclick = () => location.reload();

  document.querySelectorAll(".business").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".business").forEach(x => x.classList.remove("active"));
    btn.classList.add("active"); state.businessType = btn.dataset.business;
    setTimeout(() => { state.step = 2; updateStep(); $("businessName")?.focus({preventScroll:true}); }, 120);
  });

  const fallbackSuggestions = {
    "Oficina Mecânica":["Confiança para cuidar do seu carro.","Manutenção automotiva com qualidade."],
    "Restaurante":["Sabor que dá vontade de voltar.","Uma experiência deliciosa em cada pedido."],
    "Barbearia":["Seu estilo em boas mãos.","Corte, barba e personalidade."],
    "Salão de Beleza":["Realce o melhor de você.","Beleza e cuidado em cada detalhe."],
    "Moda e Vestuário":["Vista sua melhor versão.","Moda para acompanhar o seu estilo."],
    "Loja / Comércio":["Tudo o que você procura, mais perto de você.","Produtos, novidades e bom atendimento."],
    "Clínica / Saúde":["Cuidado profissional perto de você.","Saúde e bem-estar com atenção de verdade."],
    "Prestador de Serviços":["A solução certa para o que você precisa.","Serviço profissional, direto e confiável."],
    "Outro":["Uma presença profissional para o seu negócio.","Qualidade, confiança e atendimento."]
  };

  $("suggestBrand").onclick = () => {
    if (!$("businessName").value.trim()) return alert("Digite primeiro o nome do seu negócio.");
    const o = fallbackSuggestions[state.businessType] || fallbackSuggestions.Outro;
    const pick = o[Math.floor(Math.random()*o.length)];
    $("suggestionBox").innerHTML = `<b>Sugestão:</b> ${esc(pick)}<br><button type="button" id="useSuggestion">Usar esta sugestão</button>`;
    $("suggestionBox").classList.remove("hidden");
    setTimeout(()=> $("useSuggestion")?.addEventListener("click",()=>{$("businessSlogan").value=pick;$("suggestionBox").classList.add("hidden")}),0);
  };

  document.querySelectorAll(".template-card").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".template-card").forEach(x=>x.classList.remove("active")); btn.classList.add("active"); state.template=btn.dataset.template; emitBuilderState();
  });
  document.querySelectorAll(".color").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".color").forEach(x=>x.classList.remove("active")); btn.classList.add("active"); state.color=btn.dataset.color; $("colorPreview").style.setProperty("--accent",state.color); emitBuilderState();
  });
  $("colorPreview").style.setProperty("--accent",state.color);

  document.querySelectorAll('[data-logo-mode]:not([data-logo-mode="ai"])').forEach(btn=>btn.onclick=()=> {
    document.querySelectorAll("[data-logo-mode]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); state.logoMode=btn.dataset.logoMode; emitBuilderState();
  });

  $("logoUpload").addEventListener("change", e => {
    const file=e.target.files?.[0]; if(!file)return;
    const r=new FileReader(); r.onload=()=>{state.logoData=r.result;state.logoMode="upload";$("logoPreview").innerHTML=`<img src="${r.result}" alt="Prévia da logo">`;$("logoPreview").classList.remove("hidden");emitBuilderState()}; r.readAsDataURL(file);
  });

  document.querySelectorAll('[data-image-mode]:not([data-image-mode="ai"])').forEach(btn=>btn.onclick=()=> {
    document.querySelectorAll("[data-image-mode]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); state.imageMode=btn.dataset.imageMode; emitBuilderState();
  });

  $("photoUpload").addEventListener("change", e => {
    const files=[...(e.target.files||[])].slice(0,6); if(!files.length)return;
    state.photos=[]; $("photoPreview").innerHTML="";
    files.forEach(file=>{const r=new FileReader();r.onload=()=>{state.photos.push(r.result);const img=document.createElement("img");img.src=r.result;$("photoPreview").appendChild(img);$("photoPreview").classList.remove("hidden");state.imageMode="upload";emitBuilderState()};r.readAsDataURL(file)});
  });

  let demoProductImage = "";
  $("productImage").onchange = e => {
    const file=e.target.files?.[0]; if(!file)return;
    const r=new FileReader(); r.onload=()=>demoProductImage=r.result; r.readAsDataURL(file);
  };

  function renderProducts() {
    const box=$("productDemoList"); if(!box)return;
    if(!state.products.length){box.innerHTML='<div class="sitezi-product-empty">Nenhum produto ou serviço adicionado ainda.</div>';return;}
    box.innerHTML=state.products.map((p,i)=>`<div class="sitezi-product-item">${p.image?`<img src="${p.image}" alt="">`:`<div></div>`}<div><b>${esc(p.name)}</b>${p.price?`<span>${esc(p.price)}</span>`:""}${p.description?`<small>${esc(p.description)}</small>`:""}</div><button type="button" data-remove-product="${i}">Remover</button></div>`).join("");
    box.querySelectorAll("[data-remove-product]").forEach(b=>b.onclick=()=>{state.products.splice(Number(b.dataset.removeProduct),1);renderProducts();emitBuilderState()});
  }
  renderProducts();

  $("addProduct").onclick = () => {
    const name=$("productName").value.trim(), price=$("productPrice").value.trim(), description=$("productDescription").value.trim();
    if(!name)return alert("Digite o nome do produto ou serviço.");
    state.products.push({name,price,description,image:demoProductImage});
    $("productName").value=$("productPrice").value=$("productDescription").value=""; $("productImage").value=""; demoProductImage="";
    renderProducts(); emitBuilderState();
  };

  function normalizeWhatsApp(value){let d=String(value||"").replace(/\D/g,"");if(!d)return"";if(d.startsWith("55"))return d;if(d.length===10||d.length===11)return"55"+d;return d}
  function collect(){
    state.businessName=$("businessName").value.trim();state.slogan=$("businessSlogan").value.trim();
    state.services=$("servicesInput").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    state.whatsapp=normalizeWhatsApp($("whatsapp").value);state.instagram=$("instagram").value.trim();state.location=$("location").value.trim(); emitBuilderState();
  }
  function validateStep(){
    collect();
    if(state.step===1&&!state.businessType){alert("Escolha o tipo do seu negócio.");return false}
    if(state.step===2&&!state.businessName){alert("Digite o nome do seu negócio.");return false}
    if(state.step===8){if(!state.services.length){alert("Adicione pelo menos um serviço.");return false}if(!state.whatsapp){alert("Digite seu WhatsApp.");return false}}
    return true
  }
  $("nextBtn").onclick=()=>{if(validateStep()&&state.step<9){state.step++;updateStep()}};
  $("saveNameContinue").onclick=()=>{if(state.step===2&&validateStep()){state.step=3;updateStep()}};
  $("backBtn").onclick=()=>{if(state.step>1){state.step--;updateStep()}};

  function esc(t){return String(t||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function slug(t){return String(t||"site").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"site"}

  function renderReview(){
    collect();
    const tpl={modern:"Moderno",premium:"Premium",dynamic:"Dinâmico"}[state.template];
    const logo=state.logoMode==="upload"?"Logo enviada":state.logoMode==="ai"?"Logo com IA":"Nome como marca";
    const img=state.imageMode==="upload"?`${state.photos.length} foto(s) enviada(s)`:state.imageMode==="ai"?"Gerar com IA":"Sem imagens";
    $("reviewCard").innerHTML=`<div class="review-row"><span>Negócio</span><b>${esc(state.businessType)}</b></div><div class="review-row"><span>Nome</span><b>${esc(state.businessName)}</b></div><div class="review-row"><span>Modelo</span><b>${tpl}</b></div><div class="review-row"><span>Produtos/serviços</span><b>${state.products.length}</b></div><div class="review-row"><span>Identidade</span><b>${logo}</b></div><div class="review-row"><span>Imagens</span><b>${img}</b></div><div class="review-row"><span>Serviços</span><b>${state.services.length}</b></div>`;
  }

  function siteHTML(){
    collect();
    const name=esc(state.businessName), slogan=esc(state.slogan||"Uma presença profissional para sua marca."), wa=state.whatsapp;
    const waHref=wa?`https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}`:"#";
    const logo=state.logoData?`<img style="max-height:42px;max-width:170px" src="${state.logoData}" alt="${name}">`:`<strong>${name}</strong>`;
    const heroMedia=state.photos[0]?`<img src="${state.photos[0]}" alt="" style="width:100%;height:100%;object-fit:cover">`:`<div style="height:100%;display:grid;place-items:center;background:linear-gradient(145deg,#101722,#161c24)"><b>${esc(state.businessType||"SEU NEGÓCIO")}</b></div>`;
    const productCards=state.products.map(p=>`<article style="border:1px solid #293642;border-radius:18px;padding:18px">${p.image?`<img src="${p.image}" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:12px">`:""}<h3>${esc(p.name)}</h3>${p.price?`<b>${esc(p.price)}</b>`:""}${p.description?`<p>${esc(p.description)}</p>`:""}</article>`).join("");
    const serviceCards=state.services.map(s=>`<article style="border:1px solid #293642;border-radius:18px;padding:18px"><h3>${esc(s)}</h3><p>Atendimento profissional, qualidade e atenção em cada detalhe.</p></article>`).join("");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#070b11;color:#f7fbff;font-family:Inter,Arial,sans-serif}.wrap{width:min(1140px,calc(100% - 36px));margin:auto}header{border-bottom:1px solid #202c39}.nav{height:74px;display:flex;align-items:center;justify-content:space-between}.hero{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:60px 0}.hero h1{font-size:clamp(42px,7vw,76px);line-height:.95}.media{height:390px;border-radius:28px;overflow:hidden}.cta{display:inline-flex;padding:14px 18px;background:${state.color};color:#fff;border-radius:11px;text-decoration:none;font-weight:900}.section{padding:72px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}@media(max-width:720px){.hero,.grid{grid-template-columns:1fr}.media{height:300px}}</style></head><body><header><div class="wrap nav">${logo}<span>SITEZI</span></div></header><main><section class="wrap hero"><div><small>${esc(state.businessType)}</small><h1>${slogan}</h1><p>${esc(state.location||"Atendimento na sua região")}</p><a class="cta" href="${waHref}" target="_blank">Falar no WhatsApp</a></div><div class="media">${heroMedia}</div></section>${state.products.length?`<section class="section"><div class="wrap"><h2>Produtos e destaques</h2><div class="grid">${productCards}</div></div></section>`:""}<section class="section"><div class="wrap"><h2>Serviços</h2><div class="grid">${serviceCards}</div></div></section></main></body></html>`;
  }

  $("generateSite").onclick=()=>{if(!validateStep())return;$("sitePreview").srcdoc=siteHTML();$("previewDomain").textContent=`${slug(state.businessName)}.sitezi.com.br`;showScreen(result)};
  $("editSite").onclick=()=>{showScreen(wizard);state.step=8;updateStep()};
  document.querySelectorAll(".device").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".device").forEach(x=>x.classList.remove("active"));btn.classList.add("active");$("previewStage").classList.toggle("mobile",btn.dataset.device==="mobile")});
  $("publishSite").onclick=()=>showScreen(plans); $("closePlans").onclick=()=>showScreen(result);
  document.querySelectorAll(".choose-plan").forEach(btn=>btn.onclick=()=>alert(`Plano ${btn.dataset.plan} — R$ ${btn.dataset.price}/mês\n\nO checkout conectado será aberto por sitezi-checkout-client.js.`));
  $("seeExample") && ($("seeExample").onclick=()=>location.href="modelos.html");

  const fullPreviewScreen=$("fullPreviewScreen"), fullPreviewFrame=$("fullPreviewFrame");
  function openFullPreview(){fullPreviewFrame.srcdoc=$("sitePreview").srcdoc||siteHTML();fullPreviewScreen.classList.remove("hidden");document.body.style.overflow="hidden"}
  function closeFullPreview(){fullPreviewScreen.classList.add("hidden");document.body.style.overflow=""}
  $("fullPreview") && ($("fullPreview").onclick=openFullPreview);
  $("exitFullPreview") && ($("exitFullPreview").onclick=closeFullPreview);
  $("publishFromPreview") && ($("publishFromPreview").onclick=()=>{closeFullPreview();showScreen(plans)});

  const chosenExample=new URLSearchParams(location.search).get("modelo");
  if(chosenExample){
    const map={"Barbearia":"Barbearia","Restaurante":"Restaurante","Loja de roupas":"Moda e Vestuário","Estética e salão":"Salão de Beleza","Oficina e Auto Center":"Oficina Mecânica","Profissional e Empresa":"Prestador de Serviços"};
    state.businessType=map[chosenExample]||"Outro";showScreen(wizard);state.step=2;updateStep();
    history.replaceState&&history.replaceState({},document.title,location.pathname);
  } else updateStep();
});