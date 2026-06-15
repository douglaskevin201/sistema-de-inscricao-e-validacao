import { useState } from 'react'
import * as XLSX from 'xlsx' // Importa a biblioteca para gerar o arquivo .xlsx
import { supabase } from './supabase'

const POR_PAGINA = 20

async function validarSenhaAdmin(senha) {
  const { data, error } = await supabase.functions.invoke('validar-admin', {
    body: JSON.stringify({ senha }),
    headers: { 'Content-Type': 'application/json' }
  })
  if (error) throw error
  return data?.ok === true
}

async function reenviarEmail(convite) {
  const { error } = await supabase.functions.invoke('enviar-email', {
    body: JSON.stringify({
      para: convite.email,
      nome: convite.nome,
      codigo: convite.codigo,
      tipo: convite.tipo,
      nomeAluno: convite.convidado_de || convite.nome
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  if (error) throw error
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [convites, setConvites] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [alunoSelecionado, setAlunoSelecionado] = useState('')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [reenviando, setReenviando] = useState(null)
  const [cancelando, setCancelando] = useState(null)

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase.from('convites').select('*').order('criado_em', { ascending: false })
    setConvites(data || [])
    setCarregando(false)
  }

  const [autenticando, setAutenticando] = useState(false)

  async function login() {
    if (!senha.trim()) {
      alert('Digite a senha do admin.')
      return
    }

    setAutenticando(true)
    try {
      const valid = await validarSenhaAdmin(senha)
      if (valid) {
        setAutenticado(true)
        carregar()
      } else {
        alert('Senha incorreta!')
      }
    } catch (err) {
      console.error('Erro ao validar senha admin:', err)
      alert('Erro ao validar administrador. Tente novamente.')
    } finally {
      setAutenticando(false)
    }
  }

  async function handleReenviar(convite) {
    setReenviando(convite.id)
    try {
      await reenviarEmail(convite)
      alert(`Email reenviado para ${convite.email}`)
    } catch {
      alert('Erro ao reenviar email.')
    }
    setReenviando(null)
  }

  async function handleCancelar(convite) {
    if (!confirm(`Cancelar convite de ${convite.nome}?`)) return
    setCancelando(convite.id)

    const idsToDelete = [convite.id]

    if (convite.tipo === 'aluno' && convite.nome) {
      const { data: convidados, error: convidadoError } = await supabase
        .from('convites')
        .select('id')
        .eq('convidado_de', convite.nome)

      if (convidadoError) {
        alert('Erro ao buscar convidados do aluno.')
        setCancelando(null)
        return
      }

      if (convidados && convidados.length > 0) {
        idsToDelete.push(...convidados.map(c => c.id))
      }
    }

    const { error } = await supabase
      .from('convites')
      .delete()
      .in('id', idsToDelete)

    if (error) {
      alert('Erro ao cancelar convite.')
      setCancelando(null)
      return
    }

    setConvites(prev => prev.filter(c => !idsToDelete.includes(c.id)))

    if (convite.tipo === 'aluno' && alunoSelecionado === convite.nome) {
      setAlunoSelecionado('')
    }

    alert(`Convite de ${convite.nome} cancelado com sucesso.`)
    setCancelando(null)
  }

  const filtrados = convites.filter(c => {
    const matchFiltro =
      filtro === 'todos' ? true :
      filtro === 'compareceram' ? !!c.usado_em :
      filtro === 'nao_vieram' ? !c.usado_em :
      filtro === 'alunos' ? c.tipo === 'aluno' :
      c.tipo === 'convidado'
    const matchBusca = busca === '' ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.email.toLowerCase().includes(busca.toLowerCase()) ||
      (c.cpf || '').includes(busca) ||
      (c.convidado_de || '').toLowerCase().includes(busca.toLowerCase())
    const matchAluno = !alunoSelecionado ? true : c.convidado_de === alunoSelecionado
    return matchFiltro && matchBusca && matchAluno
  })

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const total = convites.length
  const compareceram = convites.filter(c => c.usado_em).length
  const alunos = convites.filter(c => c.tipo === 'aluno').length
  const totalConvidados = convites.filter(c => c.tipo === 'convidado').length
  const alunosUnicos = Array.from(new Set(convites.filter(c => c.tipo === 'aluno').map(c => c.nome))).sort()
  const convidadosDoAluno = alunoSelecionado
    ? convites.filter(c => c.convidado_de === alunoSelecionado)
    : []
  const compareceramDoAluno = convidadosDoAluno.filter(c => c.usado_em).length

  function exportarExcelOrganizado() {
    if (filtrados.length === 0) {
      alert('Não há registros na tabela para exportar com os filtros atuais.')
      return
    }

    const dadosResumo = [
      { 'Indicador / Métrica': 'Total de Ingressos Gerados', 'Quantidade': total },
      { 'Indicador / Métrica': 'Alunos Cadastrados', 'Quantidade': alunos },
      { 'Indicador / Métrica': 'Convidados Cadastrados', 'Quantidade': totalConvidados },
      { 'Indicador / Métrica': 'Público Presente (Confirmados)', 'Quantidade': compareceram },
      { 'Indicador / Métrica': 'Ausentes', 'Quantidade': total - compareceram }
    ]

    const dadosAlunos = filtrados
      .filter(c => c.tipo === 'aluno')
      .map(c => ({
        'Nome Completo': c.nome,
        'E-mail': c.email,
        'CPF': c.cpf ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—',
        'Curso / Período': c.curso || '—',
        'Data de Inscrição': c.criado_em ? new Date(c.criado_em).toLocaleString('pt-BR') : '—',
        'Compareceu': c.usado_em ? `Sim (${new Date(c.usado_em).toLocaleString('pt-BR')})` : 'Não'
      }))

    const dadosConvidados = filtrados
      .filter(c => c.tipo === 'convidado')
      .map(c => ({
        'Nome do Convidado': c.nome,
        'E-mail': c.email,
        'Convidado de (Aluno)': c.convidado_de || '—',
        'Data de Inscrição': c.criado_em ? new Date(c.criado_em).toLocaleString('pt-BR') : '—',
        'Compareceu': c.usado_em ? `Sim (${new Date(c.usado_em).toLocaleString('pt-BR')})` : 'Não'
      }))

    const wsResumo = XLSX.utils.json_to_sheet(dadosResumo)
    const wsAlunos = XLSX.utils.json_to_sheet(dadosAlunos)
    const wsConvidados = XLSX.utils.json_to_sheet(dadosConvidados)

    const autoAjustarColunas = (planilha, dadosJson) => {
      if (!dadosJson || dadosJson.length === 0) return
      const colunas = Object.keys(dadosJson[0])
      planilha['!cols'] = colunas.map(key => ({
        wch: Math.max(
          key.length + 4,
          ...dadosJson.map(item => (item[key] ? item[key].toString().length + 2 : 10))
        )
      }))
    }

    autoAjustarColunas(wsResumo, dadosResumo)
    autoAjustarColunas(wsAlunos, dadosAlunos)
    autoAjustarColunas(wsConvidados, dadosConvidados)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, wsResumo, "Painel Geral")
    XLSX.utils.book_append_sheet(workbook, wsAlunos, "Lista de Alunos")
    XLSX.utils.book_append_sheet(workbook, wsConvidados, "Lista de Convidados")

    XLSX.writeFile(workbook, "Relatorio_Festa_Junina_UniEnsino_2026.xlsx")
  }

  if (!autenticado) return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.titulo}>🔐 Admin – Festa Junina</h2>
        <p style={{textAlign:'center',color:'#78350f',marginBottom:20}}>Acesso restrito</p>
        <input type="password" placeholder="Senha" value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={s.input} />
        <button onClick={login} disabled={autenticando} style={{...s.btnPrimario, opacity: autenticando ? 0.7 : 1}}>
          {autenticando ? 'Validando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{fontFamily:'Arial,sans-serif',background:'#fff8e1',minHeight:'100vh',padding:20}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:8}}>
          <h2 style={{color:'#92400e'}}>🌽 Admin – Festa Junina 2026</h2>
          <div style={{display:'flex',gap:8}}>
            <button onClick={exportarExcelOrganizado} style={s.btnVerde}>📥 Exportar Excel (.xlsx)</button>
            <button onClick={carregar} style={s.btnSecundario}>🔄 Atualizar</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24}}>
          {[
            {label:'Total inscritos', valor:total, cor:'#92400e'},
            {label:'Compareceram', valor:compareceram, cor:'#065f46'},
            {label:'Não vieram', valor:total-compareceram, cor:'#991b1b'},
            {label:'Alunos', valor:alunos, cor:'#1e40af'},
            {label:'Convidados', valor:totalConvidados, cor:'#6b21a8'},
            ...(alunoSelecionado ? [
              {label:`Convidados de ${alunoSelecionado}`, valor:convidadosDoAluno.length, cor:'#92400e'},
              {label:'Compareceram deste aluno', valor:compareceramDoAluno, cor:'#065f46'},
              {label:'Não vieram deste aluno', valor:convidadosDoAluno.length-compareceramDoAluno, cor:'#991b1b'},
            ] : [])
          ].map((card,i) => (
            <div key={i} style={{background:'#fff',border:`2px solid ${card.cor}`,borderRadius:10,padding:16,textAlign:'center'}}>
              <div style={{fontSize:30,fontWeight:'bold',color:card.cor}}>{card.valor}</div>
              <div style={{fontSize:13,color:'#555'}}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
          {[
            {key:'todos',label:'Todos'},
            {key:'alunos',label:'Alunos'},
            {key:'convidados',label:'Convidados'},
            {key:'compareceram',label:'Compareceram'},
            {key:'nao_vieram',label:'Não vieram'},
          ].map(f => (
            <button key={f.key} onClick={() => { setFiltro(f.key); setPagina(1) }}
              style={{padding:'6px 14px',border:'2px solid #92400e',borderRadius:20,cursor:'pointer',
                fontWeight:'bold',fontSize:13,
                background: filtro===f.key ? '#92400e' : '#fff',
                color: filtro===f.key ? '#fff' : '#92400e'}}>
              {f.label}
            </button>
          ))}
          <input placeholder="🔍 Buscar nome, email, CPF ou aluno..."
            value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }}
            style={{...s.input,flex:1,minWidth:180,marginBottom:0}} />
        </div>

        {alunosUnicos.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{color:'#555',fontSize:13,marginBottom:8}}>Clique no aluno para ver apenas os convidados dele:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              <button onClick={() => { setAlunoSelecionado(''); setPagina(1) }}
                style={{padding:'6px 14px',border:'2px solid #92400e',borderRadius:20,cursor:'pointer',
                  background: !alunoSelecionado ? '#92400e' : '#fff',
                  color: !alunoSelecionado ? '#fff' : '#92400e',fontWeight:'bold'}}>
                Todos os alunos
              </button>
              {alunosUnicos.map(nome => (
                <button key={nome} onClick={() => { setAlunoSelecionado(alunoSelecionado === nome ? '' : nome); setPagina(1) }}
                  style={{padding:'6px 14px',border:'2px solid #92400e',borderRadius:20,cursor:'pointer',
                    background: alunoSelecionado===nome ? '#92400e' : '#fff',
                    color: alunoSelecionado===nome ? '#fff' : '#92400e',fontWeight:'bold',whiteSpace:'nowrap'}}>
                  {nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{color:'#555',fontSize:13,marginBottom:10}}>
          Mostrando {filtrados.length === 0 ? 0 : ((pagina-1)*POR_PAGINA)+1}–{Math.min(pagina*POR_PAGINA, filtrados.length)} de {filtrados.length} registros
        </p>

        {carregando ? (
          <p style={{textAlign:'center',padding:40}}>Carregando...</p>
        ) : (
          <>
            <div style={{overflowX:'auto',borderRadius:10,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:'#fff'}}>
                <thead>
                  <tr style={{background:'#92400e',color:'#fff'}}>
                    {['Nome','Email','CPF','Tipo','Convidado de','Inscrito em','Compareceu','Ações'].map(h => (
                      <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:13,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginados.length === 0 ? (
                    <tr><td colSpan={8} style={{textAlign:'center',padding:30,color:'#888'}}>Nenhum resultado.</td></tr>
                  ) : paginados.map((c,i) => (
                    <tr key={c.id} style={{background:i%2===0?'#fff':'#fffbf0',borderBottom:'1px solid #e5e7eb'}}>
                      <td style={s.td}><strong>{c.nome}</strong></td>
                      <td style={s.td}>{c.email}</td>
                      <td style={s.td}>{c.cpf ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}</td>
                      <td style={s.td}>
                        <span style={{background:c.tipo==='aluno'?'#dbeafe':'#ede9fe',color:c.tipo==='aluno'?'#1e40af':'#6b21a8',padding:'2px 8px',borderRadius:20,fontSize:12,fontWeight:'bold'}}>
                          {c.tipo}
                        </span>
                      </td>
                      <td style={s.td}>{c.convidado_de || '—'}</td>
                      <td style={s.td}>{c.criado_em ? new Date(c.criado_em).toLocaleString('pt-BR') : '—'}</td>
                      <td style={s.td}>
                        {c.usado_em
                          ? <span style={{color:'#065f46',fontWeight:'bold',whiteSpace:'nowrap'}}>✅ {new Date(c.usado_em).toLocaleString('pt-BR')}</span>
                          : <span style={{color:'#991b1b'}}>❌ Não</span>}
                      </td>
                      <td style={s.td}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={() => handleReenviar(c)} disabled={reenviando===c.id}
                            style={{padding:'4px 8px',background:'#1e40af',color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer',whiteSpace:'nowrap'}}>
                            {reenviando===c.id ? '...' : '📧 Reenviar'}
                          </button>
                          <button onClick={() => handleCancelar(c)} disabled={cancelando===c.id}
                            style={{padding:'4px 8px',background:'#ef4444',color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer',whiteSpace:'nowrap'}}>
                            {cancelando===c.id ? '...' : '🗑️ Cancelar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16,flexWrap:'wrap'}}>
                <button onClick={() => setPagina(p => Math.max(1,p-1))} disabled={pagina===1}
                  style={{padding:'6px 14px',border:'2px solid #92400e',borderRadius:8,cursor:'pointer',background:'#fff',color:'#92400e',fontWeight:'bold'}}>
                  ← Anterior
                </button>
                {Array.from({length:totalPaginas},(_,i)=>i+1).map(p => (
                  <button key={p} onClick={() => setPagina(p)}
                    style={{padding:'6px 12px',border:'2px solid #92400e',borderRadius:8,cursor:'pointer',
                      background:pagina===p?'#92400e':'#fff',color:pagina===p?'#fff':'#92400e',fontWeight:'bold'}}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPagina(p => Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas}
                  style={{padding:'6px 14px',border:'2px solid #92400e',borderRadius:8,cursor:'pointer',background:'#fff',color:'#92400e',fontWeight:'bold'}}>
                  Próxima →
                </button>
              </div>
            )}
          </>
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
  btnVerde: {padding:'8px 16px',background:'#065f46',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'},
  td: {padding:'10px 12px',fontSize:13,whiteSpace:'nowrap'}
}