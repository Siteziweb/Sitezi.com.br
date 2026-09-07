document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".model-card");
  const chooseButtons = document.querySelectorAll(".choose-model");
  const modal = document.getElementById("selectionModal");
  const modalClose = document.getElementById("modalClose");
  const selectedTitle = document.getElementById("selectedTitle");
  const continueButton = document.getElementById("continueButton");

  /* =========================================================
     SITEZI — EDU OFICIAL
     Mantém a imagem existente edu.png sem alterar o arquivo.
     Troca somente o emoji da caixinha.
     ========================================================= */
  const eduAvatar = document.querySelector(".edu-avatar");

  if (eduAvatar) {
    eduAvatar.innerHTML = '<img src="edu.png" alt="Edu, mascote da SITEZI">';

    const eduStyle = document.createElement("style");
    eduStyle.textContent = `
      .edu-avatar{
        overflow:hidden!important;
        padding:0!important;
        background:linear-gradient(145deg,#123eff,#0a1226)!important;
      }
      .edu-avatar img{
        width:100%!important;
        height:100%!important;
        display:block!important;
        object-fit:cover!important;
        object-position:center 18%!important;
        transform:scale(1.08);
      }
    `;
    document.head.appendChild(eduStyle);
  }

  /* =========================================================
     FILTROS
     ========================================================= */
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;

      cards.forEach((card) => {
        const match = filter === "todos" || card.dataset.category === filter;
        card.classList.toggle("hidden", !match);
      });
    });
  });

  /* =========================================================
     ESCOLHER MODELO
     Antes apontava para criar-site.html, que não existe.
     Agora volta ao criador principal com o modelo escolhido.
     ========================================================= */
  chooseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const model = button.dataset.model || "Modelo";

      localStorage.setItem("sitezi_modelo_escolhido", model);

      selectedTitle.textContent = model + " selecionado";

      continueButton.href =
        "index.html?modelo=" + encodeURIComponent(model);

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    });
  });

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
});
