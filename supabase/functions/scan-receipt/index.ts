// CakeUz — Receipt-scan Edge Function
// Holds the ANTHROPIC_API_KEY server-side so the browser never sees it.
// Verifies the caller is signed in via Supabase Auth, then proxies the
// vision request to Anthropic and forwards the response.
//
// Deploy:  supabase functions deploy scan-receipt --no-verify-jwt
//          (we do auth manually below so the --no-verify-jwt flag just skips
//           Supabase's default 401 wrapper; our handler still rejects anon users.)
//
// Required Supabase secrets (Project Settings → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY   = sk-ant-...  (from console.anthropic.com)
//   SUPABASE_URL        = https://puwdbrsvqbxeanoewycy.supabase.co   (auto-set)
//   SUPABASE_ANON_KEY   = the anon JWT                              (auto-set)
//
// Frontend invokes via:
//   const { data, error } = await sb.functions.invoke('scan-receipt',
//     { body: { imageBase64, mediaType, ingredients } });

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")      ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Vision-capable Claude model — Haiku is plenty for grocery-receipt OCR.
const MODEL_ID = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  if (!ANTHROPIC_API_KEY) return json({ error: "Server misconfigured: ANTHROPIC_API_KEY missing." }, 500);

  // Auth gate — only signed-in CakeUz users can invoke this.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  // Payload
  let payload: { imageBase64?: string; mediaType?: string; ingredients?: Array<{ id: number; name: string; unit: string }> };
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }

  const { imageBase64, mediaType, ingredients } = payload;
  if (!imageBase64) return json({ error: "imageBase64 required" }, 400);

  const ingList = (ingredients ?? []).map(i => `${i.id}: ${i.name} (${i.unit})`).join("\n");
  const prompt =
    "Read this grocery receipt. Currency is SGD.\n" +
    "Our ingredients:\n" + ingList + "\n" +
    "Match receipt items to ingredients. Return ONLY valid JSON array, no markdown:\n" +
    "[{\"ingId\":1,\"qty\":2,\"unitPrice\":1.20}]\n" +
    "If no match, return [].";

  // Forward to Anthropic
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      MODEL_ID,
      max_tokens: 1000,
      messages: [{
        role:    "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
          { type: "text",  text: prompt },
        ],
      }],
    }),
  });

  if (!anthropicRes.ok) {
    const body = await anthropicRes.text();
    return json({ error: `Anthropic API ${anthropicRes.status}: ${body.slice(0, 400)}` }, 502);
  }

  const data = await anthropicRes.json();
  return json(data);
});
