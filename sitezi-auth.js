/* =========================================================
   SITEZI — AUTENTICAÇÃO + PUBLICAÇÃO v2.0
   - login/cadastro Supabase
   - salva dados estruturados do criador
   - publica em /site/<slug>
   - painel real "Gerenciar meu site"
   - imagens persistidas no Supabase Storage
   ========================================================= */
(async () => {
  "use strict";

  const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
  const SITE_BASE_URL = "https://sitezi.com.br/site";

  let createClient;
  try {
    ({ createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"));
  } catch (error) {
    console.error("[SITEZI AUTH] Não foi possível carregar o Supabase JS.", error);
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = id => document.getElementById(id);
  const clone = v => JSON.parse(JSON.stringify(v ?? null));
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[c]);

  let currentUser = null;
  let pendingPublish = null;
  let currentManagedSite = null;
  let managedProducts = [];

  function slugify(value) {
    return String(value || "meu-site")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "meu-site";
  }

  const style = document.createElement("style");
  style.id = "sitezi-auth-styles";
  style.textContent = `
    .sitezi-auth-modal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:18px;background:rgba(0,7,18,.82);backdrop-filter:blur(10px)}
    .sitezi-auth-modal.hidden{display:none}
    .sitezi-auth-card{width:min(520px,100%);max-height:92vh;overflow:auto;background:#07101d;border:1px solid #1d3150;border-radius:24px;padding:24px;color:#fff;box-shadow:0 28px 80px rgba(0,0,0,.48);font-family:Inter,Arial,sans-serif}
    .sitezi-auth-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px}
    .sitezi-auth-head strong{font-size:22px}.sitezi-auth-close{border:0;background:transparent;color:#9fb0c8;font-size:28px;cursor:pointer}
    .sitezi-auth-copy{color:#94a3b8;margin:0 0 18px;line-height:1.45}
    .sitezi-auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:#040914;border:1px solid #20304a;border-radius:14px;padding:4px;margin-bottom:18px}
    .sitezi-auth-tab{border:0;border-radius:10px;background:transparent;color:#91a0b7;padding:11px;font-weight:800;cursor:pointer}
    .sitezi-auth-tab.active{background:#123cca;color:#fff}
    .sitezi-auth-form{display:grid;gap:12px}.sitezi-auth-form.hidden{display:none}
    .sitezi-auth-form label,.sitezi-manage-field{display:grid;gap:6px;font-size:13px;color:#aebbd0}
    .sitezi-auth-form input,.sitezi-manage-field input,.sitezi-manage-field textarea,.sitezi-manage-field select,
    .sitezi-manage-item input,.sitezi-manage-item textarea{width:100%;box-sizing:border-box;border:1px solid #293c5a;background:#040a13;color:#fff;border-radius:12px;padding:12px 13px;outline:none}
    .sitezi-manage-field textarea,.sitezi-manage-item textarea{min-height:84px;resize:vertical}
    .sitezi-auth-submit{border:0;border-radius:13px;padding:14px 16px;background:#123fe8;color:#fff;font-weight:900;font-size:15px;cursor:pointer}
    .sitezi-auth-submit.secondary{background:#0c223c;border:1px solid #234a78}.sitezi-auth-submit:disabled{opacity:.6;cursor:wait}
    .sitezi-auth-message{min-height:22px;margin-top:12px;font-size:13px;line-height:1.4;color:#9fb0c8}
    .sitezi-auth-message.error{color:#ff8b8b}.sitezi-auth-message.ok{color:#72e6a1}
    .sitezi-auth-userbox{display:grid;gap:10px}.sitezi-auth-userbox.hidden{display:none}
    .sitezi-auth-email,.sitezi-site-summary{padding:13px;border:1px solid #253957;background:#040a13;border-radius:12px;color:#c8d3e4;overflow-wrap:anywhere}
    .sitezi-auth-logout{border:1px solid #344965;background:transparent;color:#fff;border-radius:12px;padding:12px;font-weight:800;cursor:pointer}
    .sitezi-manage-grid{display:grid;gap:12px}.sitezi-manage-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .sitezi-manage-list{display:grid;gap:10px;margin-top:10px}.sitezi-manage-item{border:1px solid #253957;border-radius:14px;padding:12px;background:#040a13;display:grid;gap:8px}
    .sitezi-manage-row{display:grid;grid-template-columns:1fr 140px;gap:8px}
    .sitezi-manage-photo{display:flex;gap:10px;align-items:center}.sitezi-manage-photo img{width:72px;height:72px;border-radius:10px;object-fit:cover;border:1px solid #29415f}
    .sitezi-public-link{display:block;color:#68baff;text-decoration:none;font-weight:800;overflow-wrap:anywhere}
    .sitezi-publish-card{display:grid;gap:12px;text-align:center}.sitezi-publish-card .sitezi-public-link{font-size:16px;padding:12px;border:1px solid #244d7d;border-radius:12px;background:#061527}
    @media(max-width:760px){.sitezi-auth-modal{align-items:end;padding:10px}.sitezi-auth-card{width:100%;border-radius:20px;padding:20px}.sitezi-manage-2,.sitezi-manage-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "siteziAuthModal";
  modal.className = "sitezi-auth-modal hidden";
  modal.innerHTML = `
    <div class="sitezi-auth-card" role="dialog" aria-modal="true">
      <div class="sitezi-auth-head">
        <strong>Sua conta SITEZI</strong>
        <button class="sitezi-auth-close" type="button" aria-label="Fechar">×</button>
      </div>
      <p class="sitezi-auth-copy">Entre ou crie sua conta sem perder o que você já configurou.</p>
      <div id="siteziAuthLoggedOut">
        <div class="sitezi-auth-tabs">
          <button class="sitezi-auth-tab active" data-auth-tab="login" type="button">Entrar</button>
          <button class="sitezi-auth-tab" data-auth-tab="signup" type="button">Criar conta</button>
        </div>
        <form id="siteziLoginForm" class="sitezi-auth-form">
          <label>E-mail<input id="siteziLoginEmail" type="email" autocomplete="email" required></label>
          <label>Senha<input id="siteziLoginPassword" type="password" autocomplete="current-password" required minlength="6"></label>
          <button class="sitezi-auth-submit" type="submit">Entrar na SITEZI</button>
        </form>
        <form id="siteziSignupForm" class="sitezi-auth-form hidden">
          <label>Seu nome<input id="siteziSignupName" type="text" autocomplete="name" required maxlength="80"></label>
          <label>E-mail<input id="siteziSignupEmail" type="email" autocomplete="email" required></label>
          <label>Senha<input id="siteziSignupPassword" type="password" autocomplete="new-password" required minlength="6"></label>
          <button class="sitezi-auth-submit" type="submit">Criar minha conta</button>
        </form>
      </div>
      <div id="siteziAuthLoggedIn" class="sitezi-auth-userbox hidden">
        <div class="sitezi-auth-email" id="siteziAuthEmail"></div>
        <button id="siteziManageSite" class="sitezi-auth-submit" type="button">Gerenciar meu site</button>
        <button id="siteziAuthContinue" class="sitezi-auth-submit secondary" type="button">Continuar →</button>
        <button id="siteziAuthLogout" class="sitezi-auth-logout" type="button">Sair da conta</button>
      </div>
      <div id="siteziAuthMessage" class="sitezi-auth-message"></div>
    </div>`;
  document.body.appendChild(modal);

  const manageModal = document.createElement("div");
  manageModal.id = "siteziManageModal";
  manageModal.className = "sitezi-auth-modal hidden";
  manageModal.innerHTML = `
    <div class="sitezi-auth-card" role="dialog" aria-modal="true">
      <div class="sitezi-auth-head">
        <strong>Gerenciar meu site</strong>
        <button id="siteziManageClose" class="sitezi-auth-close" type="button">×</button>
      </div>
      <div id="siteziManageBody"></div>
      <div id="siteziManageMessage" class="sitezi-auth-message"></div>
    </div>`;
  document.body.appendChild(manageModal);

  const publishModal = document.createElement("div");
  publishModal.id = "siteziPublishModal";
  publishModal.className = "sitezi-auth-modal hidden";
  publishModal.innerHTML = `
    <div class="sitezi-auth-card sitezi-publish-card" role="dialog" aria-modal="true">
      <div class="sitezi-auth-head"><strong>Seu site está publicado 🎉</strong><button id="siteziPublishClose" class="sitezi-auth-close" type="button">×</button></div>
      <p class="sitezi-auth-copy">Este é o endereço público do seu site. Alterações salvas no painel passam a aparecer nele.</p>
      <a id="siteziPublishedLink" class="sitezi-public-link" target="_blank" rel="noopener"></a>
      <button id="siteziOpenPublished" class="sitezi-auth-submit" type="button">Abrir meu site</button>
    </div>`;
  document.body.appendChild(publishModal);

  const message = $("siteziAuthMessage");
  function setMessage(text="", type=""){ if(message){message.textContent=text;message.className=`sitezi-auth-message${type?` ${type}`:""}`;} }
  function selectTab(mode){
    document.querySelectorAll(".sitezi-auth-tab").forEach(b=>b.classList.toggle("active",b.dataset.authTab===mode));
    $("siteziLoginForm")?.classList.toggle("hidden",mode!=="login");
    $("siteziSignupForm")?.classList.toggle("hidden",mode!=="signup");
    setMessage("");
  }
  function updateUI(){
    const out=$("siteziAuthLoggedOut"), inn=$("siteziAuthLoggedIn"), email=$("siteziAuthEmail");
    const label=currentUser?"Minha conta":"Fazer login";
    ["topLogin","wizardLogin"].forEach(id=>{ if($(id)) $(id).textContent=label; });
    if(currentUser){ out?.classList.add("hidden");inn?.classList.remove("hidden");if(email)email.textContent=currentUser.email||"Conta conectada"; }
    else { out?.classList.remove("hidden");inn?.classList.add("hidden"); }
    window.dispatchEvent(new CustomEvent("sitezi:auth-state",{detail:{user:currentUser,loggedIn:!!currentUser}}));
  }
  function openModal(mode="login"){ modal.classList.remove("hidden");document.body.style.overflow="hidden";if(!currentUser)selectTab(mode==="signup"?"signup":"login");updateUI(); }
  function closeModal(){ modal.classList.add("hidden");document.body.style.overflow=""; }

  function builderConfiguration(){
    const s=window.SITEZI_BUILDER_STATE||{};
    return {
      wizard_step:Number(s.step||1),
      slogan:s.slogan||$("businessSlogan")?.value?.trim()||"",
      color:s.color||"#1578ff",
      products:Array.isArray(s.products)?clone(s.products):[],
      whatsapp:s.whatsapp||$("whatsapp")?.value?.trim()||"",
      instagram:s.instagram||$("instagram")?.value?.trim()||"",
      email:s.email||$("email")?.value?.trim()||"",
      location:s.location||$("location")?.value?.trim()||"",
      logo_mode:s.logoMode||"text",
      logo_data:s.logoData||"",
      image_mode:s.imageMode||"none",
      photos:Array.isArray(s.photos)?clone(s.photos):[],
      ai_logo_generated:!!s.aiLogoGenerated,
      ai_image_generated:!!s.aiImageGenerated
    };
  }

  function builderPayload(status="draft"){
    const s=window.SITEZI_BUILDER_STATE||{};
    return {
      user_id:currentUser.id,
      business_name:s.businessName||$("businessName")?.value?.trim()||"Meu site",
      business_type:s.businessType||"Outro",
      template:s.template||"modern",
      status,
      configuration:builderConfiguration(),
      generated_content:{html:$("sitePreview")?.srcdoc||""},
      updated_at:new Date().toISOString()
    };
  }

  async function ensureSiteRow(){
    let id=sessionStorage.getItem("sitezi_current_site_id")||"";
    if(id){
      const {data}=await client.from("sites").select("id,status,slug").eq("id",id).eq("user_id",currentUser.id).maybeSingle();
      if(data?.id) return data;
    }
    const payload=builderPayload("draft");
    const {data,error}=await client.from("sites").insert(payload).select("id,status,slug").single();
    if(error) throw error;
    sessionStorage.setItem("sitezi_current_site_id",data.id);
    localStorage.setItem(`sitezi_last_site_${currentUser.id}`,data.id);
    return data;
  }

  function dataUrlMime(dataUrl){ const m=/^data:([^;,]+)/.exec(dataUrl||""); return m?.[1]||"image/jpeg"; }
  function extForMime(mime){ return mime.includes("png")?"png":mime.includes("webp")?"webp":mime.includes("gif")?"gif":"jpg"; }
  async function persistDataUrl(dataUrl, siteId, folder){
    if(!String(dataUrl||"").startsWith("data:image/")) return dataUrl||"";
    const mime=dataUrlMime(dataUrl), ext=extForMime(mime);
    const blob=await (await fetch(dataUrl)).blob();
    const path=`${currentUser.id}/${siteId}/${folder}/${crypto.randomUUID()}.${ext}`;
    const {error}=await client.storage.from("site-assets").upload(path,blob,{contentType:mime,upsert:false});
    if(error) throw error;
    return client.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
  }

  async function persistAssets(siteId, cfg){
    const out=clone(cfg);
    for(let i=0;i<(out.products||[]).length;i++){
      const p=out.products[i];
      if(p?.photo) p.photo=await persistDataUrl(p.photo,siteId,"products");
    }
    for(let i=0;i<(out.photos||[]).length;i++){
      out.photos[i]=await persistDataUrl(out.photos[i],siteId,"gallery");
    }
    if(out.logo_data) out.logo_data=await persistDataUrl(out.logo_data,siteId,"logo");
    const s=window.SITEZI_BUILDER_STATE;
    if(s){
      s.products=clone(out.products||[]);
      s.photos=clone(out.photos||[]);
      s.logoData=out.logo_data||"";
      window.dispatchEvent(new CustomEvent("sitezi:builder-state",{detail:clone(s)}));
    }
    return out;
  }

  async function saveCurrentSite({preserveStatus=true}={}){
    if(!currentUser) throw new Error("LOGIN_REQUIRED");
    const row=await ensureSiteRow();
    const raw=builderPayload(preserveStatus?row.status||"draft":"draft");
    raw.configuration=await persistAssets(row.id,raw.configuration);
    const {data,error}=await client.from("sites").update({
      business_name:raw.business_name,business_type:raw.business_type,template:raw.template,
      configuration:raw.configuration,generated_content:raw.generated_content,
      updated_at:new Date().toISOString()
    }).eq("id",row.id).eq("user_id",currentUser.id).select("id,status,slug").single();
    if(error) throw error;
    return data;
  }

  async function hasActivePlan(){
    const now=new Date().toISOString();
    const {data,error}=await client.from("subscriptions")
      .select("id").eq("user_id",currentUser.id).eq("status","active")
      .gt("current_period_end",now).limit(1).maybeSingle();
    if(error) console.warn("[SITEZI] Falha ao consultar plano.",error);
    return !!data;
  }

  async function publishCurrentSite(){
    if(!currentUser) throw new Error("LOGIN_REQUIRED");
    const saved=await saveCurrentSite();
    const s=window.SITEZI_BUILDER_STATE||{};
    let slug=slugify(s.businessName||$("businessName")?.value||"meu-site");
    for(let attempt=0;attempt<5;attempt++){
      const candidate=attempt===0?slug:`${slug}-${String(saved.id).slice(0,4+attempt)}`;
      const {data,error}=await client.from("sites").update({
        status:"published",slug:candidate,published_at:new Date().toISOString(),updated_at:new Date().toISOString()
      }).eq("id",saved.id).eq("user_id",currentUser.id).select("id,slug,status").single();
      if(!error){
        const url=`${SITE_BASE_URL}/${data.slug}`;
        showPublished(url);
        return { ...data, url };
      }
      if(error.code!=="23505") throw error;
    }
    throw new Error("Não foi possível gerar um endereço único para este site.");
  }

  function showPublished(url){
    const a=$("siteziPublishedLink"), b=$("siteziOpenPublished");
    if(a){a.href=url;a.textContent=url;}
    if(b)b.onclick=()=>window.open(url,"_blank","noopener");
    publishModal.classList.remove("hidden");document.body.style.overflow="hidden";
  }

  async function listMySites(){
    const {data,error}=await client.from("sites")
      .select("id,business_name,business_type,template,status,slug,configuration,updated_at,published_at")
      .eq("user_id",currentUser.id).order("updated_at",{ascending:false});
    if(error) throw error;
    return data||[];
  }

  function renderManagerSite(site, allSites){
    currentManagedSite=site;
    managedProducts=clone(site.configuration?.products||[]);
    const cfg=site.configuration||{};
    const options=allSites.map(x=>`<option value="${x.id}" ${x.id===site.id?"selected":""}>${esc(x.business_name||"Meu site")} — ${x.status==="published"?"Publicado":"Rascunho"}</option>`).join("");
    $("siteziManageBody").innerHTML=`
      <div class="sitezi-manage-grid">
        ${allSites.length>1?`<label class="sitezi-manage-field">Escolha o site<select id="siteziManageSiteSelect">${options}</select></label>`:""}
        ${site.status==="published"&&site.slug?`<div class="sitezi-site-summary">Site publicado:<br><a class="sitezi-public-link" href="${SITE_BASE_URL}/${esc(site.slug)}" target="_blank" rel="noopener">${SITE_BASE_URL}/${esc(site.slug)}</a></div>`:""}
        <div class="sitezi-manage-2">
          <label class="sitezi-manage-field">Nome do negócio<input id="mBusinessName" maxlength="120" value="${esc(site.business_name||"")}"></label>
          <label class="sitezi-manage-field">Tipo do negócio<input id="mBusinessType" maxlength="120" value="${esc(site.business_type||"")}"></label>
        </div>
        <label class="sitezi-manage-field">Slogan<input id="mSlogan" maxlength="180" value="${esc(cfg.slogan||"")}"></label>
        <div class="sitezi-manage-2">
          <label class="sitezi-manage-field">WhatsApp<input id="mWhatsapp" value="${esc(cfg.whatsapp||"")}"></label>
          <label class="sitezi-manage-field">Instagram<input id="mInstagram" value="${esc(cfg.instagram||"")}"></label>
          <label class="sitezi-manage-field">E-mail<input id="mEmail" type="email" value="${esc(cfg.email||"")}"></label>
          <label class="sitezi-manage-field">Cidade / atendimento<input id="mLocation" value="${esc(cfg.location||"")}"></label>
        </div>
        <div>
          <strong>Produtos e serviços</strong>
          <p class="sitezi-auth-copy" style="margin-top:6px">Altere nome, preço, descrição e foto. No site publicado, a atualização aparece após salvar.</p>
          <div id="siteziManageList" class="sitezi-manage-list"></div>
          <button id="siteziManageAdd" class="sitezi-auth-submit secondary" type="button" style="margin-top:10px;width:100%">+ Adicionar produto ou serviço</button>
        </div>
        <button id="siteziManageSave" class="sitezi-auth-submit" type="button">Salvar alterações</button>
      </div>`;
    renderManagedProducts();
    $("siteziManageSiteSelect")?.addEventListener("change",e=>{
      const next=allSites.find(x=>x.id===e.target.value);if(next)renderManagerSite(next,allSites);
    });
    $("siteziManageAdd")?.addEventListener("click",()=>{collectManagedProducts();managedProducts.push({name:"",price:"",description:"",photo:""});renderManagedProducts();});
    $("siteziManageSave")?.addEventListener("click",()=>saveManager(allSites));
  }

  function renderManagedProducts(){
    const list=$("siteziManageList");if(!list)return;
    if(!managedProducts.length){list.innerHTML=`<div class="sitezi-auth-email">Nenhum produto ou serviço cadastrado.</div>`;return;}
    list.innerHTML=managedProducts.map((p,i)=>`
      <div class="sitezi-manage-item">
        <div class="sitezi-manage-row">
          <input data-m-name="${i}" value="${esc(p.name||"")}" placeholder="Nome do produto ou serviço" maxlength="120">
          <input data-m-price="${i}" value="${esc(p.price||"")}" placeholder="Preço" maxlength="40">
        </div>
        <textarea data-m-desc="${i}" placeholder="Descrição" maxlength="500">${esc(p.description||"")}</textarea>
        <div class="sitezi-manage-photo">
          ${p.photo?`<img src="${esc(p.photo)}" alt="">`:""}
          <label class="sitezi-auth-submit secondary" style="padding:10px 12px;cursor:pointer">
            ${p.photo?"Trocar foto":"Adicionar foto"}<input data-m-photo="${i}" type="file" accept="image/*" hidden>
          </label>
        </div>
        <button data-m-remove="${i}" type="button" class="sitezi-auth-logout">Excluir item</button>
      </div>`).join("");
    list.querySelectorAll("[data-m-remove]").forEach(b=>b.onclick=()=>{collectManagedProducts();managedProducts.splice(Number(b.dataset.mRemove),1);renderManagedProducts();});
    list.querySelectorAll("[data-m-photo]").forEach(input=>input.onchange=e=>{
      const file=e.target.files?.[0];if(!file)return;
      const r=new FileReader();r.onload=()=>{collectManagedProducts();managedProducts[Number(input.dataset.mPhoto)].photo=r.result;renderManagedProducts();};r.readAsDataURL(file);
    });
  }

  function collectManagedProducts(){
    managedProducts=managedProducts.map((p,i)=>({
      ...p,
      name:document.querySelector(`[data-m-name="${i}"]`)?.value.trim()||"",
      price:document.querySelector(`[data-m-price="${i}"]`)?.value.trim()||"",
      description:document.querySelector(`[data-m-desc="${i}"]`)?.value.trim()||""
    })).filter(p=>p.name||p.price||p.description||p.photo);
  }

  async function saveManager(allSites){
    const msg=$("siteziManageMessage");collectManagedProducts();
    try{
      if(msg){msg.textContent="Salvando alterações...";msg.className="sitezi-auth-message";}
      const cfg=clone(currentManagedSite.configuration||{});
      cfg.slogan=$("mSlogan")?.value.trim()||"";
      cfg.whatsapp=$("mWhatsapp")?.value.trim()||"";
      cfg.instagram=$("mInstagram")?.value.trim()||"";
      cfg.email=$("mEmail")?.value.trim()||"";
      cfg.location=$("mLocation")?.value.trim()||"";
      cfg.products=await persistAssets(currentManagedSite.id,{...cfg,products:managedProducts}).then(x=>x.products||[]);
      const {data,error}=await client.from("sites").update({
        business_name:$("mBusinessName")?.value.trim()||"Meu site",
        business_type:$("mBusinessType")?.value.trim()||"Outro",
        configuration:cfg,updated_at:new Date().toISOString()
      }).eq("id",currentManagedSite.id).eq("user_id",currentUser.id)
        .select("id,business_name,business_type,template,status,slug,configuration,updated_at,published_at").single();
      if(error)throw error;
      currentManagedSite=data;
      const idx=allSites.findIndex(x=>x.id===data.id);if(idx>=0)allSites[idx]=data;
      if(sessionStorage.getItem("sitezi_current_site_id")===data.id){
        const s=window.SITEZI_BUILDER_STATE;if(s){s.businessName=data.business_name;s.businessType=data.business_type;s.products=clone(cfg.products);s.slogan=cfg.slogan;s.whatsapp=cfg.whatsapp;s.instagram=cfg.instagram;s.email=cfg.email;s.location=cfg.location;}
      }
      if(msg){msg.textContent=data.status==="published"?"✓ Alterações salvas. Seu site publicado já usa os dados novos.":"✓ Alterações salvas no rascunho.";msg.className="sitezi-auth-message ok";}
      renderManagerSite(data,allSites);
    }catch(e){console.error(e);if(msg){msg.textContent="Não foi possível salvar agora.";msg.className="sitezi-auth-message error";}}
  }

  async function openManage(){
    if(!currentUser)return openModal("login");
    modal.classList.add("hidden");manageModal.classList.remove("hidden");document.body.style.overflow="hidden";
    $("siteziManageBody").innerHTML=`<div class="sitezi-auth-email">Carregando seus sites...</div>`;
    try{
      const sites=await listMySites();
      if(!sites.length){
        $("siteziManageBody").innerHTML=`<div class="sitezi-auth-email">Você ainda não possui um site salvo. Crie seu primeiro site e ele aparecerá aqui.</div>`;
        return;
      }
      const known=sessionStorage.getItem("sitezi_current_site_id");
      renderManagerSite(sites.find(s=>s.id===known)||sites[0],sites);
    }catch(e){$("siteziManageBody").innerHTML=`<div class="sitezi-auth-email">Não foi possível carregar seus sites agora.</div>`;}
  }

  async function publishFlow(original){
    if(!currentUser){pendingPublish=()=>publishFlow(original);openModal("signup");return;}
    try{
      const active=await hasActivePlan();
      if(!active){
        await saveCurrentSite();
        if(typeof original==="function") original();
        return;
      }
      await publishCurrentSite();
    }catch(e){console.error("[SITEZI PUBLISH]",e);alert(e?.message||"Não foi possível publicar agora.");}
  }

  function protectPublishButton(id){
    const button=$(id);if(!button||button.dataset.siteziPublishV2==="1")return;
    const original=typeof button.onclick==="function"?button.onclick:null;
    button.onclick=function(event){
      event?.preventDefault?.();
      publishFlow(()=>original?.call(button,event));
    };
    button.dataset.siteziPublishV2="1";
  }

  function friendlyError(error){
    const text=String(error?.message||"").toLowerCase();
    if(text.includes("invalid login credentials"))return"E-mail ou senha incorretos.";
    if(text.includes("user already registered"))return"Este e-mail já possui uma conta.";
    if(text.includes("email not confirmed"))return"Confirme seu e-mail antes de entrar.";
    return error?.message||"Não foi possível concluir.";
  }

  document.querySelectorAll(".sitezi-auth-tab").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.authTab)));
  $("siteziLoginForm")?.addEventListener("submit",async e=>{
    e.preventDefault();setMessage("Entrando...");
    const {data,error}=await client.auth.signInWithPassword({email:$("siteziLoginEmail").value.trim(),password:$("siteziLoginPassword").value});
    if(error)return setMessage(friendlyError(error),"error");
    currentUser=data.user;updateUI();setMessage("Conta conectada.","ok");
    if(pendingPublish){const fn=pendingPublish;pendingPublish=null;closeModal();await fn();}
  });
  $("siteziSignupForm")?.addEventListener("submit",async e=>{
    e.preventDefault();setMessage("Criando sua conta...");
    const email=$("siteziSignupEmail").value.trim();
    const {data,error}=await client.auth.signUp({email,password:$("siteziSignupPassword").value,options:{data:{display_name:$("siteziSignupName").value.trim()}}});
    if(error)return setMessage(friendlyError(error),"error");
    if(data.session){currentUser=data.user;updateUI();setMessage("Conta criada.","ok");if(pendingPublish){const fn=pendingPublish;pendingPublish=null;closeModal();await fn();}}
    else{selectTab("login");$("siteziLoginEmail").value=email;setMessage("Conta criada. Confirme seu e-mail e depois entre.","ok");}
  });
  $("siteziAuthLogout")?.addEventListener("click",async()=>{await client.auth.signOut();currentUser=null;pendingPublish=null;sessionStorage.removeItem("sitezi_current_site_id");updateUI();closeModal();});
  $("siteziAuthContinue")?.addEventListener("click",()=>{if(pendingPublish){const fn=pendingPublish;pendingPublish=null;closeModal();fn();}else closeModal();});
  $("siteziManageSite")?.addEventListener("click",openManage);
  $("siteziManageClose")?.addEventListener("click",()=>{manageModal.classList.add("hidden");document.body.style.overflow="";});
  $("siteziPublishClose")?.addEventListener("click",()=>{publishModal.classList.add("hidden");document.body.style.overflow="";});
  modal.querySelector(".sitezi-auth-close")?.addEventListener("click",closeModal);
  modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});

  window.SITEZI_AUTH={
    openLogin:openModal,close:closeModal,getUser:()=>currentUser,getClient:()=>client,isLoggedIn:()=>!!currentUser,
    saveCurrentSite,publishCurrentSite,openManage,listMySites
  };
  window.addEventListener("sitezi:open-login",e=>openModal(e.detail?.mode||"login"));

  const {data}=await client.auth.getSession();
  currentUser=data.session?.user||null;updateUI();

  // Dá tempo para script.js instalar os onclick originais antes de protegê-los.
  setTimeout(()=>{protectPublishButton("publishSite");protectPublishButton("publishFromPreview");},0);

  client.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;updateUI();});
  document.documentElement.dataset.siteziAuth="2.0";
  console.info("[SITEZI] Auth/Publicação v2.0 carregado.");
})();
