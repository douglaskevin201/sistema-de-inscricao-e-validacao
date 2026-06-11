import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { senha } = await req.json()
  const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')

  if (!ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Configuração de administrador não encontrada.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const isValid = senha === ADMIN_PASSWORD
  return new Response(JSON.stringify({ ok: isValid }), {
    status: isValid ? 200 : 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
