import { useState } from 'react'
import { supabase } from './supabase'
import logo from './imagens/logo.png'

function gerarCodigo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function verificarEmailExistente(email) {
  const { data, error } = await supabase
    .from('convites')
    .select('id')
    .eq('email', email.trim().toLowerCase())
  if (error) { console.error(error); return false }
  return data.length > 0
}

async function enviarEmail(para, nome, codigo, tipo, nomeAluno) {
  const { error } = await supabase.functions.invoke('enviar-email', {
    body: { para, nome, codigo, tipo, nomeAluno }
  })
  if (error) throw error
}

function validarCPF(cpf) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(cpf[10])
}

function aplicarMascara(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 11)
  if (n.length > 9) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
  if (n.length > 6) return n.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
  if (n.length > 3) return n.replace(/(\d{3})(\d{1,3})/, '$1.$2')
  return n
}

export default function Formulario() {
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', curso: '' })
  const [convidados, setConvidados] = useState([{ nome: '', email: '' }])
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [alunoExistente, setAlunoExistente] = useState(null)
  const [consultandoCPF, setConsultandoCPF] = useState(false)
  const [convidadosEnviando, setConvidadosEnviando] = useState(false)
  const [convidadosSucesso, setConvidadosSucesso] = useState(false)

  function atualizarConvidado(i, campo, valor) {
    const novos = [...convidados]
    novos[i][campo] = valor
    setConvidados(novos)
  }

  async function handleCPF(valor) {
    const mascarado = aplicarMascara(valor)
    setForm(f => ({ ...f, cpf: mascarado }))
    setAlunoExistente(null)
    setErro('')
    const cpfLimpo = mascarado.replace(/\D/g, '')
    if (cpfLimpo.length === 11) {
      if (!validarCPF(cpfLimpo)) {
        setErro('CPF inválido. Verifique e tente novamente.')
        return
      }
      setConsultandoCPF(true)
      try {
        const { data } = await supabase
          .from('convites')
          .select('*')
          .eq('cpf', cpfLimpo)
          .eq('tipo', 'aluno')
          .single()
        if (data) setAlunoExistente(data)
      } catch (e) {
        console.error(e)
      } finally {
        setConsultandoCPF(false)
      }
    }
  }

  async function adicionarConvidados() {
    const validos = convidados.filter(c => c.nome.trim() && validarEmail(c.email.trim()))
    if (validos.length === 0) {
      setErro('Adicione pelo menos um convidado com nome e email válidos.')
      return
    }
    setErro('')
    setConvidadosEnviando(true)
    try {
      for (const c of validos) {
        const jaExiste = await verificarEmailExistente(c.email)
        if (jaExiste) {
          setErro(`O e-mail "${c.email}" já está cadastrado no sistema.`)
          setConvidadosEnviando(false)
          return
        }
      }
      for (const c of validos) {
        const cod = gerarCodigo()
        const { error: e } = await supabase.from('convites').insert({
          codigo: cod, nome: c.nome.trim(), email: c.email.trim().toLowerCase(),
          cpf: null, curso: null, tipo: 'convidado', convidado_de: alunoExistente.nome
        })
        if (!e) await enviarEmail(c.email.trim(), c.nome.trim(), cod, 'convidado', alunoExistente.nome)
      }
      setConvidadosSucesso(true)
    } catch (e) {
      setErro('Erro ao cadastrar convidados. Tente novamente.')
      console.error(e)
    }
    setConvidadosEnviando(false)
  }

  async function enviar() {
    if (!form.nome || !form.email || !form.cpf || !form.curso) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    if (!validarEmail(form.email.trim())) {
      setErro('Por favor, insira um e-mail válido.')
      return
    }
    const cpfLimpo = form.cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setErro('CPF incompleto. Digite os 11 dígitos.')
      return
    }
    if (!validarCPF(cpfLimpo)) {
      setErro('CPF inválido. Verifique e tente novamente.')
      return
    }
    setErro('')
    setEnviando(true)
    try {
      const emailAlunoExiste = await verificarEmailExistente(form.email)
      if (emailAlunoExiste) {
        setErro('Este e-mail já possui uma inscrição realizada.')
        setEnviando(false)
        return
      }
      const convidadosValidos = convidados.filter(c => c.nome.trim() && validarEmail(c.email.trim()))
      for (const c of convidadosValidos) {
        if (c.email.trim().toLowerCase() === form.email.trim().toLowerCase()) {
          setErro(`O convidado "${c.nome}" não pode usar o mesmo e-mail do aluno.`)
          setEnviando(false)
          return
        }
        const jaExiste = await verificarEmailExistente(c.email)
        if (jaExiste) {
          setErro(`O e-mail "${c.email}" já está cadastrado no sistema.`)
          setEnviando(false)
          return
        }
      }
      const codigoAluno = gerarCodigo()
      const { error } = await supabase.from('convites').insert({
        codigo: codigoAluno, nome: form.nome, email: form.email.trim().toLowerCase(),
        cpf: cpfLimpo, curso: form.curso, tipo: 'aluno', convidado_de: null
      })
      if (error) {
        if (error.code === '23505') {
          setErro('Este CPF já possui inscrição.')
        } else {
          setErro('Erro ao enviar. Tente novamente.')
        }
        setEnviando(false)
        return
      }
      await enviarEmail(form.email.trim(), form.nome, codigoAluno, 'aluno', form.nome)
      for (const c of convidadosValidos) {
        const cod = gerarCodigo()
        const { error: e } = await supabase.from('convites').insert({
          codigo: cod, nome: c.nome.trim(), email: c.email.trim().toLowerCase(),
          cpf: null, curso: null, tipo: 'convidado', convidado_de: form.nome
        })
        if (!e) await enviarEmail(c.email.trim(), c.nome.trim(), cod, 'convidado', form.nome)
      }
      setSucesso(true)
    } catch (e) {
      setErro('Erro ao enviar. Tente novamente.')
      console.error(e)
    }
    setEnviando(false)
  }

  if (sucesso) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{fontSize:60,textAlign:'center'}}></div>
        <h2 style={s.titulo}>Inscrição confirmada!</h2>
        <p style={{textAlign:'center',color:'#555'}}>Você e seus convidados receberão o QR Code por email em instantes.</p>
      </div>
    </div>
  )

  if (convidadosSucesso) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{fontSize:60,textAlign:'center'}}></div>
        <h2 style={s.titulo}>Convidados adicionados!</h2>
        <p style={{textAlign:'center',color:'#555'}}>Seus convidados receberão o QR Code por email em instantes.</p>
      </div>
    </div>
  )

  if (alunoExistente) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{textAlign:'center',marginBottom:15}}>
          <img src={logo} alt="Logo UniEnsino" style={{maxWidth:'150px'}}/>
        </div>
        <h2 style={s.titulo}> Festa Junina UniEnsino 2026</h2>
        <div style={{background:'#d1fae5',border:'1px solid #6ee7b7',borderRadius:8,padding:14,marginBottom:20,textAlign:'center'}}>
          <p style={{margin:0,color:'#065f46',fontWeight:'bold'}}>✅ Você já está inscrito, {alunoExistente.nome.split(' ')[0]}!</p>
          <p style={{margin:'6px 0 0',color:'#047857',fontSize:14}}>Deseja adicionar convidados à sua inscrição?</p>
        </div>
        <div style={{marginBottom:8}}>
          <strong style={{color:'#92400e'}}>Convidados</strong>
          <span style={{fontSize:12,color:'#888',marginLeft:8}}>opcional — sem limite</span>
        </div>
        {convidados.map((c, i) => (
          <div key={i} style={{background:'#fff3e0',borderRadius:8,padding:12,marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:'bold',color:'#78350f'}}>Convidado {i+1}</span>
              {convidados.length > 1 && (
                <button onClick={() => setConvidados(convidados.filter((_,idx)=>idx!==i))} style={s.btnRemover}>✕</button>
              )}
            </div>
            <input style={s.input} placeholder="Nome completo" value={c.nome} onChange={e => atualizarConvidado(i,'nome',e.target.value)} />
            <input style={s.input} placeholder="Email" type="email" value={c.email} onChange={e => atualizarConvidado(i,'email',e.target.value)} />
          </div>
        ))}
        <button onClick={() => setConvidados([...convidados,{nome:'',email:''}])} style={s.btnAdicionar}>+ Adicionar convidado</button>
        {erro && <p style={{color:'#991b1b',marginTop:10,fontSize:14,padding:8,background:'#fee2e2',borderRadius:6}}>{erro}</p>}
        <button onClick={adicionarConvidados} disabled={convidadosEnviando} style={{...s.btnEnviar,opacity:convidadosEnviando?0.7:1}}>
          {convidadosEnviando ? ' Enviando...' : ' Confirmar convidados'}
        </button>
        <button onClick={() => { setAlunoExistente(null); setForm(f=>({...f,cpf:''})); setErro(''); setConvidados([{nome:'',email:''}]) }} style={{...s.btnAdicionar,marginTop:10}}>
          ← Voltar
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{textAlign:'center',marginBottom:15}}>
          <img src={logo} alt="Logo UniEnsino" style={{maxWidth:'180px'}}/>
        </div>
        <h2 style={s.titulo}> Festa Junina UniEnsino 2026</h2>
        <p style={s.sub}>Preencha seus dados para confirmar presença</p>

        <label style={s.label}>CPF *</label>
        <input style={s.input} value={form.cpf} onChange={e => handleCPF(e.target.value)} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" />
        {consultandoCPF && <p style={{fontSize:13,color:'#92400e',margin:'2px 0 4px'}}>⏳ Verificando CPF...</p>}

        <label style={s.label}>Nome completo *</label>
        <input style={s.input} value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />

        <label style={s.label}>Email *</label>
        <input style={s.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />

        <label style={s.label}>Curso e período *</label>
        <input style={s.input} value={form.curso} onChange={e => setForm({...form, curso: e.target.value})} placeholder="Ex: ADS – 1º período" />

        <div style={{marginTop:24,marginBottom:8,borderTop:'1px solid #e5e7eb',paddingTop:16}}>
          <strong style={{color:'#92400e'}}>Convidados</strong>
          <span style={{fontSize:12,color:'#888',marginLeft:8}}>opcional — sem limite</span>
        </div>

        {convidados.map((c, i) => (
          <div key={i} style={{background:'#fff3e0',borderRadius:8,padding:12,marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:'bold',color:'#78350f'}}>Convidado {i+1}</span>
              {convidados.length > 1 && (
                <button onClick={() => setConvidados(convidados.filter((_,idx)=>idx!==i))} style={s.btnRemover}>✕</button>
              )}
            </div>
            <input style={s.input} placeholder="Nome completo" value={c.nome} onChange={e => atualizarConvidado(i,'nome',e.target.value)} />
            <input style={s.input} placeholder="Email" type="email" value={c.email} onChange={e => atualizarConvidado(i,'email',e.target.value)} />
          </div>
        ))}

        <button onClick={() => setConvidados([...convidados,{nome:'',email:''}])} style={s.btnAdicionar}>+ Adicionar convidado</button>

        {erro && <p style={{color:'#991b1b',marginTop:10,fontSize:14,padding:8,background:'#fee2e2',borderRadius:6}}>{erro}</p>}

        <button onClick={enviar} disabled={enviando} style={{...s.btnEnviar,opacity:enviando?0.7:1}}>
          {enviando ? 'Enviando...' : 'Confirmar inscrição'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20},
  card:{background:'#fff',border:'2px solid #d97706',borderRadius:14,padding:28,width:'100%',maxWidth:500,boxShadow:'0 4px 20px rgba(0,0,0,.08)'},
  titulo:{color:'#92400e',textAlign:'center',marginBottom:6},
  sub:{textAlign:'center',color:'#78350f',fontSize:14,marginBottom:20},
  label:{display:'block',fontWeight:'bold',color:'#555',marginBottom:4,marginTop:12},
  input:{width:'100%',padding:10,border:'1px solid #d97706',borderRadius:6,fontSize:15,marginBottom:4,boxSizing:'border-box'},
  btnEnviar:{width:'100%',padding:14,background:'#92400e',color:'#fff',border:'none',borderRadius:8,fontSize:17,fontWeight:'bold',cursor:'pointer',marginTop:20},
  btnAdicionar:{width:'100%',padding:10,background:'#fff3e0',color:'#92400e',border:'2px dashed #d97706',borderRadius:8,fontSize:15,cursor:'pointer',marginTop:4},
  btnRemover:{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontWeight:'bold',fontSize:16}
}