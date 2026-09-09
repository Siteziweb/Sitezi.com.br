/* =========================================================
   SITEZI — MOTOR DE QUALIDADE v2.0
   Famílias reais de design + variações por negócio + planos.
   Não gera imagens e não consome créditos.
   ========================================================= */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  let account={active:false,plan:"Básico"};
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  const tier=plan=>/premium/i.test(plan||"")?"premium":/profissional/i.test(plan||"")?"professional":"basic";

  const PROFILE={
    electrical:{eyebrow:"SERVIÇOS ELÉTRICOS",headline:"Segurança e precisão em cada instalação.",intro:"Instalações, manutenção e soluções elétricas com atendimento direto e profissional.",icon:"⚡",cta:"Solicitar orçamento",trust:["Atendimento direto","Serviço organizado","Residencial e comercial","Contato rápido"]},
    auto:{eyebrow:"OFICINA & AUTO CENTER",headline:"Seu carro em boas mãos.",intro:"Manutenção automotiva com transparência, cuidado técnico e atendimento simples.",icon:"⚙",cta:"Pedir orçamento",trust:["Orçamento claro","Cuidado técnico","Atendimento profissional","Contato rápido"]},
    restaurant:{eyebrow:"RESTAURANTE",headline:"Sabor que dá vontade de voltar.",intro:"Conheça os destaques da casa e faça seu pedido de um jeito rápido.",icon:"◉",cta:"Fazer pedido",trust:["Pratos em destaque","Ingredientes selecionados","Pedido fácil","Atendimento próximo"]},
    barber:{eyebrow:"BARBEARIA",headline:"Seu estilo começa aqui.",intro:"Corte, barba e cuidado pessoal com atendimento próximo e acabamento profissional.",icon:"✂",cta:"Agendar horário",trust:["Atendimento personalizado","Acabamento preciso","Agendamento fácil","Seu estilo em primeiro lugar"]},
    beauty:{eyebrow:"BELEZA & CUIDADO",headline:"Realce o melhor de você.",intro:"Serviços de beleza apresentados com cuidado, leveza e uma experiência fácil para agendar.",icon:"✦",cta:"Agendar horário",trust:["Cuidado personalizado","Ambiente acolhedor","Serviços em destaque","Contato rápido"]},
    fashion:{eyebrow:"MODA & ESTILO",headline:"Moda que combina com você.",intro:"Uma vitrine digital moderna para apresentar peças, novidades e facilitar o contato.",icon:"◇",cta:"Ver novidades",trust:["Produtos em destaque","Novidades selecionadas","Visual profissional","Contato fácil"]},
    health:{eyebrow:"SAÚDE & BEM-ESTAR",headline:"Cuidado profissional perto de você.",intro:"Uma presença digital clara e acolhedora para apresentar serviços e facilitar o primeiro contato.",icon:"✚",cta:"Agendar atendimento",trust:["Atendimento humanizado","Informações claras","Contato fácil","Presença profissional"]},
    retail:{eyebrow:"LOJA & COMÉRCIO",headline:"Produtos que merecem destaque.",intro:"Uma vitrine organizada para apresentar produtos, preços e facilitar a compra ou o contato.",icon:"▦",cta:"Falar com a loja",trust:["Vitrine organizada","Produtos em destaque","Contato rápido","Atendimento próximo"]},
    service:{eyebrow:"SERVIÇOS PROFISSIONAIS",headline:"Uma presença profissional para o seu trabalho.",intro:"Mostre o que você faz, como atende e facilite o contato de novos clientes.",icon:"✓",cta:"Solicitar atendimento",trust:["Atendimento direto","Informações claras","Serviços organizados","Contato rápido"]}
  };
  function context(s){
    const all=[s.businessType,s.businessName,...(Array.isArray(s.products)?s.products.flatMap(p=>[p.name,p.description]):[])].join(" ").toLowerCase();
    if(/elétr|eletr|fiação|fiacao|disjunt|quadro de luz|energia/.test(all))return"electrical";
    if(/oficina|mecân|mecan|automot/.test(all))return"auto";
    if(/restaurante|pizza|hamb|comida|cafeteria|delivery/.test(all))return"restaurant";
    if(/barbear|barber/.test(all))return"barber";
    if(/salão|salao|beleza|estética|estetica|manicure/.test(all))return"beauty";
    if(/moda|vestuário|vestuario|roupa|calçado|calcado/.test(all))return"fashion";
    if(/clínica|clinica|saúde|saude|dent|fisi|psic/.test(all))return"health";
    if(/loja|comércio|comercio|varejo/.test(all))return"retail";
    return"service";
  }

  const PRESET={
    "barber-signature":{family:"barber",theme:"dark-gold",font:"Georgia,serif",layout:"split",shape:"sharp"},
    "restaurant-flavor":{family:"restaurant",theme:"warm",font:"Georgia,serif",layout:"immersive",shape:"round"},
    "fashion-urban":{family:"fashion",theme:"editorial",font:"Arial,sans-serif",layout:"editorial",shape:"square"},
    "beauty-essence":{family:"beauty",theme:"soft",font:"Georgia,serif",layout:"soft",shape:"round"},
    "auto-drive":{family:"auto",theme:"steel",font:"Arial,sans-serif",layout:"split",shape:"sharp"},
    "professional-neo":{family:"service",theme:"tech",font:"Arial,sans-serif",layout:"split",shape:"round"}
  };

  function themeVars(theme,accent){
    const m={
      "dark-gold":{bg:"#0a0908",card:"#14110e",soft:"#1d1711",text:"#fffaf2",muted:"#b9aa94",line:"#3a2f22",a:"#c9974d"},
      warm:{bg:"#2b0906",card:"#48100b",soft:"#6b160f",text:"#fff9f3",muted:"#e7b9aa",line:"#7a2d20",a:"#ffb12b"},
      editorial:{bg:"#eee9df",card:"#f8f5ef",soft:"#d8d0c3",text:"#171512",muted:"#685f54",line:"#c9bfae",a:"#171512"},
      soft:{bg:"#fbf3f6",card:"#fffafb",soft:"#eed7df",text:"#3c202c",muted:"#825d6d",line:"#e5c5d0",a:"#b85f7d"},
      steel:{bg:"#0d1118",card:"#151b25",soft:"#1e2735",text:"#f7faff",muted:"#9eabbe",line:"#303c4e",a:"#2469ff"},
      tech:{bg:"#041019",card:"#071b28",soft:"#0a293b",text:"#f5fbff",muted:"#8db3c7",line:"#16425a",a:"#11aef1"},
      custom:{bg:"#060b12",card:"#0b1420",soft:"#101c29",text:"#f8fbff",muted:"#9eb0c4",line:"#203246",a:accent}
    }; return m[theme]||m.custom;
  }

  function buildHTML(){
    const s=window.SITEZI_BUILDER_STATE||{}, key=context(s), p=PROFILE[key]||PROFILE.service;
    const preset=PRESET[s.template]||null;
    const seed=hash(`${s.businessName}|${s.businessType}|${s.template}`);
    const variant=(seed%4)+1;
    const plan=tier(account?.plan||"Básico");
    const accent=/^#[0-9a-f]{6}$/i.test(s.color||"")?s.color:"#1578ff";
    const tv=themeVars(preset?.theme||"custom",accent);
    if(!preset) tv.a=accent;
    const products=Array.isArray(s.products)?s.products:[];
    const photos=Array.isArray(s.photos)?s.photos:[];
    const name=esc(s.businessName||"Seu negócio"), location=esc(s.location||"Atendimento na sua região");
    const wa=String(s.whatsapp||"").replace(/\D/g,"");
    const waHref=wa?`https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}`:"#";
    const cta=esc(p.cta), heroPhoto=photos[0]||"";
    const logo=s.logoData?`<img class="brand-mark" src="${s.logoData}" alt=""><span>${name}</span>`:`<span class="brand-symbol">${p.icon}</span><span>${name}</span>`;
    const cards=(products.length?products:[{name:"Atendimento personalizado",description:p.intro}]).map((item,i)=>`
      <article class="service-card">
        ${item.photo?`<img class="service-photo" src="${item.photo}" alt="${esc(item.name)}">`:`<div class="service-fallback"><span>${p.icon}</span><small>${String(i+1).padStart(2,"0")}</small></div>`}
        <div class="service-body"><div class="service-top"><small>${key==="restaurant"?"DESTAQUE":key==="fashion"||key==="retail"?"PRODUTO":"SERVIÇO"} ${String(i+1).padStart(2,"0")}</small>${item.price?`<strong>${esc(item.price)}</strong>`:""}</div><h3>${esc(item.name||"Serviço")}</h3><p>${esc(item.description||"Entre em contato para saber mais detalhes.")}</p>${wa?`<a href="${waHref}" target="_blank">${cta} →</a>`:""}</div>
      </article>`).join("");
    const visual=heroPhoto?`<img src="${heroPhoto}" alt="${name}">`:`<div class="hero-fallback"><span class="big">${p.icon}</span><div class="shape s${variant}"></div><div class="panel"><small>${p.eyebrow}</small><b>${name}</b><span>${location}</span></div></div>`;
    const extra=plan!=="basic"?`<section class="section why"><div class="wrap whygrid"><div><span class="eyebrow">POR QUE ESCOLHER</span><h2>Uma experiência feita para gerar confiança.</h2><p>${esc(p.intro)}</p></div><div class="whylist">${["Informações claras","Visual pensado para o seu ramo","Contato sem complicação"].map((x,i)=>`<div><span>0${i+1}</span><b>${x}</b></div>`).join("")}</div></div></section>`:"";
    const gallery=plan==="premium"&&photos.length>1?`<section class="section alt"><div class="wrap"><span class="eyebrow">GALERIA</span><h2>Seu trabalho em destaque.</h2><div class="gallery">${photos.slice(1,5).map(x=>`<img src="${x}" alt="${name}">`).join("")}</div></div></section>`:"";
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      :root{--bg:${tv.bg};--card:${tv.card};--soft:${tv.soft};--text:${tv.text};--muted:${tv.muted};--line:${tv.line};--a:${tv.a};--radius:${preset?.shape==="sharp"?"10px":preset?.shape==="square"?"2px":"22px"}}
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:${preset?.font||"Inter,system-ui,sans-serif"}}a{text-decoration:none;color:inherit}img{display:block}.wrap{width:min(1180px,calc(100% - 36px));margin:auto}
      .nav{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 89%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.navin{min-height:86px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:11px;font-weight:900;font-size:20px}.brand-mark{height:64px;max-width:170px;object-fit:contain}.brand-symbol{display:grid;place-items:center;width:44px;height:44px;border-radius:var(--radius);background:var(--a);color:${preset?.theme==="editorial"?"#fff":"inherit"}}
      .links{display:flex;gap:20px;color:var(--muted);font:800 13px Arial,sans-serif}.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;background:var(--a);color:${preset?.theme==="warm"||preset?.theme==="editorial"?"#17120d":"#fff"};border:1px solid color-mix(in srgb,var(--a) 75%,white 10%);border-radius:var(--radius);font:900 14px Arial,sans-serif}.ghost{background:transparent;color:var(--text);border-color:var(--line)}
      .hero{padding:64px 0 48px;overflow:hidden}.hero-grid{display:grid;grid-template-columns:${preset?.layout==="immersive"?"1.18fr .82fr":"1fr 1fr"};gap:48px;align-items:center}.eyebrow{color:var(--a);font:950 11px Arial,sans-serif;letter-spacing:2px}.hero h1{font-size:clamp(48px,7vw,86px);line-height:.93;letter-spacing:-4px;margin:15px 0 18px}.hero p{font:400 17px/1.7 Arial,sans-serif;color:var(--muted);max-width:650px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
      .hero-media{min-height:500px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);background:var(--card);position:relative}.hero-media>img{width:100%;height:500px;object-fit:cover}.hero-fallback{height:500px;position:relative;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,var(--card),var(--soft))}.big{font-size:150px;opacity:.10}.shape{position:absolute;width:240px;height:240px;right:-30px;top:36px;border:2px solid var(--a);opacity:.65}.shape.s1{border-radius:50%}.shape.s2{border-radius:28% 72% 58% 42%;transform:rotate(28deg)}.shape.s3{transform:skew(-15deg);border-radius:12px}.shape.s4{border-radius:50% 10% 50% 10%;transform:rotate(18deg)}.panel{position:absolute;left:26px;right:26px;bottom:26px;padding:20px;border:1px solid var(--line);background:color-mix(in srgb,var(--bg) 78%,transparent);backdrop-filter:blur(14px);border-radius:var(--radius)}.panel small,.panel b,.panel span{display:block}.panel b{font-size:22px;margin:4px 0}.panel span{color:var(--muted);font:13px Arial,sans-serif}
      .trust{border-block:1px solid var(--line);background:var(--card)}.trustgrid{display:grid;grid-template-columns:repeat(4,1fr)}.trustitem{padding:19px;border-right:1px solid var(--line)}.trustitem:last-child{border-right:0}.trustitem small{display:block;color:var(--a);font:900 10px Arial,sans-serif;margin-bottom:5px}.trustitem b{font:800 13px Arial,sans-serif}
      .section{padding:88px 0}.alt{background:var(--card)}.section h2{font-size:clamp(36px,5vw,58px);line-height:.98;letter-spacing:-2px;margin:10px 0 15px}.section p{color:var(--muted);font:400 16px/1.7 Arial,sans-serif}.head{max-width:760px;margin-bottom:32px}.services{display:grid;grid-template-columns:repeat(3,1fr);gap:${preset?.theme==="editorial"?"2px":"15px"}}.service-card{background:var(--bg);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}.service-photo,.service-fallback{width:100%;height:220px;object-fit:cover}.service-fallback{display:flex;align-items:flex-end;justify-content:space-between;padding:22px;background:linear-gradient(145deg,var(--soft),var(--card))}.service-fallback span{font-size:54px}.service-fallback small{color:var(--muted)}.service-body{padding:22px}.service-top{display:flex;justify-content:space-between;gap:12px;font:900 10px Arial,sans-serif;color:var(--muted)}.service-top strong{color:var(--a);font-size:15px}.service-card h3{font-size:22px;margin:22px 0 9px}.service-card p{font-size:14px}.service-card a{display:inline-flex;margin-top:8px;color:var(--a);font:900 13px Arial,sans-serif}
      .whygrid{display:grid;grid-template-columns:1fr 1fr;gap:42px}.whylist{display:grid;gap:10px}.whylist div{display:grid;grid-template-columns:45px 1fr;align-items:center;gap:13px;padding:17px;border:1px solid var(--line);background:var(--card);border-radius:var(--radius)}.whylist span{display:grid;place-items:center;width:45px;height:45px;background:var(--soft);color:var(--a);font:900 12px Arial,sans-serif}.whylist b{font:800 14px Arial,sans-serif}
      .gallery{display:grid;grid-template-columns:1.3fr .7fr .7fr;gap:10px;margin-top:24px}.gallery img{width:100%;height:300px;object-fit:cover;border-radius:var(--radius)}.contact{padding:84px 0}.contactbox{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;padding:34px;background:var(--card);border:1px solid var(--line);border-radius:var(--radius)}footer{padding:28px 0;border-top:1px solid var(--line);color:var(--muted);font:13px Arial,sans-serif}.foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
      body.variant-2 .hero-grid{grid-template-columns:.86fr 1.14fr}body.variant-3 .hero h1{max-width:760px}body.variant-3 .hero-media{transform:rotate(1deg)}body.variant-4 .service-card:nth-child(even){transform:translateY(12px)}
      @media(max-width:850px){.links{display:none}.hero-grid,.whygrid,.contactbox{grid-template-columns:1fr}.hero-media,.hero-media>img,.hero-fallback{height:360px;min-height:360px}.services{grid-template-columns:1fr 1fr}.trustgrid{grid-template-columns:1fr 1fr}.gallery{grid-template-columns:1fr 1fr}.gallery img:first-child{grid-column:1/3}}
      @media(max-width:560px){.wrap{width:min(100% - 24px,1180px)}.hero{padding:42px 0 32px}.hero h1{font-size:49px;letter-spacing:-3px}.hero-media,.hero-media>img,.hero-fallback{height:300px;min-height:300px}.services{grid-template-columns:1fr}.trustitem{padding:14px}.section{padding:66px 0}.gallery{grid-template-columns:1fr}.gallery img,.gallery img:first-child{grid-column:auto;height:240px}.contactbox{padding:25px}}
    </style></head><body class="variant-${variant} tier-${plan}">
      <header class="nav"><div class="wrap navin"><div class="brand">${logo}</div><nav class="links"><a href="#servicos">${key==="restaurant"?"Cardápio":"Serviços"}</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>${wa?`<a class="btn" href="${waHref}" target="_blank">${cta}</a>`:""}</div></header>
      <main><section class="hero"><div class="wrap hero-grid"><div><span class="eyebrow">${p.eyebrow}</span><h1>${esc(s.slogan||p.headline)}</h1><p>${p.intro}</p><div class="actions">${wa?`<a class="btn" href="${waHref}" target="_blank">${cta} →</a>`:""}<a class="btn ghost" href="#servicos">${key==="restaurant"?"Ver destaques":"Conhecer serviços"}</a></div></div><div class="hero-media">${visual}</div></div></section>
      <div class="trust"><div class="wrap trustgrid">${p.trust.map((x,i)=>`<div class="trustitem"><small>0${i+1}</small><b>${x}</b></div>`).join("")}</div></div>
      <section id="servicos" class="section alt"><div class="wrap"><div class="head"><span class="eyebrow">${key==="restaurant"?"DESTAQUES DA CASA":key==="fashion"||key==="retail"?"EM DESTAQUE":"O QUE FAZEMOS"}</span><h2>${key==="restaurant"?"Escolha o que combina com seu momento.":key==="fashion"||key==="retail"?"Uma vitrine feita para valorizar cada produto.":"Serviços apresentados com clareza."}</h2><p>Conteúdo preenchido com as informações reais da ${name}.</p></div><div class="services">${cards}</div></div></section>
      ${extra}<section id="sobre" class="section"><div class="wrap whygrid"><div><span class="eyebrow">SOBRE</span><h2>${name}</h2><p>${esc(s.slogan||p.intro)}</p></div><div><span class="eyebrow">ATENDIMENTO</span><h2 style="font-size:34px">${location}</h2><p>Informações organizadas e contato direto para facilitar a decisão de quem procura pelo seu negócio.</p></div></div></section>${gallery}
      <section id="contato" class="contact"><div class="wrap contactbox"><div><span class="eyebrow">FALE CONOSCO</span><h2 style="margin:8px 0">${esc(p.cta)}</h2><p>Entre em contato com a ${name}.</p></div>${wa?`<a class="btn" href="${waHref}" target="_blank">${cta} →</a>`:""}</div></section></main>
      <footer><div class="wrap foot"><span>${name}</span><span>Site criado com SITEZI.</span></div></footer></body></html>`;
  }

  async function syncAccount(){try{const i=await window.SITEZI_ACCOUNT_STATE?.refresh?.();if(i)account=i}catch(_){}}
  window.addEventListener("sitezi:account-info",e=>{account=e.detail||account});
  function install(){
    const btn=$("generateSite"); if(!btn)return;
    btn.onclick=async()=>{await syncAccount();const frame=$("sitePreview");if(frame)frame.srcdoc=buildHTML();const s=window.SITEZI_BUILDER_STATE||{};if($("previewDomain")){const sl=String(s.businessName||"meu-negocio").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");$("previewDomain").textContent=`${sl||"meu-negocio"}.sitezi.com.br`}if(typeof window.SITEZI_SHOW_SCREEN==="function"&&$("result"))window.SITEZI_SHOW_SCREEN($("result"))};
    document.documentElement.dataset.siteziPremiumEngine="2.0";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{install();syncAccount()});else{install();syncAccount()}
})();
