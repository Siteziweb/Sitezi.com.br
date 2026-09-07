document.addEventListener("DOMContentLoaded",()=>{
  const $=id=>document.getElementById(id);
  const state={
    step:1,businessType:"",businessName:"",slogan:"",template:"modern",color:"#1578ff",
    logoMode:"text",logoData:"",imageMode:"none",photos:[],services:[],whatsapp:"",instagram:"",location:""
  };
  const steps=[...document.querySelectorAll(".step")];
  const home=$("home"),wizard=$("wizard"),result=$("result");

  function showScreen(el){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    el.classList.add("active");
  }
  function resetScroll(){
    const active=document.querySelector(".step.active");
    if(active) active.scrollTop=0;
  }
  function updateStep(){
    steps.forEach(s=>s.classList.toggle("active",Number(s.dataset.step)===state.step));
    $("progressText").textContent=`${state.step} de 8`;
    $("progressBar").style.width=`${state.step/8*100}%`;
    $("backBtn").style.visibility=state.step===1?"hidden":"visible";
    $("nextBtn").classList.toggle("hidden",state.step===8);
    if(state.step===2){
      $("nextBtn").textContent="Salvar e continuar →";
    }else if(state.step<8){
      $("nextBtn").textContent="Continuar →";
    }
    if(state.step===8) renderReview();
    resetScroll();
  }
  function start(){showScreen(wizard);updateStep()}
  $("startBtn").onclick=start;$("topCreate").onclick=start;
  $("brandHome").onclick=e=>{e.preventDefault();showScreen(home)};
  $("cancelWizard").onclick=()=>showScreen(home);
  $("newSite").onclick=()=>location.reload();

  document.querySelectorAll(".business").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".business").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    state.businessType=btn.dataset.business;
    // A escolha do negócio já abre a próxima etapa, como um app.
    setTimeout(()=>{
      if(state.step===1){
        state.step=2;
        updateStep();
        requestAnimationFrame(()=>document.getElementById("businessName")?.focus({preventScroll:true}));
      }
    },120);
  });

  const fallbackSuggestions={
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

  $("suggestBrand").onclick=async()=>{
    const name=$("businessName").value.trim();
    if(!name){alert("Digite primeiro o nome do seu negócio.");return}
    // Backend-ready. Until configured, use local smart fallback.
    const options=fallbackSuggestions[state.businessType]||fallbackSuggestions.Outro;
    const pick=options[Math.floor(Math.random()*options.length)];
    $("suggestionBox").innerHTML=`<b>Sugestão:</b> ${pick}<br><button type="button" id="useSuggestion">Usar esta sugestão</button>`;
    $("suggestionBox").classList.remove("hidden");
    setTimeout(()=>{$("useSuggestion")?.addEventListener("click",()=>{$("businessSlogan").value=pick;$("suggestionBox").classList.add("hidden")})},0);
  };

  document.querySelectorAll(".template-card").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".template-card").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");state.template=btn.dataset.template;
  });

  document.querySelectorAll(".color").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".color").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");state.color=btn.dataset.color;
    $("colorPreview").style.setProperty("--accent",state.color);
  });
  $("colorPreview").style.setProperty("--accent",state.color);

  document.querySelectorAll("[data-logo-mode]").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll("[data-logo-mode]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");state.logoMode=btn.dataset.logoMode;
    if(state.logoMode==="ai"){
      alert("A geração de logo com IA será ativada assim que conectarmos o backend.");
    }
  });
  $("logoUpload").addEventListener("change",e=>{
    const file=e.target.files?.[0];if(!file)return;
    const r=new FileReader();r.onload=()=>{state.logoData=r.result;state.logoMode="upload";$("logoPreview").innerHTML=`<img src="${r.result}" alt="Prévia da logo">`;$("logoPreview").classList.remove("hidden")};r.readAsDataURL(file);
  });

  document.querySelectorAll("[data-image-mode]").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll("[data-image-mode]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");state.imageMode=btn.dataset.imageMode;
    if(state.imageMode==="ai"){
      alert("A geração de imagens com IA será ativada quando conectarmos o backend.");
    }
  });
  $("photoUpload").addEventListener("change",e=>{
    const files=[...(e.target.files||[])].slice(0,6);if(!files.length)return;
    state.photos=[];$("photoPreview").innerHTML="";
    files.forEach(file=>{const r=new FileReader();r.onload=()=>{state.photos.push(r.result);const img=document.createElement("img");img.src=r.result;$("photoPreview").appendChild(img);$("photoPreview").classList.remove("hidden");state.imageMode="upload"};r.readAsDataURL(file)});
  });

  function normalizeWhatsApp(value){
    let d=String(value||"").replace(/\D/g,"");
    if(!d)return"";
    if(d.startsWith("55"))return d;
    if(d.length===10||d.length===11)return"55"+d;
    return d;
  }
  function collect(){
    state.businessName=$("businessName").value.trim();
    state.slogan=$("businessSlogan").value.trim();
    state.services=$("servicesInput").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    state.whatsapp=normalizeWhatsApp($("whatsapp").value);
    state.instagram=$("instagram").value.trim();
    state.location=$("location").value.trim();
  }
  function validateStep(){
    collect();
    if(state.step===1&&!state.businessType){alert("Escolha o tipo do seu negócio.");return false}
    if(state.step===2&&!state.businessName){alert("Digite o nome do seu negócio.");return false}
    if(state.step===7){
      if(!state.services.length){alert("Adicione pelo menos um serviço.");return false}
      if(!state.whatsapp){alert("Digite seu WhatsApp.");return false}
    }
    return true;
  }
  $("nextBtn").onclick=()=>{if(validateStep()&&state.step<8){state.step++;updateStep()}};
  $("backBtn").onclick=()=>{if(state.step>1){state.step--;updateStep()}};

  function renderReview(){
    collect();
    const tpl={modern:"Moderno",premium:"Premium",dynamic:"Dinâmico"}[state.template];
    const logo=state.logoMode==="upload"?"Logo enviada":state.logoMode==="ai"?"Logo com IA":"Nome como marca";
    const img=state.imageMode==="upload"?`${state.photos.length} foto(s) enviada(s)`:state.imageMode==="ai"?"Gerar com IA":"Sem imagens";
    $("reviewCard").innerHTML=`
      <div class="review-row"><span>Negócio</span><b>${esc(state.businessType)}</b></div>
      <div class="review-row"><span>Nome</span><b>${esc(state.businessName)}</b></div>
      <div class="review-row"><span>Modelo</span><b>${tpl}</b></div>
      <div class="review-row"><span>Identidade</span><b>${logo}</b></div>
      <div class="review-row"><span>Imagens</span><b>${img}</b></div>
      <div class="review-row"><span>Serviços</span><b>${state.services.length}</b></div>`;
  }
  function esc(t){return String(t||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function slug(t){return String(t||"site").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"site"}

  function siteHTML(){
    collect();
    const profiles={
      "Oficina Mecânica":{k:"OFICINA MECÂNICA",h:"Seu carro em boas mãos.",about:"Cuidado automotivo com transparência, agilidade e atenção em cada detalhe.",symbol:"⚙"},
      "Restaurante":{k:"RESTAURANTE",h:"Sabor que dá vontade de voltar.",about:"Uma experiência feita para transformar cada pedido em um momento especial.",symbol:"◉"},
      "Barbearia":{k:"BARBEARIA",h:"Seu estilo começa aqui.",about:"Técnica, cuidado e personalidade para você sair com o visual em dia.",symbol:"✂"},
      "Salão de Beleza":{k:"SALÃO DE BELEZA",h:"Realce o melhor de você.",about:"Beleza, bem-estar e atendimento personalizado em um só lugar.",symbol:"✦"},
      "Moda e Vestuário":{k:"MODA E VESTUÁRIO",h:"Vista sua melhor versão.",about:"Coleções, novidades e peças escolhidas para acompanhar o seu estilo.",symbol:"◇"},
      "Loja / Comércio":{k:"LOJA & COMÉRCIO",h:"Tudo o que você procura, mais perto.",about:"Produtos, novidades e atendimento próximo em uma experiência simples e profissional.",symbol:"▦"},
      "Clínica / Saúde":{k:"SAÚDE & BEM-ESTAR",h:"Cuidado profissional perto de você.",about:"Atendimento humanizado e compromisso com o seu bem-estar.",symbol:"✚"},
      "Prestador de Serviços":{k:"SERVIÇOS",h:"A solução certa para o que você precisa.",about:"Serviço profissional, direto e confiável para facilitar o seu dia.",symbol:"✓"},
      "Outro":{k:"SEU NEGÓCIO",h:"Uma presença profissional para sua marca.",about:"Um site moderno para aproximar seu negócio de novos clientes.",symbol:"★"}
    };
    const p=profiles[state.businessType]||profiles.Outro;
    const name=esc(state.businessName), slogan=esc(state.slogan||p.h), loc=esc(state.location||"Atendimento na sua região");
    const ig=esc(state.instagram.replace(/^@/,""));
    const wa=state.whatsapp;
    const waHref=wa?`https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}`:"#";
    const logo=state.logoData?`<img class="brand-img" src="${state.logoData}" alt="${name}">`:`<strong class="site-brand">${name}</strong>`;
    const photos=state.photos.length?state.photos:``;
    const heroMedia=state.photos[0]?`<img src="${state.photos[0]}" alt="">`:`<div class="generated-visual"><span>${p.symbol}</span><b>${p.k}</b></div>`;
    const cards=state.services.map((s,i)=>`<article><span>0${i+1}</span><i>${p.symbol}</i><h3>${esc(s)}</h3><p>Atendimento profissional, qualidade e atenção em cada detalhe.</p></article>`).join("");
    const gallery=state.photos.length>1?`<section class="wrap gallery">${state.photos.slice(1,4).map(x=>`<img src="${x}" alt="">`).join("")}</section>`:"";
    const templateClass=`tpl-${state.template}`;
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#090d12;color:#f8fbff;font-family:Inter,Arial,sans-serif}a{text-decoration:none;color:inherit}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.nav{height:70px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #26303b}.brand-img{max-height:38px;max-width:160px}.site-brand{font-size:18px}.links{display:flex;gap:18px;color:#aab5c0;font-size:12px}.hero{min-height:560px;display:grid;grid-template-columns:1.05fr .95fr;gap:38px;align-items:center;padding:48px 0}.k{color:${state.color};font-size:11px;font-weight:900;letter-spacing:1.5px}.hero h1{font-size:clamp(44px,7vw,76px);line-height:.96;letter-spacing:-3px;margin:14px 0}.hero p{color:#a7b4c1;line-height:1.6;max-width:600px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.cta,.secondary{display:inline-flex;padding:13px 16px;border-radius:10px;font-weight:900}.cta{background:${state.color};color:white}.secondary{border:1px solid #2c3948}.media{height:390px;border-radius:26px;overflow:hidden;border:1px solid #2b3541;background:#10161e}.media img{width:100%;height:100%;object-fit:cover}.generated-visual{height:100%;display:grid;place-items:center;align-content:center;background:radial-gradient(circle at 65% 30%,${state.color}55,transparent 27%),linear-gradient(145deg,#101722,#171c22)}.generated-visual span{font-size:70px;color:${state.color}}.generated-visual b{font-size:13px;letter-spacing:3px;margin-top:12px}.section{padding:72px 0}.section.alt{background:#11161d}.section h2{font-size:38px;margin:8px 0}.lead{color:#9eabb8}.services{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:27px}.services article{border:1px solid #2a3440;border-radius:18px;padding:20px;background:#0d1218;min-height:190px}.services span{color:#6f7c8b;font-size:11px}.services i{float:right;color:${state.color};font-style:normal}.services h3{margin-top:28px}.services p{color:#8d9aaa;font-size:13px;line-height:1.5}.about{display:grid;grid-template-columns:1fr 1fr;gap:34px;align-items:center}.about-box{border:1px solid #2b3541;border-radius:22px;padding:25px;background:#0d1218}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-bottom:72px}.gallery img{width:100%;height:240px;object-fit:cover;border-radius:18px}.contact{border:1px solid #2b3541;border-radius:24px;background:linear-gradient(135deg,#10161e,#0e1319);padding:26px;display:flex;justify-content:space-between;gap:20px;align-items:center}.contact p{color:#95a2b0}.meta{display:flex;gap:14px;flex-wrap:wrap;color:#a7b3bf;font-size:12px;margin-top:12px}.tpl-premium .hero{grid-template-columns:.9fr 1.1fr}.tpl-premium .hero h1{font-family:Georgia,serif;letter-spacing:-2px}.tpl-premium .media{border-radius:120px 20px 120px 20px}.tpl-dynamic .hero{background:linear-gradient(125deg,${state.color}22,transparent 45%);padding-left:20px;padding-right:20px;border-radius:28px;margin-top:18px}.tpl-dynamic .services article{box-shadow:inset 0 3px 0 ${state.color}}footer{padding:30px 0;color:#758394;border-top:1px solid #242d37}
      @media(max-width:720px){.links{display:none}.hero,.about{grid-template-columns:1fr}.hero{min-height:auto;padding:45px 0}.hero h1{font-size:48px}.media{height:310px}.services{grid-template-columns:1fr}.gallery{grid-template-columns:1fr}.gallery img{height:220px}.contact{align-items:flex-start;flex-direction:column}.tpl-premium .hero{grid-template-columns:1fr}.tpl-premium .media{border-radius:24px}}
    </style></head><body class="${templateClass}">
      <header><div class="wrap nav">${logo}<nav class="links"><a href="#servicos">Serviços</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav></div></header>
      <main><section class="wrap hero"><div><span class="k">${p.k}</span><h1>${slogan}</h1><p>${esc(p.about)}</p><div class="actions"><a class="cta" href="${waHref}" target="_blank">Falar no WhatsApp</a><a class="secondary" href="#servicos">Ver serviços</a></div></div><div class="media">${heroMedia}</div></section>
      <section id="servicos" class="section alt"><div class="wrap"><span class="k">O QUE FAZEMOS</span><h2>Serviços para você.</h2><p class="lead">Conheça algumas das soluções oferecidas pela ${name}.</p><div class="services">${cards}</div></div></section>
      <section id="sobre" class="section"><div class="wrap about"><div><span class="k">SOBRE NÓS</span><h2>Confiança do primeiro contato ao resultado.</h2><p class="lead">${esc(state.slogan||p.about)}</p></div><div class="about-box"><b>${name}</b><p>${loc}</p><div class="meta">${ig?`<span>Instagram: @${ig}</span>`:""}<span>Atendimento direto</span><span>Qualidade e confiança</span></div></div></div></section>
      ${gallery}
      <section id="contato" class="section alt"><div class="wrap contact"><div><span class="k">FALE CONOSCO</span><h2>Vamos conversar?</h2><p>${loc}</p></div><a class="cta" href="${waHref}" target="_blank">Chamar no WhatsApp →</a></div></section></main>
      <footer><div class="wrap">${name} • Site criado com SITEZI.</div></footer>
    </body></html>`;
  }

  $("generateSite").onclick=()=>{
    if(!validateStep())return;
    $("sitePreview").srcdoc=siteHTML();
    $("previewDomain").textContent=`${slug(state.businessName)}.sitezi.com.br`;
    showScreen(result);
  };
  $("editSite").onclick=()=>{showScreen(wizard);state.step=7;updateStep()};
  document.querySelectorAll(".device").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".device").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    $("previewStage").classList.toggle("mobile",btn.dataset.device==="mobile");
  });
  $("publishSite").onclick=()=>{
    $("publishMessage").innerHTML="<b>Backend ainda não conectado.</b><br>O próximo passo é ligar esta V5 ao Supabase para salvar projetos, gerar IA e publicar sites.";
    $("publishMessage").classList.remove("hidden");
  };
  $("seeExample").onclick=()=>{alert("Na próxima etapa podemos adicionar uma galeria de exemplos reais da SITEZI.")};
  updateStep();
});