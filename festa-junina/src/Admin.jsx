import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const SENHA_ADMIN = 'festaadmin2025'

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [convites, setConvites] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase.from('convites').select('*').order('criado_em', { ascending: false })
    setConvites(data || [])
    setCarregando(false)
  }

  useEffect(() => { if (autenticado) carregar() }, [autenticado])

  function login() {
    if (senha === SENHA_ADMIN) setAutenticado(true)
    else alert('Senha incorreta!')
  }

  const filtrados = convites.filter(c => {
    const matchFiltro =
      filtro === 'todos' ? true :
      filtro === 'compareceram' ? !!c.usado_em :
      filtro === 'nao_vieram' ? !c.usado_em :
      filtro === 'alunos' ? c.tipo === 'aluno' :
      c.tipo === 'convidado'
    const matchBusca = busca === '' || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  const total = convites.length
  const compareceram = convites.filter(c => c.usado_em).length
  const naoVieram = total - compareceram
  const alunos = convites.filter(c => c.tipo === 'aluno').length
  const convidados = convites.filter(c => c.tipo === 'convidado').length

  if (!autenticado) return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.titulo}>🔐 Admin – Festa Junina</h2>
        <p style={{textAlign:'center',color:'#78350f',marginBottom:20}}>Acesso restrito</p>
        <input type="password" placeholder="Senha" value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={s.input} />
        <button onClick={login} style={s.btnPrimario}>Entrar</button>
      </div>
    </div>
  )

  return (
    <div style={{fontFamily:'Arial,sans-serif',background:'#fff8e1',minHeight:'100vh',padding:20}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{color:'#92400e'}}>🌽 Admin – Festa Junina 2025</h2>
          <button onClick={carregar} style={s.btnSecundario}>🔄 Atualizar</button>
        </div>

        {/* Cards de resumo */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
          {[
            {label:'Total inscritos', valor:total, cor:'#92400e'},
            {label:'Compareceram', valor:compareceram, cor:'#065f46'},
            {label:'Não vieram', valor:naoVieram, cor:'#991b1b'},
            {label:'Alunos', valor:alunos, cor:'#1e40af'},
            {label:'Convidados', valor:convidados, cor:'#6b21a8'},
          ].map((card,i) => (
            <div key={i} style={{background:'#fff',border:`2px solid ${card.cor}`,borderRadius:10,padding:16,textAlign:'center'}}>
              <div style={{fontSize:28,fontWeight:'bold',color:card.cor}}>{card.valor}</div>
              <div style={{fontSize:13,color:'#555'}}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros e busca */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          {['todos','alunos','convidados','compareceram','nao_vieram'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{...s.btnFiltro, background: filtro===f ? '#92400e' : '#fff', color: filtro===f ? '#fff' : '#92400e'}}>
              {f === 'todos' ? 'Todos' : f === 'nao_vieram' ? 'Não vieram' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <input placeholder="🔍 Buscar nome ou email..." value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{...s.input, flex:1, minWidth:200, marginBottom:0}} />
        </div>

        {/* Tabela */}
        {carregando ? <p style={{textAlign:'center'}}>Carregando...</p> : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <thead>
                <tr style={{background:'#92400e',color:'#fff'}}>
                  {['Nome','Email','Tipo','Convidado de','Inscrito em','Compareceu'].map(h => (
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:13}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c,i) => (
                  <tr key={c.id} style={{background: i%2===0 ? '#fff' : '#fffbf0', borderBottom:'1px solid #e5e7eb'}}>
                    <td style={s.td}>{c.nome}</td>
                    <td style={s.td}>{c.email}</td>
                    <td style={s.td}>
                      <span style={{background: c.tipo==='aluno' ? '#dbeafe' : '#ede9fe', color: c.tipo==='aluno' ? '#1e40af' : '#6b21a8', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:'bold'}}>
                        {c.tipo}
                      </span>
                    </td>
                    <td style={s.td}>{c.convidado_de || '—'}</td>
                    <td style={s.td}>{c.criado_em ? new Date(c.criado_em).toLocaleString('pt-BR') : '—'}</td>
                    <td style={s.td}>
                      {c.usado_em
                        ? <span style={{color:'#065f46',fontWeight:'bold'}}>✅ {new Date(c.usado_em).toLocaleString('pt-BR')}</span>
                        : <span style={{color:'#991b1b'}}>❌ Não</span>}
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:20,color:'#888'}}>Nenhum resultado encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: {minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20},
  card: {background:'#fff',border:'2px solid #d97706',borderRadius:14,padding:28,width:'100%',maxWidth:400},
  titulo: {color:'#92400e',textAlign:'center',marginBottom:6},
  input: {width:'100%',padding:10,border:'1px solid #d97706',borderRadius:6,fontSize:15,marginBottom:12,boxSizing:'border-box'},
  btnPrimario: {width:'100%',padding:12,background:'#92400e',color:'#fff',border:'none',borderRadius:8,fontSize:16,fontWeight:'bold',cursor:'pointer'},
  btnSecundario: {padding:'8px 16px',background:'#fff',color:'#92400e',border:'2px solid #92400e',borderRadius:8,cursor:'pointer',fontWeight:'bold'},
  btnFiltro: {padding:'6px 14px',border:'2px solid #92400e',borderRadius:20,cursor:'pointer',fontWeight:'bold',fontSize:13},
  td: {padding:'10px 12px',fontSize:13}
}