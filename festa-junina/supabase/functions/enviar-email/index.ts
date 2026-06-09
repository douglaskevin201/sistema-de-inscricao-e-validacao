import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { para, nome, codigo, tipo, nomeAluno } = await req.json()
  const BREVO_KEY = Deno.env.get('BREVO_KEY')

  const tipoLabel = tipo === 'aluno'
    ? 'Sua inscrição foi confirmada.'
    : `Você foi convidado(a) por <strong>${nomeAluno}</strong>.`

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#fffbf0;border:2px solid #d97706;border-radius:14px;padding:28px;">
      <h2 style="color:#92400e;text-align:center;">🌽 Festa Junina UniEnsino 2025</h2>
      <p>Olá, <strong>${nome}</strong>! 🎉</p>
      <p>${tipoLabel}</p>
      <p>Apresente o código abaixo na portaria:</p>
      <div style="background:#92400e;color:#fff;text-align:center;padding:16px;border-radius:8px;font-size:28px;letter-spacing:6px;font-weight:bold;margin:20px 0;">
        ${codigo}
      </div>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${codigo}" style="display:block;margin:0 auto;border:4px solid #92400e;border-radius:8px;" />
      <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px;">Convite pessoal e intransferível. Uso único.</p>
    </div>`

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Festa Junina UniEnsino', email: 'douglas.kevin201@gmail.com' },
      to: [{ email: para, name: nome }],
      subject: '🌽 Seu convite – Festa Junina UniEnsino 2025',
      htmlContent: htmlBody
    })
  })

  const result = await res.json()
  console.log('Brevo result:', JSON.stringify(result))

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})