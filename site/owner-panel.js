/* =========================================================
   SITEZI — PAINEL DO PROPRIETÁRIO v1.0
   - Só aparece para o dono do site autenticado
   - Exige assinatura ativa para editar/publicar
   - Edita produtos/serviços, preços, descrições e fotos
   - Gerencia a galeria do site
   - Salva rascunho separado do conteúdo público
   - Publica somente quando o proprietário confirma
   ========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tmhosrhnwjertbsempeu.supabase.co";
const SUPABASE_KEY = "sb_publishable_Gx-4spNVicrUfn3Pd8GxCg_7ii-70Lw";
const BUCKET = "site-assets";
const MAX_GALLERY = 12;
const MAX_FILE_MB = 8;

const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const $ = id => document.getElementById(id);
const clone = value => {
  try { return structuredClone(value); }
  catch (_) { return JSON.parse(JSON.stringify(value ?? null)); }
};
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
})[c]);

const parts = location.pathname.split("/").filter(Boolean);
const slug = (
  new URLSearchParams(location.search).get("slug") ||
  parts[parts.indexOf("site") + 1] ||
  ""
).toLowerCase().trim();

let currentUser = null;
let currentSite = null;
let draftConfig = null;
let subscription = null;
let dirty = false;
let removedAssetUrls = new Set();

function injectStyles() {
  if ($("sitezi-owner-panel-style")) return;

  const style = document.createElement("style");
  style.id = "sitezi-owner-panel-style";
  style.textContent = `
    .sitezi-owner-btn{
      position:fixed;left:16px;bottom:16px;z-index:100500;
      display:none;align-items:center;gap:9px;min-height:50px;
      padding:10px 16px;border:1px solid #2b69ad;border-radius:999px;
      background:linear-gradient(135deg,#0a65ff,#0745c7);color:#fff;
      box-shadow:0 18px 46px rgba(0,0,0,.38);
      font:900 13px Inter,system-ui,sans-serif;cursor:pointer;
      -webkit-tap-highlight-color:transparent
    }
    .sitezi-owner-btn.visible{display:inline-flex}
    .sitezi-owner-btn svg{width:20px;height:20px}
    .sitezi-owner-btn small{font-size:10px;font-weight:750;opacity:.78}

    .sitezi-owner-overlay{
      position:fixed;inset:0;z-index:100700;display:grid;place-items:center;
      padding:16px;background:rgba(0,5,14,.86);backdrop-filter:blur(12px);
      font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
    }
    .sitezi-owner-overlay.hidden{display:none}
    .sitezi-owner-shell{
      width:min(980px,100%);max-height:94dvh;display:grid;
      grid-template-rows:auto auto 1fr auto;overflow:hidden;
      border:1px solid #244360;border-radius:24px;background:#07111d;color:#f7fbff;
      box-shadow:0 34px 100px rgba(0,0,0,.55)
    }
    .sitezi-owner-head{
      display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
      padding:18px 20px;border-bottom:1px solid #17304a;background:#081522
    }
    .sitezi-owner-head h2{margin:0;font-size:22px;letter-spacing:-.5px}
    .sitezi-owner-head p{margin:5px 0 0;color:#8ea3ba;font-size:12px;line-height:1.4}
    .sitezi-owner-close{
      width:40px;height:40px;flex:0 0 auto;border:1px solid #2b4765;border-radius:50%;
      background:#0b1a2a;color:#fff;font-size:24px;cursor:pointer
    }

    .sitezi-owner-tabs{
      display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid #162b41;
      background:#06101a;overflow:auto
    }
    .sitezi-owner-tab{
      flex:0 0 auto;border:1px solid #24415f;border-radius:999px;
      background:#0a1826;color:#9fb2c8;padding:9px 13px;font-weight:850;font-size:12px;cursor:pointer
    }
    .sitezi-owner-tab.active{background:#0d56dc;border-color:#2d7bf1;color:#fff}

    .sitezi-owner-body{overflow:auto;padding:16px}
    .sitezi-owner-pane{display:none}
    .sitezi-owner-pane.active{display:block}
    .sitezi-owner-note{
      margin-bottom:14px;padding:12px 14px;border:1px solid #1d466c;border-radius:14px;
      background:#071d31;color:#b8d6f4;font-size:12px;line-height:1.5
    }

    .sitezi-owner-grid{display:grid;gap:12px}
    .sitezi-owner-item{
      display:grid;grid-template-columns:92px minmax(0,1fr) auto;gap:12px;align-items:start;
      padding:14px;border:1px solid #1d334a;border-radius:16px;background:#091725
    }
    .sitezi-owner-thumb{
      width:92px;height:92px;border-radius:12px;object-fit:cover;
      border:1px solid #2a4663;background:#07111d
    }
    .sitezi-owner-placeholder{
      width:92px;height:92px;display:grid;place-items:center;border-radius:12px;
      border:1px dashed #36526f;color:#7791aa;background:#07111d;font-size:10px;text-align:center;padding:8px
    }
    .sitezi-owner-fields{display:grid;grid-template-columns:1fr 180px;gap:9px}
    .sitezi-owner-fields .full{grid-column:1/-1}
    .sitezi-owner-field{display:grid;gap:5px}
    .sitezi-owner-field span{font-size:10px;color:#8297ad;font-weight:850;text-transform:uppercase;letter-spacing:.45px}
    .sitezi-owner-field input,.sitezi-owner-field textarea{
      width:100%;box-sizing:border-box;border:1px solid #28435f;border-radius:11px;
      background:#06111c;color:#fff;padding:10px 11px;outline:none;font:650 13px Inter,system-ui,sans-serif
    }
    .sitezi-owner-field textarea{min-height:72px;resize:vertical}
    .sitezi-owner-field input:focus,.sitezi-owner-field textarea:focus{
      border-color:#2c84f5;box-shadow:0 0 0 3px rgba(44,132,245,.12)
    }
    .sitezi-owner-file{
      display:inline-flex;align-items:center;justify-content:center;min-height:38px;
      padding:8px 10px;border:1px solid #28527e;border-radius:10px;background:#0a2036;
      color:#cce7ff;font-size:11px;font-weight:850;cursor:pointer
    }
    .sitezi-owner-file input{display:none}
    .sitezi-owner-remove{
      border:1px solid #603242;border-radius:10px;background:#201117;color:#ff9bab;
      padding:9px 10px;font-size:11px;font-weight:850;cursor:pointer
    }

    .sitezi-owner-add{
      width:100%;min-height:48px;margin-top:12px;border:1px dashed #346da7;border-radius:14px;
      background:#081b2d;color:#77beff;font-weight:900;cursor:pointer
    }

    .sitezi-gallery-grid{
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px
    }
    .sitezi-gallery-card{
      position:relative;aspect-ratio:4/3;border:1px solid #263f59;border-radius:14px;
      overflow:hidden;background:#07111c
    }
    .sitezi-gallery-card img{width:100%;height:100%;object-fit:cover}
    .sitezi-gallery-card button{
      position:absolute;right:7px;top:7px;width:32px;height:32px;border:0;border-radius:50%;
      background:rgba(10,10,14,.78);color:#fff;font-size:18px;cursor:pointer
    }
    .sitezi-gallery-main{
      position:absolute;left:7px;bottom:7px;padding:5px 8px;border-radius:999px;
      background:rgba(5,10,17,.82);color:#fff;font-size:9px;font-weight:900
    }
    .sitezi-gallery-upload{
      min-height:120px;display:grid;place-items:center;text-align:center;padding:18px;
      border:1px dashed #346da7;border-radius:14px;background:#081b2d;color:#9fd0ff;
      cursor:pointer
    }
    .sitezi-gallery-upload input{display:none}
    .sitezi-gallery-upload b{display:block}
    .sitezi-gallery-upload small{display:block;margin-top:5px;color:#7f99b2}

    .sitezi-owner-status{
      min-height:20px;padding:0 18px 8px;color:#89a1ba;font-size:11px
    }
    .sitezi-owner-status.ok{color:#73e3ac}
    .sitezi-owner-status.error{color:#ff9292}

    .sitezi-owner-actions{
      display:flex;align-items:center;justify-content:flex-end;gap:9px;
      padding:14px 16px;border-top:1px solid #17304a;background:#081522
    }
    .sitezi-owner-action{
      min-height:43px;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer
    }
    .sitezi-owner-action.secondary{border:1px solid #31506e;background:#0a1826;color:#e5eff9}
    .sitezi-owner-action.primary{border:1px solid #2d79ee;background:#0c58e7;color:#fff}
    .sitezi-owner-action:disabled{opacity:.55;cursor:wait}

    .sitezi-owner-locked{
      padding:22px;border:1px solid #5d4723;border-radius:16px;
      background:#1c1609;color:#f6deb0;line-height:1.6
    }
    .sitezi-owner-locked a{color:#77bdff;font-weight:900}

    @media(max-width:760px){
      .sitezi-owner-overlay{align-items:end;padding:8px}
      .sitezi-owner-shell{width:100%;max-height:95dvh;border-radius:20px}
      .sitezi-owner-item{grid-template-columns:72px minmax(0,1fr)}
      .sitezi-owner-thumb,.sitezi-owner-placeholder{width:72px;height:72px}
      .sitezi-owner-item>.sitezi-owner-remove{grid-column:1/-1}
      .sitezi-owner-fields{grid-template-columns:1fr}
      .sitezi-owner-fields .full{grid-column:auto}
      .sitezi-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .sitezi-owner-actions{display:grid;grid-template-columns:1fr 1fr}
      .sitezi-owner-action.primary{grid-column:1/-1}
      .sitezi-owner-btn{left:12px;bottom:12px;min-height:46px;padding:9px 13px}
    }
  `;
  document.head.appendChild(style);
}

function ensureUI() {
  injectStyles();

  if (!$("siteziOwnerButton")) {
    const button = document.createElement("button");
    button.id = "siteziOwnerButton";
    button.className = "sitezi-owner-btn";
    button.type = "button";
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
      </svg>
      <span>Editar meu site</span>`;
    button.addEventListener("click", openPanel);
    document.body.appendChild(button);
  }

  if (!$("siteziOwnerPanel")) {
    const overlay = document.createElement("div");
    overlay.id = "siteziOwnerPanel";
    overlay.className = "sitezi-owner-overlay hidden";
    overlay.innerHTML = `
      <section class="sitezi-owner-shell" role="dialog" aria-modal="true" aria-labelledby="siteziOwnerTitle">
        <header class="sitezi-owner-head">
          <div>
            <h2 id="siteziOwnerTitle">Gerenciar meu site</h2>
            <p id="siteziOwnerSubtitle">Altere seu conteúdo sem mexer no layout do site.</p>
          </div>
          <button id="siteziOwnerClose" class="sitezi-owner-close" type="button" aria-label="Fechar">×</button>
        </header>

        <nav class="sitezi-owner-tabs">
          <button class="sitezi-owner-tab active" data-owner-tab="products" type="button">Produtos / Serviços</button>
          <button class="sitezi-owner-tab" data-owner-tab="photos" type="button">Fotos do site</button>
        </nav>

        <div class="sitezi-owner-body">
          <section id="siteziOwnerProducts" class="sitezi-owner-pane active"></section>
          <section id="siteziOwnerPhotos" class="sitezi-owner-pane"></section>
        </div>

        <div>
          <div id="siteziOwnerStatus" class="sitezi-owner-status"></div>
          <footer class="sitezi-owner-actions">
            <button id="siteziOwnerPreview" class="sitezi-owner-action secondary" type="button">Pré-visualizar</button>
            <button id="siteziOwnerSaveDraft" class="sitezi-owner-action secondary" type="button">Salvar rascunho</button>
            <button id="siteziOwnerPublish" class="sitezi-owner-action primary" type="button">Publicar alterações</button>
          </footer>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    $("siteziOwnerClose")?.addEventListener("click", closePanel);
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closePanel();
    });

    overlay.querySelectorAll("[data-owner-tab]").forEach(btn => {
      btn.addEventListener("click", () => selectTab(btn.dataset.ownerTab));
    });

    $("siteziOwnerPreview")?.addEventListener("click", previewDraft);
    $("siteziOwnerSaveDraft")?.addEventListener("click", saveDraft);
    $("siteziOwnerPublish")?.addEventListener("click", publishDraft);
  }
}

function setStatus(text = "", type = "") {
  const el = $("siteziOwnerStatus");
  if (!el) return;
  el.textContent = text;
  el.className = `sitezi-owner-status${type ? ` ${type}` : ""}`;
}

function selectTab(tab) {
  document.querySelectorAll("[data-owner-tab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.ownerTab === tab);
  });
  $("siteziOwnerProducts")?.classList.toggle("active", tab === "products");
  $("siteziOwnerPhotos")?.classList.toggle("active", tab === "photos");
}

function openPanel() {
  if (!currentSite || !currentUser) return;
  renderEditor();
  $("siteziOwnerPanel")?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePanel() {
  $("siteziOwnerPanel")?.classList.add("hidden");
  document.body.style.overflow = "";
}

function markDirty() {
  dirty = true;
  setStatus("Alterações ainda não publicadas.");
}

function productTemplate(item = {}, index = 0) {
  const hasPhoto = /^https?:\/\//i.test(String(item.photo || ""));
  return `
    <article class="sitezi-owner-item" data-product-index="${index}">
      <div>
        ${hasPhoto
          ? `<img class="sitezi-owner-thumb" src="${esc(item.photo)}" alt="">`
          : `<div class="sitezi-owner-placeholder">Sem foto</div>`}
        <label class="sitezi-owner-file" style="margin-top:7px">
          Trocar foto
          <input type="file" accept="image/*" data-product-photo="${index}">
        </label>
      </div>

      <div class="sitezi-owner-fields">
        <label class="sitezi-owner-field">
          <span>Nome</span>
          <input type="text" maxlength="100" value="${esc(item.name || "")}" data-product-field="name" data-index="${index}">
        </label>
        <label class="sitezi-owner-field">
          <span>Preço</span>
          <input type="text" maxlength="40" placeholder="Ex.: R$ 99,90" value="${esc(item.price || "")}" data-product-field="price" data-index="${index}">
        </label>
        <label class="sitezi-owner-field full">
          <span>Descrição</span>
          <textarea maxlength="500" data-product-field="description" data-index="${index}">${esc(item.description || "")}</textarea>
        </label>
      </div>

      <button class="sitezi-owner-remove" type="button" data-remove-product="${index}">Remover</button>
    </article>`;
}

function renderProducts() {
  const pane = $("siteziOwnerProducts");
  if (!pane || !draftConfig) return;

  const products = Array.isArray(draftConfig.products) ? draftConfig.products : [];
  pane.innerHTML = `
    <div class="sitezi-owner-note">
      Adicione, altere ou remova produtos e serviços. O site público só muda quando você tocar em <b>Publicar alterações</b>.
    </div>
    <div class="sitezi-owner-grid">
      ${products.length ? products.map(productTemplate).join("") : `<div class="sitezi-owner-note">Nenhum produto ou serviço cadastrado ainda.</div>`}
    </div>
    <button id="siteziOwnerAddProduct" class="sitezi-owner-add" type="button">+ Adicionar produto ou serviço</button>`;

  pane.querySelectorAll("[data-product-field]").forEach(input => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.index);
      const field = input.dataset.productField;
      draftConfig.products[index][field] = input.value;
      markDirty();
    });
  });

  pane.querySelectorAll("[data-remove-product]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeProduct);
      const item = draftConfig.products[index];
      if (item?.photo) removedAssetUrls.add(item.photo);
      draftConfig.products.splice(index, 1);
      markDirty();
      renderProducts();
    });
  });

  pane.querySelectorAll("[data-product-photo]").forEach(input => {
    input.addEventListener("change", async () => {
      const index = Number(input.dataset.productPhoto);
      const file = input.files?.[0];
      if (!file) return;

      try {
        setStatus("Enviando foto...");
        const old = draftConfig.products[index]?.photo || "";
        const url = await uploadImage(file, "products");
        if (old) removedAssetUrls.add(old);
        draftConfig.products[index].photo = url;
        markDirty();
        renderProducts();
        setStatus("Foto adicionada. Publique quando terminar.", "ok");
      } catch (error) {
        console.error("[SITEZI OWNER] upload produto", error);
        setStatus(error.message || "Não foi possível enviar a foto.", "error");
      } finally {
        input.value = "";
      }
    });
  });

  $("siteziOwnerAddProduct")?.addEventListener("click", () => {
    if (!Array.isArray(draftConfig.products)) draftConfig.products = [];
    draftConfig.products.push({ name: "", price: "", description: "", photo: "" });
    markDirty();
    renderProducts();
    requestAnimationFrame(() => {
      pane.querySelector('[data-product-field="name"][data-index="' + (draftConfig.products.length - 1) + '"]')?.focus();
    });
  });
}

function renderPhotos() {
  const pane = $("siteziOwnerPhotos");
  if (!pane || !draftConfig) return;

  if (!Array.isArray(draftConfig.photos)) draftConfig.photos = [];
  const photos = draftConfig.photos.filter(Boolean);

  pane.innerHTML = `
    <div class="sitezi-owner-note">
      Todas as fotos vinculadas a este site aparecem aqui. A primeira imagem é usada como destaque principal.
      Você pode manter até <b>${MAX_GALLERY} fotos</b>.
    </div>

    <div class="sitezi-gallery-grid">
      ${photos.map((src, index) => `
        <article class="sitezi-gallery-card">
          <img src="${esc(src)}" alt="Foto ${index + 1}">
          ${index === 0 ? `<span class="sitezi-gallery-main">DESTAQUE</span>` : ""}
          <button type="button" data-remove-gallery="${index}" aria-label="Remover foto">×</button>
        </article>`).join("")}
    </div>

    <label class="sitezi-gallery-upload" style="margin-top:12px">
      <span>
        <b>+ Adicionar fotos</b>
        <small>Você pode selecionar várias imagens de uma vez.</small>
      </span>
      <input id="siteziOwnerGalleryUpload" type="file" accept="image/*" multiple>
    </label>`;

  pane.querySelectorAll("[data-remove-gallery]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeGallery);
      const removed = draftConfig.photos[index];
      if (removed) removedAssetUrls.add(removed);
      draftConfig.photos.splice(index, 1);
      markDirty();
      renderPhotos();
    });
  });

  $("siteziOwnerGalleryUpload")?.addEventListener("change", async event => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    const remaining = MAX_GALLERY - draftConfig.photos.length;
    const selected = files.slice(0, Math.max(0, remaining));

    if (!selected.length) {
      setStatus(`Limite de ${MAX_GALLERY} fotos atingido.`, "error");
      event.target.value = "";
      return;
    }

    try {
      for (let i = 0; i < selected.length; i++) {
        setStatus(`Enviando foto ${i + 1} de ${selected.length}...`);
        const url = await uploadImage(selected[i], "gallery");
        draftConfig.photos.push(url);
      }
      markDirty();
      renderPhotos();
      setStatus(`${selected.length} foto(s) adicionada(s). Publique quando terminar.`, "ok");
    } catch (error) {
      console.error("[SITEZI OWNER] upload galeria", error);
      setStatus(error.message || "Não foi possível enviar as fotos.", "error");
    } finally {
      event.target.value = "";
    }
  });
}

function renderEditor() {
  ensureUI();

  const subtitle = $("siteziOwnerSubtitle");
  if (subtitle && currentSite) {
    subtitle.textContent = `${currentSite.business_name || "Meu site"} • alterações protegidas pela sua conta SITEZI`;
  }

  if (!subscription?.active) {
    const locked = `
      <div class="sitezi-owner-locked">
        <b>Seu site está publicado, mas a edição contínua exige um plano SITEZI ativo.</b><br>
        Entre na SITEZI para conferir ou renovar seu plano.
        <br><br><a href="/" target="_blank" rel="noopener">Abrir SITEZI →</a>
      </div>`;
    $("siteziOwnerProducts").innerHTML = locked;
    $("siteziOwnerPhotos").innerHTML = locked;
    $("siteziOwnerPreview").disabled = true;
    $("siteziOwnerSaveDraft").disabled = true;
    $("siteziOwnerPublish").disabled = true;
    return;
  }

  $("siteziOwnerPreview").disabled = false;
  $("siteziOwnerSaveDraft").disabled = false;
  $("siteziOwnerPublish").disabled = false;

  renderProducts();
  renderPhotos();
}

async function validateImage(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Selecione um arquivo de imagem.");
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`A imagem deve ter no máximo ${MAX_FILE_MB} MB.`);
  }
}

function extensionFor(file) {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("avif")) return "avif";
  return "jpg";
}

async function uploadImage(file, folder) {
  await validateImage(file);
  if (!currentUser || !currentSite) throw new Error("Sessão inválida.");

  const path = `${currentUser.id}/${currentSite.id}/${folder}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false
  });

  if (error) throw error;

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Não foi possível obter o endereço da imagem.");
  return data.publicUrl;
}

function assetPathFromUrl(url) {
  try {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const pos = String(url || "").indexOf(marker);
    if (pos < 0) return "";
    return decodeURIComponent(String(url).slice(pos + marker.length));
  } catch (_) {
    return "";
  }
}

async function removeUnusedAssets() {
  const paths = [...removedAssetUrls]
    .map(assetPathFromUrl)
    .filter(path => path && path.startsWith(`${currentUser.id}/${currentSite.id}/`));

  if (!paths.length) return;
  try {
    await client.storage.from(BUCKET).remove(paths);
  } catch (error) {
    console.warn("[SITEZI OWNER] limpeza de arquivos", error);
  }
  removedAssetUrls.clear();
}

function previewDraft() {
  if (!currentSite || !draftConfig) return;

  if (typeof window.SITEZI_PUBLIC_RENDER === "function") {
    window.SITEZI_PUBLIC_RENDER({
      ...currentSite,
      configuration: clone(draftConfig)
    });
    closePanel();
    setStatus("");
  } else {
    setStatus("A pré-visualização não está disponível nesta versão do site.", "error");
  }
}

async function saveDraft() {
  if (!currentSite || !draftConfig || !subscription?.active) return;

  const button = $("siteziOwnerSaveDraft");
  button.disabled = true;
  setStatus("Salvando rascunho...");

  try {
    const generated = {
      ...(currentSite.generated_content || {}),
      owner_draft_configuration: clone(draftConfig),
      owner_draft_updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("sites")
      .update({
        generated_content: generated,
        updated_at: new Date().toISOString()
      })
      .eq("id", currentSite.id)
      .eq("user_id", currentUser.id)
      .select("id,generated_content,updated_at")
      .single();

    if (error) throw error;

    currentSite.generated_content = data.generated_content || generated;
    dirty = false;
    setStatus("Rascunho salvo. O site público ainda não mudou.", "ok");
  } catch (error) {
    console.error("[SITEZI OWNER] salvar rascunho", error);
    setStatus("Não foi possível salvar o rascunho.", "error");
  } finally {
    button.disabled = false;
  }
}

async function publishDraft() {
  if (!currentSite || !draftConfig || !subscription?.active) return;

  const button = $("siteziOwnerPublish");
  button.disabled = true;
  $("siteziOwnerSaveDraft").disabled = true;
  $("siteziOwnerPreview").disabled = true;
  setStatus("Publicando alterações...");

  try {
    const generated = {
      ...(currentSite.generated_content || {}),
      owner_draft_configuration: null,
      owner_draft_updated_at: null,
      owner_last_published_from_panel_at: new Date().toISOString()
    };

    const payload = {
      configuration: clone(draftConfig),
      generated_content: generated,
      status: "published",
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("sites")
      .update(payload)
      .eq("id", currentSite.id)
      .eq("user_id", currentUser.id)
      .select("id,business_name,business_type,template,status,slug,configuration,generated_content,updated_at,published_at")
      .single();

    if (error) throw error;

    currentSite = data;
    draftConfig = clone(data.configuration || {});
    dirty = false;

    await removeUnusedAssets();

    if (typeof window.SITEZI_PUBLIC_RENDER === "function") {
      window.SITEZI_PUBLIC_RENDER(currentSite);
    }

    closePanel();
    setStatus("");
  } catch (error) {
    console.error("[SITEZI OWNER] publicar", error);
    setStatus("Não foi possível publicar as alterações. Tente novamente.", "error");
  } finally {
    button.disabled = false;
    $("siteziOwnerSaveDraft").disabled = false;
    $("siteziOwnerPreview").disabled = false;
  }
}

async function loadOwnerSite() {
  if (!slug || !currentUser) return false;

  const { data, error } = await client
    .from("sites")
    .select("id,user_id,business_name,business_type,template,status,slug,configuration,generated_content,updated_at,published_at")
    .eq("slug", slug)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.warn("[SITEZI OWNER] site", error);
    return false;
  }

  if (!data?.id) return false;

  currentSite = data;
  const savedDraft = data.generated_content?.owner_draft_configuration;
  draftConfig = clone(savedDraft && typeof savedDraft === "object" ? savedDraft : (data.configuration || {}));

  if (!Array.isArray(draftConfig.products)) draftConfig.products = [];
  if (!Array.isArray(draftConfig.photos)) draftConfig.photos = [];

  return true;
}

async function loadSubscription() {
  try {
    const { data, error } = await client.rpc("get_my_sitezi_subscription");
    if (error) throw error;
    subscription = data && typeof data === "object"
      ? data
      : { active: false, plan: null };
  } catch (error) {
    console.warn("[SITEZI OWNER] assinatura", error);
    subscription = { active: false, plan: null };
  }
}

async function initOwnerPanel() {
  if (!slug) return;

  ensureUI();

  const { data } = await client.auth.getSession();
  currentUser = data.session?.user || null;

  if (!currentUser) return;

  const ownsSite = await loadOwnerSite();
  if (!ownsSite) return;

  await loadSubscription();

  $("siteziOwnerButton")?.classList.add("visible");

  if (!subscription?.active) {
    const span = $("siteziOwnerButton")?.querySelector("span");
    if (span) span.textContent = "Gerenciar meu site";
  }

  document.documentElement.dataset.siteziOwnerPanel = "1.0";
}

client.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;

  if (!currentUser) {
    currentSite = null;
    $("siteziOwnerButton")?.classList.remove("visible");
    closePanel();
    return;
  }

  if (await loadOwnerSite()) {
    await loadSubscription();
    $("siteziOwnerButton")?.classList.add("visible");
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOwnerPanel, { once: true });
} else {
  initOwnerPanel();
}
