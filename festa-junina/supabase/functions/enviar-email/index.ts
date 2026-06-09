import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  const { para, nome, codigo, tipo, nomeAluno } = await req.json()
  const RESEND_KEY = Deno.env.get('RESEND_KEY')

  const tipoLabel = tipo === 'aluno'
    ? 'Sua inscrição foi confirmada.'
    : `Você foi convidado(a) por <strong>${nomeAluno}</strong>.`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Festa Junina <onboarding@resend.dev>',
      to: [para],
      subject: '🌽 Seu convite – Festa Junina UniEnsino 2025',
      html: `
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
    })
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
})