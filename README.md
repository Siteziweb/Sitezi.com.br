SITEZI V5 — BACKEND READY (SUPABASE)

Arquivos:
- schema.sql: tabelas, RLS e bucket de assets.
- edge-functions/generate-brand: endpoint para sugestões de marca.
- edge-functions/generate-image: endpoint para imagens geradas por IA.
- edge-functions/publish-site: endpoint de publicação.
- .env.example: variáveis esperadas.

ORDEM RECOMENDADA:
1. Criar um projeto Supabase EXCLUSIVO para a SITEZI.
2. Rodar schema.sql no SQL Editor.
3. Ativar Auth (email/senha primeiro).
4. Criar/deployar as Edge Functions.
5. Configurar segredos do provedor de IA apenas no backend.
6. Ligar script.js aos endpoints.
7. Criar persistência de projetos.
8. Só depois implementar publicação real e cobrança.

IMPORTANTE:
- A V5 funciona no frontend sem backend para criação e prévia.
- "Criar logo com IA", "Gerar imagens com IA" e "Publicar meu site" estão preparados,
  mas conscientemente não fingem IA/publicação real.
- O próximo passo é conectar um backend de verdade.
