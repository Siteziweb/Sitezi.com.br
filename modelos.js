document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const filterButtons=[...document.querySelectorAll(".filter-btn")];
  const cards=[...document.querySelectorAll(".model-card")];
  const modal=document.getElementById("selectionModal");
  const modalClose=document.getElementById("modalClose");
  const selectedTitle=document.getElementById("selectedTitle");
  const continueButton=document.getElementById("continueButton");

  const eduAvatar=document.querySelector(".edu-avatar");
  if(eduAvatar){
    eduAvatar.innerHTML='<img src="edu.png" alt="Edu, mascote da SITEZI">';
    const st=document.createElement("style");
    st.textContent=`.edu-avatar{overflow:hidden!important;padding:0!important}.edu-avatar img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center 18%!important;transform:scale(1.08)}`;
    document.head.appendChild(st);
  }

  filterButtons.forEach(button=>button.addEventListener("click",()=>{
    filterButtons.forEach(btn=>btn.classList.remove("active"));
    button.classList.add("active");
    const filter=button.dataset.filter;
    cards.forEach(card=>card.classList.toggle("hidden",filter!=="todos"&&card.dataset.category!==filter));
  }));

  document.querySelectorAll(".choose-model").forEach(button=>button.addEventListener("click",()=>{
    const preset=button.dataset.preset||"";
    const business=button.dataset.business||"Outro";
    try{
      localStorage.setItem("sitezi_model_preset",preset);
      localStorage.removeItem("sitezi_model_custom");
      localStorage.setItem("sitezi_model_business",business);
    }catch(_){}
    selectedTitle.textContent=(button.closest(".model-card")?.querySelector("h2")?.textContent||"Modelo")+" selecionado";
    continueButton.href=`index.html?preset=${encodeURIComponent(preset)}`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  }));

  document.querySelector(".custom-model")?.addEventListener("click",()=>{
    try{
      localStorage.setItem("sitezi_model_custom","1");
      localStorage.removeItem("sitezi_model_preset");
      localStorage.removeItem("sitezi_model_business");
    }catch(_){}
    location.href="index.html?custom=1";
  });

  function closeModal(){modal?.classList.remove("open");modal?.setAttribute("aria-hidden","true")}
  modalClose?.addEventListener("click",closeModal);
  modal?.addEventListener("click",e=>{if(e.target===modal)closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
});
