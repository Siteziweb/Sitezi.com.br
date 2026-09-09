/* =========================================================
   SITEZI — MODELOS REAIS + EXEMPLOS DINÂMICOS v2.1
   - transforma os exemplos em famílias reais de design
   - mantém "Criar do meu jeito"
   - salva a família escolhida em state.template
   - usa variação determinística por negócio no motor de qualidade
   - não usa IA e não consome créditos
   ========================================================= */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);

  const EXAMPLES = {
    "Oficina Mecânica": {name:"Ex.: Troca de óleo",price:"Ex.: R$ 129,90",description:"Ex.: Troca do óleo do motor com verificação do filtro e dos principais níveis."},
    "Restaurante": {name:"Ex.: Prato executivo",price:"Ex.: R$ 29,90",description:"Ex.: Refeição completa preparada na hora, com acompanhamento e opções do dia."},
    "Barbearia": {name:"Ex.: Corte masculino",price:"Ex.: R$ 45,00",description:"Ex.: Corte personalizado com acabamento e finalização de acordo com o seu estilo."},
    "Salão de Beleza": {name:"Ex.: Escova e finalização",price:"Ex.: R$ 80,00",description:"Ex.: Serviço de escova com preparação dos fios e finalização personalizada."},
    "Moda e Vestuário": {name:"Ex.: Camiseta básica",price:"Ex.: R$ 59,90",description:"Ex.: Camiseta confortável para o dia a dia, disponível em diferentes tamanhos."},
    "Loja / Comércio": {name:"Ex.: Produto em destaque",price:"Ex.: R$ 99,90",description:"Ex.: Produto selecionado com qualidade e atendimento para ajudar você na melhor escolha."},
    "Clínica / Saúde": {name:"Ex.: Consulta de avaliação",price:"Ex.: R$ 150,00",description:"Ex.: Atendimento inicial para avaliação, orientação e definição dos próximos cuidados."},
    "Prestador de Serviços": {name:"Ex.: Instalação elétrica",price:"Ex.: R$ 150,00",description:"Ex.: Instalação e manutenção elétrica com avaliação do serviço e execução profissional."},
    "Outro": {name:"Ex.: Seu principal produto ou serviço",price:"Ex.: R$ 100,00",description:"Ex.: Explique de forma simples o que está incluído e como este produto ou serviço ajuda o cliente."}
  };

  const PRESETS = [
    {id:"barber-signature", business:"Barbearia", tag:"SIGNATURE", title:"Barbearia", headline:"Seu estilo. Nossa atitude.", desc:"Escuro, elegante e com foco em agendamento.", emoji:"✂", cls:"barber"},
    {id:"restaurant-flavor", business:"Restaurante", tag:"SABOR", title:"Restaurante", headline:"Feito com ingredientes de verdade.", desc:"Visual gastronômico, cardápio e pedido em destaque.", emoji:"◉", cls:"restaurant"},
    {id:"fashion-urban", business:"Moda e Vestuário", tag:"URBAN", title:"Loja de roupas", headline:"Moda que combina com você.", desc:"Editorial, moderno e pensado para produtos.", emoji:"◇", cls:"fashion"},
    {id:"beauty-essence", business:"Salão de Beleza", tag:"ESSENZA", title:"Estética & salão", headline:"Realce a melhor versão de você.", desc:"Leve, refinado e voltado a agendamento.", emoji:"✦", cls:"beauty"},
    {id:"auto-drive", business:"Oficina Mecânica", tag:"DRIVE", title:"Oficina / Auto Center", headline:"Seu carro em boas mãos.", desc:"Técnico, forte e orientado a orçamento.", emoji:"⚙", cls:"auto"},
    {id:"professional-neo", business:"Prestador de Serviços", tag:"NEO", title:"Profissional / Empresa", headline:"Seu serviço com presença digital.", desc:"Versátil, profissional e pronto para conversão.", emoji:"✓", cls:"professional"}
  ];

  function state(){ return window.SITEZI_BUILDER_STATE || null; }
  function emit(){
    const s=state(); if(!s) return;
    window.dispatchEvent(new CustomEvent("sitezi:builder-state",{detail:JSON.parse(JSON.stringify(s))}));
  }
  function currentType(){ return state()?.businessType || "Outro"; }

  function applyExamples(){
    const ex=EXAMPLES[currentType()]||EXAMPLES.Outro;
    if($("productName")) $("productName").placeholder=ex.name;
    if($("productPrice")) $("productPrice").placeholder=ex.price;
    if($("productDescription")) $("productDescription").placeholder=ex.description;
  }

  function installStyle(){
    if($("sitezi-template-system-v2-style")) return;
    const st=document.createElement("style");
    st.id="sitezi-template-system-v2-style";
    st.textContent=`
      .sitezi-model-modal{position:fixed;inset:0;z-index:13000;background:#030711f2;backdrop-filter:blur(16px);overflow:auto;padding:18px}
      .sitezi-model-shell{width:min(980px,100%);margin:auto;color:#f8fbff;font-family:Inter,Arial,sans-serif}
      .sitezi-model-head{position:sticky;top:0;z-index:3;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:16px 0 18px;background:linear-gradient(#030711 75%,transparent)}
      .sitezi-model-head h2{margin:4px 0 6px;font-size:clamp(28px,5vw,44px);letter-spacing:-1.6px}.sitezi-model-head p{margin:0;color:#91a3b8;line-height:1.5}
      .sitezi-model-close{width:44px;height:44px;border-radius:50%;border:1px solid #29415e;background:#091322;color:#fff;font-size:25px;cursor:pointer}
      .sitezi-model-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;padding-bottom:28px}
      .sitezi-model{overflow:hidden;border:1px solid #20344f;border-radius:22px;background:#07101c;box-shadow:0 18px 55px rgba(0,0,0,.25)}
      .sitezi-model-preview{height:240px;position:relative;overflow:hidden;padding:22px;display:flex;flex-direction:column;justify-content:space-between}
      .sitezi-model-preview:after{content:"";position:absolute;right:-25px;top:38px;width:150px;height:150px;border-radius:34% 66% 58% 42%;transform:rotate(22deg);opacity:.82}
      .sitezi-model-preview .mini-nav,.sitezi-model-preview .mini-copy{position:relative;z-index:2}.sitezi-model-preview .mini-nav{display:flex;justify-content:space-between;font-size:10px;font-weight:950;letter-spacing:1.3px}
      .sitezi-model-preview h3{margin:7px 0 7px;max-width:70%;font-size:26px;line-height:.96;letter-spacing:-1px}.sitezi-model-preview small{opacity:.75}.sitezi-model-preview b{display:inline-flex;margin-top:12px;padding:7px 10px;border-radius:999px;font-size:9px}
      .sitezi-model-preview.barber{background:radial-gradient(circle at 80% 48%,#7b5d403d,transparent 28%),linear-gradient(145deg,#090807,#17120e)}.barber:after{border:2px solid #7a5b3a;background:repeating-linear-gradient(100deg,transparent 0 8px,#7a5b3a66 9px 10px)}.barber b{background:#d9a85f;color:#1a1209}
      .sitezi-model-preview.restaurant{background:linear-gradient(145deg,#5e0b07,#c52917)}.restaurant:after{background:radial-gradient(circle at 50% 50%,#ffd67a 0 13%,#df5b21 14% 36%,#9f160c 37% 60%,transparent 61%);border-radius:50%}.restaurant b{background:#ffd95f;color:#4d1607}
      .sitezi-model-preview.fashion{background:linear-gradient(135deg,#efe9df,#cabfac);color:#171510}.fashion:after{background:#2d3135;border-radius:42% 42% 10% 10%;box-shadow:-35px 20px 0 #e8e0d4}.fashion b{background:#171510;color:#fff}
      .sitezi-model-preview.beauty{background:linear-gradient(145deg,#f2c6d5,#a85976)}.beauty:after{background:radial-gradient(circle at 35% 35%,#ffeaf2,transparent 36%),#d79aaf;border-radius:50%}.beauty b{background:#fff1f5;color:#7d2d49}
      .sitezi-model-preview.auto{background:linear-gradient(145deg,#181c24,#2b3442)}.auto:after{background:linear-gradient(135deg,#1556f0,#0b2e87);border-radius:12px;transform:skew(-18deg)}.auto b{background:#1556f0;color:#fff}
      .sitezi-model-preview.professional{background:linear-gradient(145deg,#041520,#073653)}.professional:after{background:transparent;border:2px solid #11aef1;border-radius:24px;box-shadow:0 0 30px #0cc0ff55}.professional b{background:#0da9e8;color:#00121d}
      .sitezi-model-body{padding:16px 18px 18px}.sitezi-model-body span{display:block;color:#5bb8ff;font-size:10px;font-weight:950;letter-spacing:1.2px}.sitezi-model-body h4{font-size:19px;margin:6px 0}.sitezi-model-body p{color:#91a3b8;min-height:42px;margin:0 0 14px;font-size:13px;line-height:1.5}
      .sitezi-model-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.sitezi-model-actions button,.sitezi-custom-model{min-height:42px;border-radius:11px;font-weight:900;cursor:pointer}
      .sitezi-model-see{border:1px solid #2d4563;background:#091522;color:#dfe9f5}.sitezi-model-use{border:1px solid #145bff;background:#0d48ef;color:#fff}
      .sitezi-custom-model{width:100%;margin:0 0 28px;border:1px dashed #31567f;background:#081421;color:#dcecff;padding:15px}
      .sitezi-preset-note{margin-bottom:14px;border:1px solid #1e5aa0;background:linear-gradient(135deg,#07172a,#0b1e33);border-radius:16px;padding:14px 16px;color:#ddecff}
      .sitezi-preset-note b{display:block}.sitezi-preset-note small{display:block;color:#8fa6bf;margin-top:4px;line-height:1.45}.sitezi-preset-note button{margin-top:10px;border:0;background:transparent;color:#68bfff;font-weight:900;cursor:pointer;padding:0}
      @media(max-width:690px){.sitezi-model-grid{grid-template-columns:1fr}.sitezi-model-preview{height:210px}.sitezi-model-head{padding-top:4px}.sitezi-model-modal{padding:12px}.sitezi-model-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }

  function presetById(id){ return PRESETS.find(x=>x.id===id); }

  function choosePreset(p){
    const s=state(); if(!s) return;
    s.businessType=p.business;
    s.template=p.id;
    s.step=2;
    document.querySelectorAll(".business").forEach(b=>b.classList.toggle("active",b.dataset.business===p.business));
    emit();
    document.querySelector(".sitezi-model-modal")?.remove();
    if(typeof window.SITEZI_SHOW_SCREEN==="function" && $("wizard")) window.SITEZI_SHOW_SCREEN($("wizard"));
    const next=$("nextBtn"); if(next) next.click(); // força refresh visual sem depender de API privada
    setTimeout(()=>{
      s.step=2;
      document.querySelectorAll(".step").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===2));
      if($("progressText")) $("progressText").textContent="2 de 8";
      if($("progressBar")) $("progressBar").style.width="25%";
      $("businessName")?.focus({preventScroll:true});
      updateWizardPresetNote();
      applyExamples();
    },30);
  }

  function clearPreset(){
    const s=state(); if(!s) return;
    if(presetById(s.template)) s.template="modern";
    document.querySelectorAll(".template-card").forEach(x=>x.classList.toggle("active",x.dataset.template==="modern"));
    emit(); updateWizardPresetNote();
  }

  function updateWizardPresetNote(){
    const step3=document.querySelector('.step[data-step="3"]');
    if(!step3) return;
    step3.querySelector(".sitezi-preset-note")?.remove();
    const s=state(), p=presetById(s?.template);
    const list=step3.querySelector(".template-list");
    if(!list) return;
    list.style.display=p?"none":"";
    if(p){
      const note=document.createElement("div");
      note.className="sitezi-preset-note";
      note.innerHTML=`<b>✓ Modelo escolhido: ${p.title}</b><small>A SITEZI usará esta família visual como base e criará uma variação própria para o seu negócio. Seus textos, produtos, fotos, cores e logo continuarão personalizados.</small><button type="button">Criar do meu jeito em vez disso</button>`;
      note.querySelector("button").onclick=clearPreset;
      list.before(note);
    }
  }

  function openGallery(){
    document.querySelector(".sitezi-model-modal")?.remove();
    const modal=document.createElement("div");
    modal.className="sitezi-model-modal";
    modal.innerHTML=`<div class="sitezi-model-shell">
      <div class="sitezi-model-head"><div><small style="color:#58b9ff;font-weight:950;letter-spacing:1.4px">MODELOS REAIS SITEZI</small><h2>Escolha uma base que combine com seu negócio.</h2><p>O modelo define a linguagem visual. Depois, a SITEZI adapta tudo com seus dados — e cria uma variação para evitar sites iguais.</p></div><button class="sitezi-model-close" aria-label="Fechar">×</button></div>
      <div class="sitezi-model-grid">${PRESETS.map(p=>`<article class="sitezi-model">
        <div class="sitezi-model-preview ${p.cls}"><div class="mini-nav"><span>${p.tag}</span><span>menu</span></div><div class="mini-copy"><small>${p.title.toUpperCase()}</small><h3>${p.headline}</h3><b>Saiba mais →</b></div></div>
        <div class="sitezi-model-body"><span>${p.tag}</span><h4>${p.title}</h4><p>${p.desc}</p><div class="sitezi-model-actions"><button class="sitezi-model-see" data-preview="${p.id}">Ver modelo</button><button class="sitezi-model-use" data-use="${p.id}">Usar este modelo</button></div></div>
      </article>`).join("")}</div>
      <button class="sitezi-custom-model" type="button">Prefiro criar do meu jeito →</button>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".sitezi-model-close").onclick=()=>modal.remove();
    modal.addEventListener("click",e=>{if(e.target===modal)modal.remove();});
    modal.querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>choosePreset(presetById(b.dataset.use)));
    modal.querySelectorAll("[data-preview]").forEach(b=>b.onclick=()=>{
      const card=b.closest(".sitezi-model"), preview=card?.querySelector(".sitezi-model-preview");
      preview?.animate([{transform:"scale(1)"},{transform:"scale(1.025)"},{transform:"scale(1)"}],{duration:420});
    });
    modal.querySelector(".sitezi-custom-model").onclick=()=>{
      clearPreset(); modal.remove();
      if(typeof window.SITEZI_SHOW_SCREEN==="function" && $("wizard")) window.SITEZI_SHOW_SCREEN($("wizard"));
    };
  }


  function applyExternalSelection(){
    const s=state(); if(!s) return;
    let presetId="";
    let custom=false;
    try{
      const params=new URLSearchParams(location.search);
      presetId=params.get("preset")||"";
      custom=params.get("custom")==="1";
      if(!presetId) presetId=localStorage.getItem("sitezi_model_preset")||"";
      if(!custom) custom=localStorage.getItem("sitezi_model_custom")==="1";
    }catch(_){}
    if(custom){
      try{
        localStorage.removeItem("sitezi_model_custom");
        localStorage.removeItem("sitezi_model_preset");
      }catch(_){}
      s.template="modern";
      emit();
      return;
    }
    const p=presetById(presetId);
    if(!p) return;
    s.businessType=p.business;
    s.template=p.id;
    document.querySelectorAll(".business").forEach(b=>b.classList.toggle("active",b.dataset.business===p.business));
    emit();
    try{
      localStorage.removeItem("sitezi_model_preset");
      localStorage.removeItem("sitezi_model_custom");
    }catch(_){}
    setTimeout(()=>{
      if(typeof window.SITEZI_SHOW_SCREEN==="function" && $("wizard")) window.SITEZI_SHOW_SCREEN($("wizard"));
      s.step=2;
      document.querySelectorAll(".step").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===2));
      if($("progressText")) $("progressText").textContent="2 de 8";
      if($("progressBar")) $("progressBar").style.width="25%";
      updateWizardPresetNote();
      applyExamples();
      $("businessName")?.focus({preventScroll:true});
    },80);
  }

  function install(){
    installStyle();
    $("seeExample")?.addEventListener("click",e=>{e.preventDefault();openGallery();},true);
    document.querySelector('a[href="#modelos"]')?.addEventListener("click",e=>{e.preventDefault();openGallery();},true);
    document.addEventListener("click",e=>{
      if(e.target?.closest?.(".business")||e.target?.closest?.("#nextBtn")||e.target?.closest?.("#backBtn")||e.target?.closest?.("#editSite")){
        setTimeout(()=>{applyExamples();updateWizardPresetNote();},120);
      }
      const t=e.target?.closest?.(".template-card");
      if(t && state()){ state().template=t.dataset.template; emit(); updateWizardPresetNote(); }
    });
    window.addEventListener("sitezi:builder-state",()=>{applyExamples();updateWizardPresetNote();});
    const obs=new MutationObserver(()=>{ if(document.querySelector('.step[data-step="3"].active')) updateWizardPresetNote(); });
    if($("wizard")) obs.observe($("wizard"),{attributes:true,subtree:true,attributeFilter:["class"]});
    applyExamples(); updateWizardPresetNote(); applyExternalSelection();
    window.SITEZI_TEMPLATE_SYSTEM={PRESETS,openGallery,presetById};
    document.documentElement.dataset.siteziTemplates="2.1";
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();
