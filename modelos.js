document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".model-card");
  const chooseButtons = document.querySelectorAll(".choose-model");
  const modal = document.getElementById("selectionModal");
  const modalClose = document.getElementById("modalClose");
  const selectedTitle = document.getElementById("selectedTitle");
  const continueButton = document.getElementById("continueButton");

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

  chooseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const model = button.dataset.model || "Modelo";
      localStorage.setItem("sitezi_modelo_escolhido", model);

      selectedTitle.textContent = model + " selecionado";
      continueButton.href = "criar-site.html?modelo=" + encodeURIComponent(model);

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
