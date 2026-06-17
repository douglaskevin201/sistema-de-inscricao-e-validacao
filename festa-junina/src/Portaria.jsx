import { useState, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from './supabase'

export default function Portaria() {
  // --- CONFIGURAÇÃO DE ACESSO ---
  const SENHA_CORRETA = 'FESTA2026'
  const [senhaInput, setSenhaInput] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [erroSenha, setErroSenha] = useState(false)
  // ------------------------------

  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [scannerAtivo, setScannerAtivo] = useState(false)
  const [scannerStarting, setScannerStarting] = useState(false)
  const [scannerErro, setScannerErro] = useState('')
  const [scannerStatus, setScannerStatus] = useState('')
  const html5QrcodeRef = useRef(null)
  const scannerStartingRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      stopScanner()
    }
  }, [])

  // Função para validar a senha da portaria
  function verificarSenha(e) {
    e.preventDefault()
    if (senhaInput === SENHA_CORRETA) {
      setAutenticado(true)
      setErroSenha(false)
    } else {
      setErroSenha(true)
    }
  }

  async function validarCodigo(cod) {
    const codigoFinal = cod.trim().toUpperCase()
    if (!codigoFinal) return
    setCarregando(true)
    setResultado(null)
    const { data, error } = await supabase
      .from('convites').select('*')
      .eq('codigo', codigoFinal).single()

    if (error || !data) {
      setResultado({ status: 'invalido' })
    } else if (data.usado_em) {
      setResultado({ status: 'ja_usado', nome: data.nome, tipo: data.tipo, usado_em: new Date(data.usado_em).toLocaleString('pt-BR') })
    } else {
      await supabase.from('convites').update({ usado_em: new Date() }).eq('codigo', codigoFinal)
      setResultado({ status: 'ok', nome: data.nome, tipo: data.tipo, convidado_de: data.convidado_de })
    }
    setCodigo('')
    setCarregando(false)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setResultado(null), 6000)
  }

  async function startScanner() {
    setScannerErro('')
    if (scannerAtivo || scannerStarting) return
    setScannerStatus('Abrindo câmera...')
    scannerStartingRef.current = true
    setScannerStarting(true)
  }

  useEffect(() => {
    if (!scannerStarting) return

    async function initScanner() {
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (!scannerStartingRef.current) return

        if (!cameras || cameras.length === 0) {
          setScannerErro('Nenhuma câmera encontrada.')
          setScannerStarting(false)
          scannerStartingRef.current = false
          setScannerStatus('')
          return
        }

        const preferredCamera = cameras.find(cam => /back|rear|environment|traseira/i.test(cam.label)) || cameras[0]
        const cameraId = preferredCamera?.id
        const cameraConfig = cameraId
          ? cameraId
          : { facingMode: { exact: 'environment' } }
        const html5QrCode = new Html5Qrcode('qr-reader')
        html5QrcodeRef.current = html5QrCode

        if (!scannerStartingRef.current) return

        await html5QrCode.start(
          cameraConfig,
          { fps: 10, qrbox: 250 },
          decodedText => {
            stopScanner()
            validarCodigo(decodedText)
          },
          errorMessage => {
            console.debug('QR scan error:', errorMessage)
          }
        )

        if (!scannerStartingRef.current) return

        setScannerAtivo(true)
        setScannerStatus('Aponte a câmera para o QR Code')
      } catch (error) {
        const mensagem = error?.message || String(error)
        setScannerErro(`Não foi possível iniciar a câmera: ${mensagem}`)
        setScannerStatus('')
      } finally {
        setScannerStarting(false)
        scannerStartingRef.current = false
      }
    }

    initScanner()
  }, [scannerStarting])

  async function stopScanner() {
    setScannerStatus('')
    scannerStartingRef.current = false
    setScannerStarting(false)
    const instance = html5QrcodeRef.current
    if (instance) {
      try {
        await instance.stop()
      } catch (error) {
        console.warn('Erro ao parar scanner', error)
      }
      instance.clear().catch(() => {})
      html5QrcodeRef.current = null
    }
    setScannerAtivo(false)
  }

  const cores = {
    ok:       { bg:'#d1fae5', cor:'#065f46', borda:'#10b981', icone:'✅', msg:'ENTRADA LIBERADA' },
    ja_usado: { bg:'#fef3c7', cor:'#92400e', borda:'#f59e0b', icone:'⚠️', msg:'CONVITE JÁ UTILIZADO' },
    invalido: { bg:'#fee2e2', cor:'#991b1b', borda:'#ef4444', icone:'❌', msg:'CONVITE INVÁLIDO' }
  }

  // --- TELA DE LOGIN (Bloqueio) ---
  if (!autenticado) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'#fff8e1'}}>
        <form onSubmit={verificarSenha} style={{background:'#fff',border:'2px solid #d97706',borderRadius:14,padding:28,width:'100%',maxWidth:420,textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,.08)'}}>
          <h2 style={{color:'#92400e',marginBottom:4}}>🔒 Acesso Restrito</h2>
          <p style={{color:'#78350f',fontSize:13,marginBottom:22}}>Portaria - Festa Junina UniEnsino 2026</p>
          
          <input 
            type="password"
            value={senhaInput}
            onChange={e => setSenhaInput(e.target.value)}
            placeholder="DIGITE A SENHA DA PORTARIA"
            style={{width:'100%',padding:14,fontSize:16,border:'2px solid #d97706',borderRadius:8,textAlign:'center',marginBottom:12,boxSizing:'border-box'}}
            autoFocus 
          />

          {erroSenha && <p style={{color:'#991b1b',fontSize:14,marginBottom:12,fontWeight:'bold'}}>⚠️ Senha incorreta!</p>}

          <button type="submit" style={{width:'100%',padding:14,background:'#92400e',color:'#fff',border:'none',borderRadius:8,fontSize:17,fontWeight:'bold',cursor:'pointer'}}>
            Entrar na Portaria
          </button>
        </form>
      </div>
    )
  }

  // --- TELA DO SCANNER ORIGINAL (Só renderiza se autenticado for true) ---
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'#fff8e1'}}>
      <div style={{background:'#fff',border:'2px solid #d97706',borderRadius:14,padding:28,width:'100%',maxWidth:420,textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,.08)'}}>
        <h2 style={{color:'#92400e',marginBottom:4}}>🎪 Portaria</h2>
        <p style={{color:'#78350f',fontSize:13,marginBottom:22}}>Festa Junina UniEnsino 2026</p>

        <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',marginBottom:18}}>
          <button onClick={startScanner}
            disabled={scannerAtivo || scannerStarting}
            style={{padding:'12px 18px',background:'#10b981',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>
            📷 Usar câmera
          </button>
          <button onClick={stopScanner}
            disabled={!scannerAtivo && !scannerStarting}
            style={{padding:'12px 18px',background:'#ef4444',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold'}}>
            ✕ Parar câmera
          </button>
        </div>

        {scannerErro && <p style={{color:'#991b1b',marginBottom:12}}>{scannerErro}</p>}
        {scannerStatus && !scannerErro && <p style={{color:'#065f46',marginBottom:12}}>{scannerStatus}</p>}

        {(scannerAtivo || scannerStarting) && (
          <div style={{margin:'0 auto 20px',width:'100%',maxWidth:420,border:'2px solid #d97706',borderRadius:12,overflow:'hidden'}}>
            <div id="qr-reader" style={{width:'100%',minHeight:320,background:'#000'}} />
          </div>
        )}

        <input value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && validarCodigo(codigo)}
          placeholder="CÓDIGO DO CONVITE"
          style={{width:'100%',padding:14,fontSize:22,border:'2px solid #d97706',borderRadius:8,textAlign:'center',letterSpacing:4,fontWeight:'bold',marginBottom:12,boxSizing:'border-box'}}
          autoFocus={!scannerAtivo} />

        <button onClick={() => validarCodigo(codigo)} disabled={carregando}
          style={{width:'100%',padding:14,background:'#92400e',color:'#fff',border:'none',borderRadius:8,fontSize:17,fontWeight:'bold',cursor:'pointer'}}>
          {carregando ? 'Verificando...' : '✅ Validar Convite'}
        </button>

        {resultado && (() => {
          const c = cores[resultado.status]
          return (
            <div style={{marginTop:20,padding:20,borderRadius:10,background:c.bg,border:`2px solid ${c.borda}`,color:c.cor}}>
              <div style={{fontSize:40}}>{c.icone}</div>
              <div style={{fontSize:20,fontWeight:'bold',marginTop:4}}>{c.msg}</div>
              {resultado.nome && <div style={{fontSize:16,fontWeight:'bold',marginTop:6}}>{resultado.nome}</div>}
              {resultado.tipo === 'convidado' && <div style={{fontSize:13,marginTop:2}}>Convidado de {resultado.convidado_de}</div>}
              {resultado.tipo === 'aluno' && <div style={{fontSize:13,marginTop:2}}>🎓 Aluno</div>}
              {resultado.usado_em && <div style={{fontSize:12,marginTop:4}}>Usado em: {resultado.usado_em}</div>}
              <div style={{fontSize:11,color:'#888',marginTop:8}}>Esta mensagem desaparece em 6 segundos</div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
