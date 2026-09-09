document.addEventListener("DOMContentLoaded",()=>{
"use strict";
const filters=[...document.querySelectorAll(".filter-btn")],cards=[...document.querySelectorAll(".model-card")];
const modal=document.getElementById("selectionModal"),title=document.getElementById("selectedTitle"),go=document.getElementById("continueButton");
const avatar=document.querySelector(".edu-avatar");if(avatar)avatar.innerHTML='<img src="edu.png" alt="Edu, mascote da SITEZI">';
filters.forEach(b=>b.addEventListener("click",()=>{filters.forEach(x=>x.classList.remove("active"));b.classList.add("active");const f=b.dataset.filter;cards.forEach(c=>c.classList.toggle("hidden",f!=="todos"&&c.dataset.category!==f))}));
document.querySelectorAll(".choose-model").forEach(b=>b.addEventListener("click",()=>{const p=b.dataset.preset||"",business=b.dataset.business||"Outro";try{localStorage.setItem("sitezi_model_preset",p);localStorage.setItem("sitezi_model_business",business);localStorage.removeItem("sitezi_model_custom")}catch(_){}title.textContent=(b.closest(".model-card")?.querySelector("h2")?.textContent||"Modelo")+" selecionado";go.href=`index.html?preset=${encodeURIComponent(p)}`;modal.classList.add("open");modal.setAttribute("aria-hidden","false")}));
document.querySelector(".custom-model")?.addEventListener("click",()=>{try{localStorage.setItem("sitezi_model_custom","1");localStorage.removeItem("sitezi_model_preset")}catch(_){}location.href="index.html?custom=1"});
function close(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}document.getElementById("modalClose")?.addEventListener("click",close);modal?.addEventListener("click",e=>{if(e.target===modal)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
});