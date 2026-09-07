// SITEZI backend scaffold
// Deploy as a Supabase Edge Function.
// Keep AI provider keys in server-side environment secrets, never in frontend code.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  const { businessType, businessName } = await req.json();
  if (!businessType || !businessName) return json({ error: "Dados incompletos" }, 400);
  // TODO: call your AI provider here and return 3 slogan/logo-direction options.
  return json({
    suggestions: [
      `${businessName}: qualidade e confiança para seus clientes.`,
      `${businessName}: uma presença profissional para o seu negócio.`,
      `${businessName}: atendimento próximo, resultado profissional.`
    ]
  });
});
function cors(){return{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors(),"Content-Type":"application/json"}})}
