// SITEZI backend scaffold
// Deploy as a Supabase Edge Function.
// Keep AI provider keys in server-side environment secrets, never in frontend code.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  const { projectId } = await req.json();
  if (!projectId) return json({ error: "projectId obrigatório" }, 400);
  // TODO:
  // 1) load project from sitezi_projects
  // 2) validate slug
  // 3) save generated HTML to a hosting target / storage
  // 4) mark project as published
  // 5) return public URL (e.g. slug.sitezi.com.br)
  return json({ ok:false, message:"Publicação preparada, ainda não conectada ao host." });
});
function cors(){return{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors(),"Content-Type":"application/json"}})}
