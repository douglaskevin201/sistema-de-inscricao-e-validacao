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
  const PORTARIA_PASSWORD = Deno.env.get('PORTARIA_PASSWORD')

  if (!PORTARIA_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Configuração da portaria não encontrada.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const isValid = senha === PORTARIA_PASSWORD
  return new Response(JSON.stringify({ ok: isValid }), {
    status: isValid ? 200 : 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
