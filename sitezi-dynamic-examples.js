/* =========================================================
   SITEZI — EXEMPLOS DINÂMICOS DA ETAPA 5 v1.0
   Adapta nome, preço e descrição ao tipo de negócio escolhido.
   Não usa IA e não consome créditos.
   ========================================================= */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const EXAMPLES = {
    "Oficina Mecânica": {
      name: "Ex.: Troca de óleo",
      price: "Ex.: R$ 129,90",
      description: "Ex.: Troca do óleo do motor com verificação do filtro e dos principais níveis."
    },
    "Restaurante": {
      name: "Ex.: Prato executivo",
      price: "Ex.: R$ 29,90",
      description: "Ex.: Refeição completa preparada na hora, com acompanhamento e opções do dia."
    },
    "Barbearia": {
      name: "Ex.: Corte masculino",
      price: "Ex.: R$ 45,00",
      description: "Ex.: Corte personalizado com acabamento e finalização de acordo com o seu estilo."
    },
    "Salão de Beleza": {
      name: "Ex.: Escova e finalização",
      price: "Ex.: R$ 80,00",
      description: "Ex.: Serviço de escova com preparação dos fios e finalização personalizada."
    },
    "Moda e Vestuário": {
      name: "Ex.: Camiseta básica",
      price: "Ex.: R$ 59,90",
      description: "Ex.: Camiseta confortável para o dia a dia, disponível em diferentes tamanhos."
    },
    "Loja / Comércio": {
      name: "Ex.: Produto em destaque",
      price: "Ex.: R$ 99,90",
      description: "Ex.: Produto selecionado com qualidade e atendimento para ajudar você na melhor escolha."
    },
    "Clínica / Saúde": {
      name: "Ex.: Consulta de avaliação",
      price: "Ex.: R$ 150,00",
      description: "Ex.: Atendimento inicial para avaliação, orientação e definição dos próximos cuidados."
    },
    "Prestador de Serviços": {
      name: "Ex.: Instalação elétrica",
      price: "Ex.: R$ 150,00",
      description: "Ex.: Instalação e manutenção elétrica com avaliação do serviço e execução profissional."
    },
    "Outro": {
      name: "Ex.: Seu principal produto ou serviço",
      price: "Ex.: R$ 100,00",
      description: "Ex.: Explique de forma simples o que está incluído e como este produto ou serviço ajuda o cliente."
    }
  };

  function currentType() {
    return window.SITEZI_BUILDER_STATE?.businessType || "Outro";
  }

  function applyExamples() {
    const ex = EXAMPLES[currentType()] || EXAMPLES.Outro;
    if ($("productName")) $("productName").placeholder = ex.name;
    if ($("productPrice")) $("productPrice").placeholder = ex.price;
    if ($("productDescription")) $("productDescription").placeholder = ex.description;
  }

  document.addEventListener("DOMContentLoaded", applyExamples);

  document.addEventListener("click", e => {
    if (e.target?.closest?.(".business") ||
        e.target?.closest?.("#nextBtn") ||
        e.target?.closest?.("#backBtn") ||
        e.target?.closest?.("#editSite")) {
      setTimeout(applyExamples, 140);
    }
  });

  window.addEventListener("sitezi:builder-state", applyExamples);

  const observer = new MutationObserver(() => {
    const step5 = document.querySelector('.step[data-step="5"].active');
    if (step5) applyExamples();
  });

  document.addEventListener("DOMContentLoaded", () => {
    const wizard = document.getElementById("wizard");
    if (wizard) observer.observe(wizard, {attributes:true, subtree:true, attributeFilter:["class"]});
  });

  window.SITEZI_DYNAMIC_EXAMPLES = { applyExamples };
})();
