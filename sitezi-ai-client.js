/* =========================================================
   SITEZI — DIRETOR IA v5.0
   - IA focada em layout, identidade, textos e logo
   - Stability usada somente para logo quando o cliente não envia uma
   - nenhuma imagem hero é gerada automaticamente
   - níveis visuais por plano + carteira única de créditos
   - falha da IA nunca gera site genérico silenciosamente
   ========================================================= */
(() => {
  "use strict";
  const SUPABASE_URL="https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_KEY="sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const ENDPOINT=`${SUPABASE_URL}/functions/v1/sitezi-ai`;
  const $=id=>document.getElementById(id);
  const clean=(v,max=500)=>String(v??"").trim().replace(/\s{3,}/g," ").slice(0,max);
  const state=()=>window.SITEZI_BUILDER_STATE||(window.SITEZI_BUILDER_STATE={});
  let clientPromise=null,baseGenerate=null,installed=false,accountInfo=null;

  async function getClient(){
    if(!clientPromise) clientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(m=>m.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}));
    return clientPromise;
  }
  async function getSession(){
    const sb=await getClient(); const {data,error}=await sb.auth.getSession();
    if(error) throw new Error("Não foi possível verificar sua sessão.");
    if(!data.session?.access_token){const e=new Error("Entre na sua conta SITEZI para gerar o site com IA.");e.code="AUTH_REQUIRED";throw e}
    return data.session;
  }
  function collectProducts(){const s=state();return Array.isArray(s.products)?s.products.slice(0,30).map(p=>({name:clean(p?.name,90),price:clean(p?.price,40),description:clean(p?.description,260)})):[]}
  function buildBrief(){const s=state();return{mode:"director",businessType:clean(s.businessType||document.querySelector(".business.active")?.dataset.business||"Outro",80),businessName:clean(s.businessName||$("businessName")?.value,80),slogan:clean(s.slogan||$("businessSlogan")?.value,180),services:clean($("servicesInput")?.value,1200),products:collectProducts(),template:clean(s.template||document.querySelector(".template-card.active")?.dataset.template||"modern",60),color:clean(s.color,24),location:clean(s.location,120),instagram:clean(s.instagram,120),whatsapp:clean(s.whatsapp||$("whatsapp")?.value,40),customerDescription:clean(s.description||$("businessDescription")?.value||$("descriptionInput")?.value||"",1800),hasLogo:!!s.logoData,hasPhotos:Array.isArray(s.photos)&&s.photos.length>0,siteId:sessionStorage.getItem("sitezi_current_site_id")||null}}
  function currentPlan(){return String(accountInfo?.plan||window.SITEZI_ACCOUNT_STATE?.getInfo?.()?.plan||"").toLowerCase()}
  function planCost(){const p=currentPlan();if(p.includes("master"))return 25;if(p.includes("premium"))return 20;if(p.includes("profissional"))return 15;if(p.includes("básico")||p.includes("basico"))return 10;return null}

  async function callDirector(){
    const session=await getSession(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
    try{
      const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(buildBrief()),signal:controller.signal});
      const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{throw new Error("A IA respondeu em formato inválido.")}
      if(!response.ok||data?.ok===false){const e=new Error(data?.error||`Erro ${response.status} ao consultar a IA.`);e.code=data?.reason||data?.code||"AI_ERROR";e.details=data;throw e}
      return data;
    }finally{clearTimeout(timeout)}
  }

  function prepareFlow(){
    const logoAI=document.querySelector('[data-logo-mode="ai"]'),imageAI=document.querySelector('[data-image-mode="ai"]');
    if(logoAI)logoAI.style.display="none";if(imageAI)imageAI.style.display="none";
    const s6=document.querySelector('.step[data-step="6"]'),s7=document.querySelector('.step[data-step="7"]'),s8=document.querySelector('.step[data-step="8"]');
    if(s6){const h=s6.querySelector(".step-copy h2"),p=s6.querySelector(".step-copy p"),b=s6.querySelector('[data-logo-mode="text"] b'),sm=s6.querySelector('[data-logo-mode="text"] small');if(h)h.textContent="Você já tem uma logo?";if(p)p.textContent="Envie sua logo se tiver. Se não tiver, a SITEZI cria um símbolo de marca de acordo com o seu segmento.";if(b)b.textContent="Não tenho logo";if(sm)sm.textContent="A IA criará uma logo simples e adequada à identidade do site."}
    if(s7){const h=s7.querySelector(".step-copy h2"),p=s7.querySelector(".step-copy p"),b=s7.querySelector('[data-image-mode="none"] b'),sm=s7.querySelector('[data-image-mode="none"] small');if(h)h.textContent="Você tem fotos do seu negócio?";if(p)p.textContent="Envie fotos reais se quiser usá-las. A SITEZI não cria fotos aleatórias automaticamente.";if(b)b.textContent="Não tenho fotos";if(sm)sm.textContent="Sem problema. O layout será criado com identidade visual, formas, cores e tipografia, sem inventar imagens."}
    if(s8){const h=s8.querySelector(".step-copy h2"),p=s8.querySelector(".step-copy p"),btn=$("generateSite");if(h)h.textContent="Tudo pronto para criar seu site.";if(p)p.textContent="O Diretor IA vai organizar layout, identidade visual e textos. Se você não enviou uma logo, ele também cria o símbolo da marca.";if(btn)btn.innerHTML="Gerar meu site com IA <b>✦</b>";if(!s8.querySelector(".sitezi-director-cost-note")){const n=document.createElement("div");n.className="sitezi-director-cost-note sitezi-ai-plan-note";n.textContent="Nenhuma foto é gerada automaticamente. O custo será confirmado antes da criação.";btn?.insertAdjacentElement("afterend",n)}}
  }

  function mergePlan(plan,assets){
    const s=state(),d=plan?.design||{},c=plan?.content||{};const allowed=new Set(["modern","premium","dynamic","barber-signature","restaurant-flavor","fashion-urban","beauty-essence","auto-drive","professional-neo"]);
    if(allowed.has(d.template))s.template=d.template;if(/^#[0-9a-f]{6}$/i.test(d.primaryColor||""))s.color=d.primaryColor;if(c.businessName&&!s.businessName)s.businessName=clean(c.businessName,80);if(c.slogan)s.slogan=clean(c.slogan,180);
    const existing=Array.isArray(s.products)?s.products:[];
    if(Array.isArray(c.services)&&c.services.length){if(!existing.some(p=>clean(p?.name)))s.products=c.services.slice(0,12).map(x=>({name:clean(x?.title,90),price:"",description:clean(x?.description,260),photo:""})).filter(x=>x.name);else s.products=existing.map((p,i)=>({...p,name:p.name||clean(c.services[i]?.title,90),description:p.description||clean(c.services[i]?.description,260)}))}
    if(assets?.logo&&!s.logoData){s.logoData=assets.logo;s.logoMode="upload";s.aiLogoGenerated=true}
    s.aiDirector={version:"5.0",generatedAt:new Date().toISOString(),design:d,content:c,sections:Array.isArray(plan?.sections)?plan.sections:[],safety:plan?.safety||{},assetWarnings:assets?.warnings||[]};
  }

  const replaceText=(el,v)=>{const t=clean(v,1200);if(el&&t)el.textContent=t};
  function applyVisualDirection(doc,design){
    if(!doc?.head||!design)return;doc.getElementById("sitezi-director-visual-v5")?.remove();
    const effect=String(design.effect||"clean"),accent=/^#[0-9a-f]{6}$/i.test(design.primaryColor||"")?design.primaryColor:"#1578ff";
    const st=doc.createElement("style");st.id="sitezi-director-visual-v5";let extra="";
    if(effect==="neon-soft")extra=`.eyebrow,.hero h1 strong{color:${accent}!important;text-shadow:0 0 22px ${accent}55}.btn{box-shadow:0 0 26px ${accent}35}.hero-fallback,.service-fallback{background:radial-gradient(circle at 72% 24%,${accent}26,transparent 32%),linear-gradient(145deg,var(--card),var(--soft))!important}`;
    else if(effect==="glass")extra=`.service-card,.panel,.contact-card{backdrop-filter:blur(15px);box-shadow:0 18px 55px rgba(0,0,0,.16)}`;
    else if(effect==="contrast")extra=`.hero h1{font-weight:950}.service-card{box-shadow:0 18px 55px rgba(0,0,0,.28)}`;
    else if(effect==="gold")extra=`.eyebrow{letter-spacing:3px}.service-card{box-shadow:0 18px 55px rgba(0,0,0,.22)}`;
    else if(effect==="soft")extra=`.service-card,.contact-card,.panel{box-shadow:0 16px 45px rgba(70,20,45,.10)}`;
    else if(effect==="vivid")extra=`.btn{box-shadow:0 12px 34px ${accent}33}.hero h1{letter-spacing:-3px}`;
    st.textContent=`:root{--sitezi-director-accent:${accent}}${extra}`;doc.head.appendChild(st);
  }
  function applyContent(doc,plan){if(!doc||!plan)return;const c=plan.content||{};replaceText(doc.querySelector(".hero h1"),c.heroTitle||c.slogan);replaceText(doc.querySelector(".hero p"),c.heroText);replaceText(doc.querySelector("#sobre p"),c.about);const cards=[...doc.querySelectorAll("#servicos .service-card, #servicos .services article")];if(Array.isArray(c.services))cards.forEach((card,i)=>{const x=c.services[i];if(!x)return;replaceText(card.querySelector("h3"),x.title);replaceText(card.querySelector("p"),x.description)});if(Array.isArray(c.trustPoints)){const ts=[...doc.querySelectorAll(".trustitem b, .trust-item b")];ts.forEach((el,i)=>c.trustPoints[i]&&replaceText(el,c.trustPoints[i]))}if(c.cta)[...doc.querySelectorAll(".hero .btn, #contato .btn, .contact .btn")].forEach((el,i)=>{if(i===0||el.textContent?.includes("→"))el.textContent=`${clean(c.cta,80)} →`});applyVisualDirection(doc,plan.design||{});doc.documentElement.dataset.siteziDirector="5.0"}
  async function enrichPreview(plan){const f=$("sitePreview");if(!f)return;await new Promise(r=>{let d=false;const done=()=>{if(d)return;d=true;f.removeEventListener("load",done);r()};f.addEventListener("load",done,{once:true});setTimeout(done,5000)});const doc=f.contentDocument;if(!doc)return;applyContent(doc,plan);f.srcdoc="<!doctype html>\n"+doc.documentElement.outerHTML}
  function setLoading(btn,on){if(!btn)return;if(on){if(!btn.dataset.siteziDirectorOriginal)btn.dataset.siteziDirectorOriginal=btn.innerHTML;btn.disabled=true;btn.innerHTML="Edu está criando seu site... <b>✦</b>"}else{btn.disabled=false;if(btn.dataset.siteziDirectorOriginal)btn.innerHTML=btn.dataset.siteziDirectorOriginal}}
  function openLogin(){if(typeof window.SITEZI_AUTH?.openLogin==="function")return window.SITEZI_AUTH.openLogin("login");window.dispatchEvent(new CustomEvent("sitezi:open-login",{detail:{mode:"login"}}))}
  function openPlans(m){if(m)alert(m);if(typeof window.SITEZI_SHOW_SCREEN==="function"&&$("plans"))window.SITEZI_SHOW_SCREEN($("plans"))}
  async function handleGenerate(event,btn){event?.preventDefault();const cost=planCost();if(cost!=null&&!confirm(`A criação usará ${cost} créditos SITEZI. Inclui direção visual, organização dos textos e criação de logo quando necessária. Nenhuma foto será gerada automaticamente. Deseja continuar?`))return;setLoading(btn,true);try{const data=await callDirector();mergePlan(data.generated,data.assets||{});if(typeof baseGenerate!=="function")throw new Error("O gerador principal do SITEZI não foi encontrado.");await baseGenerate.call(btn,event);await enrichPreview(data.generated);window.dispatchEvent(new CustomEvent("sitezi:credits-changed",{detail:{kind:"site",remaining:data.remainingCredits,cost:data.cost}}));try{await window.SITEZI_ACCOUNT_STATE?.refresh?.()}catch(_){}if(data.assets?.warnings?.length)console.warn("[SITEZI DIRETOR]",data.assets.warnings)}catch(error){console.error("[SITEZI DIRETOR]",error);if(error?.name==="AbortError")alert("A criação demorou mais que o esperado e foi interrompida. Nenhum site genérico foi gerado.");else if(error?.code==="AUTH_REQUIRED"||error?.code==="invalid_session")openLogin();else if(error?.code==="plan_not_allowed"||error?.code==="subscription_required")openPlans(error.message);else if(error?.code==="no_credits")alert(error.message||"Você não possui créditos suficientes.");else{const d=error?.details?.providerCode?`\nCódigo: ${error.details.providerCode}`:"";alert(`${error?.message||"O Diretor IA não conseguiu concluir esta criação."}${d}\n\nNenhum site genérico foi gerado e, se houve cobrança, os créditos foram devolvidos.`)}}finally{setLoading(btn,false)}}
  function install(){if(installed)return;const btn=$("generateSite");if(!btn)return;prepareFlow();baseGenerate=btn.onclick;btn.onclick=e=>handleGenerate(e,btn);installed=true;document.documentElement.dataset.siteziDirectorClient="5.0"}
  window.addEventListener("sitezi:account-info",e=>{accountInfo=e.detail||null});window.addEventListener("load",()=>setTimeout(install,0),{once:true});if(document.readyState==="complete")setTimeout(install,0);
})();
