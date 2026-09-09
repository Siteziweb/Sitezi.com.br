/* =========================================================
   SITEZI — MOTOR DE QUALIDADE v1.0
   Preview mais completo, específico ao negócio e sensível ao plano.
   Não cria novas imagens nem consome créditos.
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let account = { active:false, plan:"Básico" };

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  function tier(plan="") {
    const p = String(plan).toLowerCase();
    if (p.includes("premium")) return "premium";
    if (p.includes("profissional")) return "professional";
    return "basic";
  }

  function contextKey(s) {
    const all = [
      s.businessType, s.businessName,
      ...(Array.isArray(s.products) ? s.products.flatMap(p => [p.name,p.description]) : [])
    ].join(" ").toLowerCase();
    if (/(elétr|eletr|quadro elétrico|quadro eletrico|fiação|fiacao|disjuntor)/.test(all)) return "electrical";
    if (/(hidrául|hidraul|encan|vazamento)/.test(all)) return "plumbing";
    if (String(s.businessType).includes("Oficina")) return "auto";
    if (String(s.businessType).includes("Restaurante")) return "restaurant";
    if (String(s.businessType).includes("Barbearia")) return "barber";
    if (/Salão|Beleza/.test(String(s.businessType))) return "beauty";
    if (/Moda|Vestuário/.test(String(s.businessType))) return "fashion";
    if (/Clínica|Saúde/.test(String(s.businessType))) return "health";
    if (/Loja|Comércio/.test(String(s.businessType))) return "retail";
    return "service";
  }

  const profiles = {
    electrical:{
      eyebrow:"SERVIÇOS ELÉTRICOS",
      headline:"Instalações elétricas com segurança, precisão e atendimento direto.",
      intro:"Soluções elétricas residenciais e comerciais para quem precisa de um serviço bem executado, organizado e fácil de contratar.",
      icon:"⚡",
      trust:["Atendimento direto","Serviço organizado","Residencial e comercial","Contato rápido"],
      why:["Avaliação clara do serviço","Execução com atenção aos detalhes","Comunicação simples do início ao fim"],
      process:["Conte o que precisa","Receba a avaliação","Agende o serviço"]
    },
    plumbing:{eyebrow:"SERVIÇOS HIDRÁULICOS",headline:"Soluções hidráulicas sem complicação.",intro:"Atendimento profissional para instalações, reparos e manutenção em residências e comércios.",icon:"◈",trust:["Atendimento direto","Diagnóstico claro","Serviço organizado","Contato rápido"],why:["Avaliação do problema","Solução adequada ao serviço","Atendimento próximo"],process:["Explique o problema","Receba a avaliação","Agende o atendimento"]},
    auto:{eyebrow:"OFICINA MECÂNICA",headline:"Seu carro em boas mãos.",intro:"Manutenção automotiva com transparência, cuidado técnico e atendimento simples.",icon:"⚙",trust:["Atendimento profissional","Orçamento claro","Cuidado técnico","Contato rápido"],why:["Serviços apresentados com clareza","Atendimento próximo","Foco no que seu veículo precisa"],process:["Conte o problema","Faça a avaliação","Autorize o serviço"]},
    restaurant:{eyebrow:"RESTAURANTE",headline:"Sabor que dá vontade de voltar.",intro:"Conheça os destaques da casa e peça informações de um jeito rápido e simples.",icon:"◉",trust:["Pratos em destaque","Contato fácil","Atendimento próximo","Experiência convidativa"],why:["Cardápio em destaque","Informações fáceis de encontrar","Contato direto"],process:["Escolha seu favorito","Fale com a equipe","Faça seu pedido"]},
    barber:{eyebrow:"BARBEARIA",headline:"Seu estilo começa aqui.",intro:"Corte, barba e cuidado pessoal com uma apresentação moderna e atendimento próximo.",icon:"✂",trust:["Atendimento personalizado","Serviços em destaque","Agendamento fácil","Contato direto"],why:["Serviços claros","Visual profissional","Facilidade para agendar"],process:["Escolha o serviço","Entre em contato","Agende seu horário"]},
    beauty:{eyebrow:"BELEZA & CUIDADO",headline:"Realce o melhor de você.",intro:"Serviços de beleza apresentados com cuidado, elegância e uma experiência fácil para suas clientes.",icon:"✦",trust:["Atendimento personalizado","Serviços em destaque","Contato rápido","Experiência acolhedora"],why:["Apresentação elegante","Informações claras","Facilidade para agendar"],process:["Escolha o serviço","Fale com o espaço","Agende seu horário"]},
    fashion:{eyebrow:"MODA & ESTILO",headline:"Peças que combinam com o seu estilo.",intro:"Uma vitrine digital moderna para apresentar produtos, novidades e facilitar o contato.",icon:"◇",trust:["Produtos em destaque","Contato fácil","Visual profissional","Novidades organizadas"],why:["Vitrine clara","Produtos valorizados","Contato direto"],process:["Veja os destaques","Escolha o produto","Fale com a loja"]},
    health:{eyebrow:"SAÚDE & BEM-ESTAR",headline:"Cuidado profissional perto de você.",intro:"Uma presença digital clara e acolhedora para apresentar serviços e facilitar o primeiro contato.",icon:"✚",trust:["Atendimento humanizado","Informações claras","Contato fácil","Presença profissional"],why:["Comunicação acolhedora","Serviços organizados","Contato simplificado"],process:["Conheça os serviços","Entre em contato","Agende seu atendimento"]},
    retail:{eyebrow:"LOJA & COMÉRCIO",headline:"Tudo o que você procura, mais perto.",intro:"Produtos e novidades apresentados de um jeito simples, profissional e pronto para gerar contato.",icon:"▦",trust:["Produtos em destaque","Contato rápido","Vitrine organizada","Atendimento próximo"],why:["Produtos valorizados","Informações objetivas","Contato direto"],process:["Veja os produtos","Escolha seu interesse","Fale com a loja"]},
    service:{eyebrow:"SERVIÇOS PROFISSIONAIS",headline:"Um serviço profissional começa por uma apresentação que transmite confiança.",intro:"Mostre o que você faz, como atende e facilite o contato de novos clientes.",icon:"✓",trust:["Atendimento direto","Informações claras","Serviços organizados","Contato rápido"],why:["Apresentação profissional","Serviços fáceis de entender","Contato simples"],process:["Conte o que precisa","Receba a orientação","Agende o serviço"]}
  };

  function buildHTML() {
    const s = window.SITEZI_BUILDER_STATE || {};
    const p = profiles[contextKey(s)] || profiles.service;
    const plan = account?.plan || "Básico";
    const planTier = tier(plan);
    const products = Array.isArray(s.products) ? s.products : [];
    const photos = Array.isArray(s.photos) ? s.photos : [];
    const logo = s.logoData || "";
    const name = esc(s.businessName || $("businessName")?.value || "Seu negócio");
    const accent = /^#[0-9a-f]{6}$/i.test(s.color || "") ? s.color : "#1578ff";
    const wa = String(s.whatsapp || "").replace(/\D/g,"");
    const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.")}` : "#";
    const location = esc(s.location || "Atendimento na sua região");
    const heroPhoto = photos[0] || "";
    const brand = logo
      ? `<div class="brand"><img class="brand-mark" src="${logo}" alt=""><span>${name}</span></div>`
      : `<div class="brand"><span class="brand-symbol">${p.icon}</span><span>${name}</span></div>`;

    const serviceCards = (products.length ? products : [{name:"Atendimento personalizado",description:p.intro}]).map((item,i)=>`
      <article class="service-card">
        ${item.photo ? `<img class="service-photo" src="${item.photo}" alt="${esc(item.name)}">`
          : `<div class="service-fallback"><span>${p.icon}</span><small>${String(i+1).padStart(2,"0")}</small></div>`}
        <div class="service-body">
          <div class="service-top"><small>SERVIÇO ${String(i+1).padStart(2,"0")}</small>${item.price?`<strong>${esc(item.price)}</strong>`:""}</div>
          <h3>${esc(item.name || "Serviço")}</h3>
          <p>${esc(item.description || "Entre em contato para saber mais detalhes sobre este serviço.")}</p>
          ${wa ? `<a href="${waHref}" target="_blank">Quero saber mais →</a>` : ""}
        </div>
      </article>
    `).join("");

    const faq = [
      ["Como solicitar um orçamento?","Use o botão de WhatsApp e explique rapidamente o que você precisa."],
      ["Onde é realizado o atendimento?", s.location ? `O atendimento informado é em ${s.location}.` : "Entre em contato para confirmar a região de atendimento."],
      ["Posso tirar dúvidas antes de contratar?","Sim. O primeiro contato serve justamente para entender sua necessidade e orientar os próximos passos."]
    ].map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      :root{--a:${accent};--bg:#050a11;--card:#0b1420;--soft:#101c29;--text:#f8fbff;--muted:#9eb0c4;--line:#203246}
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}a{text-decoration:none;color:inherit}img{display:block}
      .wrap{width:min(1180px,calc(100% - 36px));margin:auto}.nav{position:sticky;top:0;z-index:50;background:rgba(5,10,17,.88);backdrop-filter:blur(18px);border-bottom:1px solid var(--line)}
      .navin{min-height:92px;display:flex;align-items:center;justify-content:space-between;gap:22px}.brand{display:flex;align-items:center;gap:12px;font-weight:950;font-size:20px;letter-spacing:-.5px}.brand-mark{height:72px;max-width:180px;object-fit:contain}.brand-symbol{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:var(--a);font-size:24px}
      .links{display:flex;align-items:center;gap:22px;color:var(--muted);font-size:13px;font-weight:800}.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;border-radius:13px;font-weight:900;background:var(--a);color:#fff;border:1px solid color-mix(in srgb,var(--a) 72%,white 10%)}.ghost{background:transparent;border-color:#30455d;color:#e6eef7}
      .hero{padding:72px 0 44px;overflow:hidden;position:relative}.hero:before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;right:-160px;top:-200px;background:color-mix(in srgb,var(--a) 26%,transparent);filter:blur(80px)}.hero-grid{position:relative;display:grid;grid-template-columns:1.02fr .98fr;gap:48px;align-items:center}
      .eyebrow{color:#5bb8ff;font-size:12px;font-weight:950;letter-spacing:2px}.hero h1{font-size:clamp(48px,6.7vw,82px);line-height:.94;letter-spacing:-4px;margin:16px 0 18px;max-width:820px}.hero p{font-size:18px;line-height:1.7;color:var(--muted);max-width:650px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
      .hero-media{min-height:500px;border-radius:30px;overflow:hidden;border:1px solid #2b4057;background:linear-gradient(145deg,#0d1927,#07101b);box-shadow:0 32px 90px rgba(0,0,0,.38);position:relative}.hero-media img{width:100%;height:500px;object-fit:cover}.hero-fallback{height:500px;display:grid;place-items:center;position:relative;overflow:hidden}.hero-fallback .big{font-size:140px;opacity:.16}.hero-fallback .panel{position:absolute;left:28px;right:28px;bottom:28px;padding:20px;border-radius:18px;border:1px solid #334b64;background:rgba(5,12,20,.76);backdrop-filter:blur(12px)}.hero-fallback b{font-size:22px}.hero-fallback small{display:block;color:var(--muted);margin-top:5px}
      .trust{padding:18px 0;border-block:1px solid var(--line);background:#07101a}.trustgrid{display:grid;grid-template-columns:repeat(4,1fr)}.trustitem{padding:18px 20px;border-right:1px solid var(--line)}.trustitem:last-child{border-right:0}.trustitem small{display:block;color:#5bb8ff;font-weight:900;margin-bottom:5px}.trustitem b{font-size:14px}
      .section{padding:88px 0}.alt{background:#08111b}.section-head{max-width:760px;margin-bottom:34px}.section-head h2{font-size:clamp(36px,5vw,58px);line-height:.98;letter-spacing:-2.5px;margin:10px 0 14px}.section-head p{color:var(--muted);font-size:17px;line-height:1.7}
      .services{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.service-card{border:1px solid var(--line);border-radius:22px;background:var(--card);overflow:hidden;min-width:0}.service-photo,.service-fallback{width:100%;height:220px;object-fit:cover}.service-fallback{display:flex;align-items:flex-end;justify-content:space-between;padding:24px;background:radial-gradient(circle at 76% 22%,color-mix(in srgb,var(--a) 45%,transparent),transparent 28%),linear-gradient(145deg,#0f1d2c,#09131f)}.service-fallback span{font-size:58px}.service-fallback small{font-size:12px;color:#6d849c}.service-body{padding:22px}.service-top{display:flex;justify-content:space-between;gap:12px;color:#6f859c;font-size:11px;font-weight:900}.service-top strong{color:#69c0ff;font-size:15px}.service-card h3{font-size:22px;margin:22px 0 10px}.service-card p{color:var(--muted);line-height:1.6;font-size:14px}.service-card a{display:inline-flex;margin-top:8px;color:#69c0ff;font-weight:900;font-size:13px}
      .why{display:grid;grid-template-columns:.9fr 1.1fr;gap:42px;align-items:start}.why-box{border:1px solid var(--line);border-radius:26px;background:linear-gradient(145deg,#0f1b29,#08111b);padding:28px}.why-list{display:grid;gap:12px}.why-item{display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:center;padding:18px;border:1px solid var(--line);border-radius:18px;background:#09131e}.why-item span{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--a) 18%,transparent);color:#63bdff;font-weight:950}.why-item b{display:block}.why-item small{display:block;color:var(--muted);margin-top:4px;line-height:1.45}
      .process{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stepbox{padding:26px;border-top:2px solid var(--a);background:#09131e;border-radius:0 0 18px 18px}.stepbox small{color:#62bdff;font-weight:950}.stepbox h3{margin:18px 0 8px}.stepbox p{color:var(--muted);line-height:1.55;font-size:14px}
      .aboutgrid{display:grid;grid-template-columns:1fr .9fr;gap:42px;align-items:center}.aboutcard{padding:30px;border:1px solid var(--line);border-radius:26px;background:#0a1420}.aboutcard h3{font-size:30px;margin:0 0 12px}.aboutcard p{color:var(--muted);line-height:1.7}.meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.meta span{padding:9px 11px;border-radius:999px;background:#101d2b;color:#b7c7d8;font-size:12px}
      .faq{display:grid;gap:10px}.faq details{border:1px solid var(--line);border-radius:16px;background:#0a1420;padding:0 18px}.faq summary{cursor:pointer;padding:18px 0;font-weight:850}.faq p{color:var(--muted);line-height:1.6;margin:0 0 18px}
      .gallery{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:12px}.gallery img{width:100%;height:300px;object-fit:cover;border-radius:20px}.contact{padding:88px 0}.contact-card{padding:38px;border:1px solid #2a4058;border-radius:28px;background:linear-gradient(135deg,#0f1e2d,#08111a);display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}.contact-card h2{font-size:clamp(34px,4vw,52px);margin:8px 0 10px}.contact-card p{color:var(--muted)}
      footer{border-top:1px solid var(--line);padding:30px 0;color:#73879d;font-size:13px}.foot{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}
      .plan-badge{display:inline-flex;margin-left:8px;padding:5px 8px;border-radius:999px;background:#102137;color:#69c0ff;font-size:9px;font-weight:950;letter-spacing:.5px}
      body.tier-premium .hero-media{box-shadow:0 34px 100px color-mix(in srgb,var(--a) 18%,transparent)}body.tier-premium .service-card{background:linear-gradient(160deg,#0c1825,#08111b)}
      @media(max-width:850px){.links{display:none}.hero-grid,.why,.aboutgrid,.contact-card{grid-template-columns:1fr}.hero-media,.hero-media img,.hero-fallback{height:360px;min-height:360px}.services{grid-template-columns:1fr 1fr}.trustgrid{grid-template-columns:1fr 1fr}.trustitem:nth-child(2){border-right:0}.process{grid-template-columns:1fr}.gallery{grid-template-columns:1fr 1fr}.gallery img:first-child{grid-column:1/3}.contact-card{align-items:start}}
      @media(max-width:560px){.wrap{width:min(100% - 24px,1180px)}.navin{min-height:82px}.brand-mark{height:62px;max-width:145px}.brand{font-size:17px}.nav .btn{display:none}.hero{padding:44px 0 34px}.hero h1{font-size:50px;letter-spacing:-3px}.hero p{font-size:16px}.hero-media,.hero-media img,.hero-fallback{height:300px;min-height:300px}.trustgrid{grid-template-columns:1fr 1fr}.trustitem{padding:14px}.services{grid-template-columns:1fr}.section{padding:68px 0}.section-head h2{font-size:40px}.gallery{grid-template-columns:1fr}.gallery img,.gallery img:first-child{grid-column:auto;height:240px}.contact{padding:68px 0}.contact-card{padding:26px}}
    </style></head><body class="tier-${planTier}">
      <header class="nav"><div class="wrap navin">${brand}<nav class="links"><a href="#servicos">Serviços</a><a href="#diferenciais">Diferenciais</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav>${wa?`<a class="btn" href="${waHref}" target="_blank">WhatsApp</a>`:""}</div></header>
      <main>
        <section class="hero"><div class="wrap hero-grid"><div><span class="eyebrow">${p.eyebrow}</span><h1>${esc(s.slogan || p.headline)}</h1><p>${p.intro}</p><div class="actions">${wa?`<a class="btn" href="${waHref}" target="_blank">Solicitar atendimento →</a>`:""}<a class="btn ghost" href="#servicos">Conhecer serviços</a></div></div><div class="hero-media">${heroPhoto?`<img src="${heroPhoto}" alt="${name}">`:`<div class="hero-fallback"><span class="big">${p.icon}</span><div class="panel"><b>${name}</b><small>${location}</small></div></div>`}</div></div></section>
        <div class="trust"><div class="wrap trustgrid">${p.trust.map((x,i)=>`<div class="trustitem"><small>0${i+1}</small><b>${x}</b></div>`).join("")}</div></div>
        <section id="servicos" class="section alt"><div class="wrap"><div class="section-head"><span class="eyebrow">O QUE FAZEMOS</span><h2>Serviços apresentados com clareza.</h2><p>Veja os principais serviços da ${name} e encontre rapidamente o que você precisa.</p></div><div class="services">${serviceCards}</div></div></section>
        ${planTier !== "basic" ? `<section id="diferenciais" class="section"><div class="wrap why"><div class="section-head"><span class="eyebrow">POR QUE ESCOLHER</span><h2>Uma experiência profissional do primeiro contato ao serviço.</h2><p>A apresentação do seu negócio precisa transmitir a mesma confiança que você quer entregar no atendimento.</p></div><div class="why-list">${p.why.map((x,i)=>`<div class="why-item"><span>${i+1}</span><div><b>${x}</b><small>Informações objetivas para o cliente tomar a próxima decisão com segurança.</small></div></div>`).join("")}</div></div></section>`:""}
        <section class="section alt"><div class="wrap"><div class="section-head"><span class="eyebrow">COMO FUNCIONA</span><h2>Do contato ao atendimento em poucos passos.</h2></div><div class="process">${p.process.map((x,i)=>`<div class="stepbox"><small>PASSO 0${i+1}</small><h3>${x}</h3><p>Um caminho simples para facilitar a contratação e evitar complicação.</p></div>`).join("")}</div></div></section>
        <section id="sobre" class="section"><div class="wrap aboutgrid"><div class="section-head"><span class="eyebrow">SOBRE</span><h2>${name}</h2><p>${esc(s.slogan || p.intro)}</p></div><div class="aboutcard"><h3>Atendimento próximo e profissional.</h3><p>Informações organizadas, serviços claros e contato direto para facilitar a vida de quem procura pelo seu trabalho.</p><div class="meta"><span>${location}</span>${s.instagram?`<span>@${esc(String(s.instagram).replace(/^@/,""))}</span>`:""}${s.email?`<span>${esc(s.email)}</span>`:""}<span>${esc(plan)}<span class="plan-badge">SITEZI</span></span></div></div></div></section>
        ${planTier === "premium" && photos.length>1 ? `<section class="section alt"><div class="wrap"><div class="section-head"><span class="eyebrow">GALERIA</span><h2>Seu trabalho em destaque.</h2></div><div class="gallery">${photos.slice(1,4).map(x=>`<img src="${x}" alt="${name}">`).join("")}</div></div></section>`:""}
        ${planTier !== "basic" ? `<section class="section alt"><div class="wrap aboutgrid"><div class="section-head"><span class="eyebrow">DÚVIDAS FREQUENTES</span><h2>Antes de entrar em contato.</h2><p>Respostas rápidas para facilitar a decisão do cliente.</p></div><div class="faq">${faq}</div></div></section>`:""}
        <section id="contato" class="contact"><div class="wrap contact-card"><div><span class="eyebrow">FALE CONOSCO</span><h2>Precisa deste serviço?</h2><p>Entre em contato com a ${name} e explique o que você precisa.</p></div>${wa?`<a class="btn" href="${waHref}" target="_blank">Chamar no WhatsApp →</a>`:""}</div></section>
      </main><footer><div class="wrap foot"><span>${name}</span><span>Site criado com SITEZI.</span></div></footer>
    </body></html>`;
  }

  async function syncAccount() {
    try {
      const info = await window.SITEZI_ACCOUNT_STATE?.refresh?.();
      if (info) account = info;
    } catch (_) {}
  }

  window.addEventListener("sitezi:account-info", e => { account = e.detail || account; });

  function install() {
    const btn = $("generateSite");
    if (!btn) return;
    btn.onclick = async () => {
      await syncAccount();
      const frame = $("sitePreview");
      if (frame) frame.srcdoc = buildHTML();
      const s = window.SITEZI_BUILDER_STATE || {};
      if ($("previewDomain")) {
        const slug = String(s.businessName || "meu-negocio").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
        $("previewDomain").textContent = `${slug || "meu-negocio"}.sitezi.com.br`;
      }
      if (typeof window.SITEZI_SHOW_SCREEN === "function" && $("result")) window.SITEZI_SHOW_SCREEN($("result"));
    };
    document.documentElement.dataset.siteziPremiumEngine = "1.0";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { install(); syncAccount(); });
  else { install(); syncAccount(); }
})();
