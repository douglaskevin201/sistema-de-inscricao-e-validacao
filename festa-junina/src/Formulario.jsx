import { useState } from 'react'
import { supabase } from './supabase'

function gerarCodigo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

async function enviarEmail(para, nome, codigo, tipo, nomeAluno) {
  await fetch('https://mngrfqkavgoybxvttpuw.supabase.co/functions/v1/enviar-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZ3JmcWthdmdveWJ4dnR0cHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NjcyNjQsImV4cCI6MjA5NjU0MzI2NH0.M28L-G-Gz6MR5D2k9tnQIrBAviAf0c4BGs1Ay_9dRpU`
    },
    body: JSON.stringify({ para, nome, codigo, tipo, nomeAluno })
  })
}

export default function Formulario() {
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', curso: '' })
  const [convidados, setConvidados] = useState([{ nome: '', email: '' }])
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  function atualizarConvidado(i, campo, valor) {
    const novos = [...convidados]
    novos[i][campo] = valor
    setConvidados(novos)
  }

  function adicionarConvidado() {
    setConvidados([...convidados, { nome: '', email: '' }])
  }

  function removerConvidado(i) {
    setConvidados(convidados.filter((_, idx) => idx !== i))
  }

async function enviar() {
  if (!form.nome || !form.email || !form.cpf || !form.curso) {
    setErro('Preencha todos os campos obrigatórios.')
    return
  }
  setErro('')
  setEnviando(true)
  try {
    const codigoAluno = gerarCodigo()
    const { error } = await supabase.from('convites').insert({
      codigo: codigoAluno, nome: form.nome, email: form.email,
      cpf: form.cpf, curso: form.curso, tipo: 'aluno', convidado_de: null
    })
    if (error) throw error
    await enviarEmail(form.email, form.nome, codigoAluno, 'aluno', form.nome)

    const convidadosValidos = convidados.filter(c => c.nome.trim() && c.email.trim() && c.email.includes('@'))
    
    for (let i = 0; i < convidadosValidos.length; i++) {
      const c = convidadosValidos[i]
      const codigoConv = gerarCodigo()
      const { error: errConv } = await supabase.from('convites').insert({
        codigo: codigoConv, nome: c.nome.trim(), email: c.email.trim(),
        cpf: null, curso: null, tipo: 'convidado', convidado_de: form.nome
      })
      if (errConv) {
        console.error('Erro ao salvar convidado:', errConv)
        continue
      }
      await enviarEmail(c.email.trim(), c.nome.trim(), codigoConv, 'convidado', form.nome)
    }

    setSucesso(true)
  } catch (e) {
    setErro('Erro ao enviar. Tente novamente.')
    console.error(e)
  }
  setEnviando(false)
}

  if (sucesso) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{fontSize:60,textAlign:'center'}}>🎉</div>
        <h2 style={styles.titulo}>Inscrição confirmada!</h2>
        <p style={{textAlign:'center',color:'#555'}}>Você e seus convidados receberão o QR Code por email em instantes.</p>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>🌽 Festa Junina UniEnsino 2025</h2>
        <p style={styles.sub}>Preencha seus dados para confirmar presença</p>

        <label style={styles.label}>Nome completo *</label>
        <input style={styles.input} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />

        <label style={styles.label}>Email *</label>
        <input style={styles.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />

        <label style={styles.label}>CPF *</label>
        <input style={styles.input} value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} placeholder="Somente números" />

        <label style={styles.label}>Curso e período *</label>
        <input style={styles.input} value={form.curso} onChange={e => setForm({...form, curso: e.target.value})} placeholder="Ex: ADS – 1º período" />

        <div style={{marginTop:24,marginBottom:8,borderTop:'1px solid #e5e7eb',paddingTop:16}}>
          <strong style={{color:'#92400e'}}>Convidados</strong>
        </div>

        {convidados.map((c, i) => (
          <div key={i} style={{background:'#fff3e0',borderRadius:8,padding:12,marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:'bold',color:'#78350f'}}>Convidado {i+1}</span>
              {convidados.length > 1 && <button onClick={() => removerConvidado(i)} style={styles.btnRemover}>✕</button>}
            </div>
            <input style={styles.input} placeholder="Nome completo" value={c.nome} onChange={e => atualizarConvidado(i, 'nome', e.target.value)} />
            <input style={styles.input} placeholder="Email" type="email" value={c.email} onChange={e => atualizarConvidado(i, 'email', e.target.value)} />
          </div>
        ))}

        <button onClick={adicionarConvidado} style={styles.btnAdicionar}>+ Adicionar convidado</button>

        {erro && <p style={{color:'red',marginTop:10}}>{erro}</p>}

        <button onClick={enviar} disabled={enviando} style={styles.btnEnviar}>
          {enviando ? 'Enviando...' : '✅ Confirmar inscrição'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card: { background:'#fff', border:'2px solid #d97706', borderRadius:14, padding:28, width:'100%', maxWidth:500, boxShadow:'0 4px 20px rgba(0,0,0,.08)' },
  titulo: { color:'#92400e', textAlign:'center', marginBottom:6 },
  sub: { textAlign:'center', color:'#78350f', fontSize:14, marginBottom:20 },
  label: { display:'block', fontWeight:'bold', color:'#555', marginBottom:4, marginTop:12 },
  input: { width:'100%', padding:10, border:'1px solid #d97706', borderRadius:6, fontSize:15, marginBottom:4 },
  btnEnviar: { width:'100%', padding:14, background:'#92400e', color:'#fff', border:'none', borderRadius:8, fontSize:17, fontWeight:'bold', cursor:'pointer', marginTop:20 },
  btnAdicionar: { width:'100%', padding:10, background:'#fff3e0', color:'#92400e', border:'2px dashed #d97706', borderRadius:8, fontSize:15, cursor:'pointer', marginTop:4 },
  btnRemover: { background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontWeight:'bold', fontSize:16 }
}