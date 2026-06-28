import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

// ── Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#f7f5f0', paper: '#ffffff', ink: '#1a1a1a',
  inkMid: '#6b6560', inkFaint: '#b0aca6', rule: '#e8e4df',
  green: '#2d7a4f', greenBg: '#edf7f1',
  amber: '#b45309', amberBg: '#fef3e2',
  red: '#c0392b', redBg: '#fdf0ef',
  blue: '#1d4ed8', blueBg: '#eff6ff',
  purple: '#7c3aed', purpleBg: '#f5f3ff',
}

const CATS = [
  { id: 'cozinha', label: 'Cozinha', emoji: '🍳' },
  { id: 'casa',    label: 'Casa',    emoji: '🏠' },
  { id: 'tech',    label: 'Tech',    emoji: '💻' },
  { id: 'saude',   label: 'Saúde',  emoji: '🏃' },
  { id: 'outro',   label: 'Outro',   emoji: '📦' },
]

const PRIOS = [
  { id: 'logo',      label: 'Assim que der', color: C.green,  bg: C.greenBg },
  { id: 'planejado', label: 'Planejado',      color: C.amber,  bg: C.amberBg },
  { id: 'sonho',     label: 'Um dia',         color: C.purple, bg: C.purpleBg },
]

const STATUSES = [
  { id: 'quero',       label: 'Quero comprar', color: C.inkMid, bg: '#f0ede8', emoji: '🛒' },
  { id: 'pesquisando', label: 'Pesquisando',   color: C.blue,   bg: C.blueBg,  emoji: '🔍' },
  { id: 'aguardando',  label: 'Aguardando',    color: C.amber,  bg: C.amberBg, emoji: '⏳' },
  { id: 'comprado',    label: 'Comprado',      color: C.green,  bg: C.greenBg, emoji: '✓'  },
]

const DEMO_ITEMS = [
  {
    id: 1, name: 'Máquina de lavar louças', brand: 'Brastemp', model: 'BLF08AB',
    estimatedPrice: 2800, paidPrice: null, cat: 'cozinha', prio: 'logo',
    status: 'pesquisando', note: 'Pelo menos 8 serviços', store: 'Magazine Luiza', storeLink: '',
    votes: { a: true, b: true },
    priceHistory: [
      { price: 3100, date: '2026-04-01', note: 'preço inicial' },
      { price: 2800, date: '2026-06-01', note: 'achou promoção' },
    ],
    addedAt: '2026-04-01',
  },
  {
    id: 2, name: 'Balança para café', brand: 'Felicita', model: 'Arc',
    estimatedPrice: 380, paidPrice: null, cat: 'cozinha', prio: 'logo',
    status: 'quero', note: '', store: '', storeLink: '',
    votes: { a: true, b: false }, priceHistory: [], addedAt: '2026-06-01',
  },
  {
    id: 3, name: 'Cafeteira de cápsula', brand: 'Nespresso', model: 'Vertuo Pop',
    estimatedPrice: 650, paidPrice: null, cat: 'cozinha', prio: 'planejado',
    status: 'quero', note: '', store: '', storeLink: '',
    votes: { a: true, b: true }, priceHistory: [], addedAt: '2026-06-10',
  },
]

// ── Helpers ───────────────────────────────────────────────────────
const fmt = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const todayStr = () => new Date().toISOString().slice(0, 10)
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

// ── Tiny UI ───────────────────────────────────────────────────────
const inputSt = {
  width: '100%', boxSizing: 'border-box',
  border: `1.5px solid ${C.rule}`, borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: C.ink,
  background: C.bg, outline: 'none', fontFamily: 'inherit',
}
const labelSt = {
  fontSize: 11, fontWeight: 700, color: C.inkMid,
  letterSpacing: '0.06em', display: 'block', marginBottom: 5,
}

function Tag({ children, color, bg }) {
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Chip({ active, onClick, children, color, bg }) {
  return (
    <button onClick={onClick} style={{
      border: `1.5px solid ${active ? color : C.rule}`,
      background: active ? bg : 'transparent',
      color: active ? color : C.inkMid,
      borderRadius: 20, padding: '5px 14px',
      fontSize: 13, fontWeight: active ? 700 : 400,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

function Field({ label, children }) {
  return <div><label style={labelSt}>{label}</label>{children}</div>
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.paper, borderRadius: '20px 20px 0 0', padding: '24px 22px 40px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.inkMid, fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function VoteBar({ votes, myId, onVote }) {
  const yes = [votes.a, votes.b].filter(Boolean).length
  const myVote = votes[myId]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onVote} style={{
        border: `1.5px solid ${myVote ? C.green : C.rule}`,
        background: myVote ? C.greenBg : 'transparent',
        color: myVote ? C.green : C.inkFaint,
        borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}>
        {myVote ? '✓ quero' : '+ quero'}
      </button>
      <span style={{ fontSize: 12, color: yes === 2 ? C.green : C.inkMid, fontWeight: yes === 2 ? 700 : 400 }}>
        {yes}/2 {yes === 2 ? '· ambos querem ✓' : yes === 1 ? '· só um quer' : '· ninguém votou'}
      </span>
    </div>
  )
}

function StatusPill({ status }) {
  const s = STATUSES.find(x => x.id === status) || STATUSES[0]
  return <Tag color={s.color} bg={s.bg}>{s.emoji} {s.label}</Tag>
}

function PriceHistory({ history }) {
  if (!history || history.length === 0)
    return <p style={{ fontSize: 12, color: C.inkFaint, margin: 0 }}>Nenhum preço registrado ainda.</p>
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {[...history].reverse().map((h, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 10px', background: C.bg, borderRadius: 8 }}>
          <div>
            <span style={{ fontWeight: 700, color: C.ink }}>{fmt(h.price)}</span>
            {h.note && <span style={{ color: C.inkMid, marginLeft: 8 }}>{h.note}</span>}
          </div>
          <span style={{ color: C.inkFaint, fontSize: 11 }}>
            {h.date ? new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

function ItemCard({ item, myId, idx, total, onEdit, onVote, onMoveUp, onMoveDown, canAfford, onAddPrice, onMarkBought }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATS.find(c => c.id === item.cat) || CATS[4]
  const prio = PRIOS.find(p => p.id === item.prio) || PRIOS[1]
  const isComprado = item.status === 'comprado'

  return (
    <div style={{ background: C.paper, border: `1.5px solid ${canAfford && !isComprado ? C.green : C.rule}`, borderRadius: 14, overflow: 'hidden', opacity: isComprado ? 0.6 : 1 }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: isComprado ? C.inkFaint : C.ink, textDecoration: isComprado ? 'line-through' : 'none' }}>{item.name}</div>
                {(item.brand || item.model) && <div style={{ fontSize: 12, color: C.inkMid, marginTop: 1 }}>{[item.brand, item.model].filter(Boolean).join(' · ')}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: canAfford && !isComprado ? C.green : isComprado ? C.inkFaint : C.ink }}>{fmt(item.estimatedPrice)}</div>
                {item.paidPrice && item.paidPrice !== item.estimatedPrice && (
                  <div style={{ fontSize: 11, color: item.paidPrice < item.estimatedPrice ? C.green : C.amber }}>pago {fmt(item.paidPrice)}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
              <StatusPill status={item.status} />
              <Tag color={prio.color} bg={prio.bg}>{prio.label}</Tag>
              <span style={{ fontSize: 12, color: C.inkMid }}>{cat.emoji} {cat.label}</span>
              {canAfford && !isComprado && <Tag color={C.green} bg={C.greenBg}>✓ cabe agora</Tag>}
            </div>

            {item.store && (
              <div style={{ marginTop: 7, fontSize: 12, color: C.inkMid }}>
                🏪 {item.storeLink
                  ? <a href={item.storeLink} target="_blank" rel="noreferrer" style={{ color: C.blue }}>{item.store}</a>
                  : item.store}
              </div>
            )}

            {item.note && <div style={{ marginTop: 6, fontSize: 12, color: C.inkMid, borderLeft: `2px solid ${C.rule}`, paddingLeft: 8 }}>{item.note}</div>}

            <div style={{ marginTop: 10 }}>
              <VoteBar votes={item.votes} myId={myId} onVote={() => onVote(item.id)} />
            </div>

            {!isComprado && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => onAddPrice(item.id)} style={{ fontSize: 12, color: C.blue, background: 'none', border: `1px solid ${C.blue}30`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                  + registrar preço
                </button>
                <button onClick={() => onMarkBought(item.id)} style={{ fontSize: 12, color: C.green, background: 'none', border: `1px solid ${C.green}30`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                  ✓ marcar comprado
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button onClick={() => onEdit(item)} style={{ background: 'none', border: `1px solid ${C.rule}`, borderRadius: 7, padding: '4px 8px', fontSize: 11, color: C.inkMid, cursor: 'pointer' }}>editar</button>
            {!isComprado && <>
              <button onClick={onMoveUp} disabled={idx === 0} style={{ background: 'none', border: `1px solid ${C.rule}`, borderRadius: 7, padding: '4px 8px', fontSize: 11, color: C.inkMid, cursor: 'pointer', opacity: idx === 0 ? 0.25 : 1 }}>↑</button>
              <button onClick={onMoveDown} disabled={idx === total - 1} style={{ background: 'none', border: `1px solid ${C.rule}`, borderRadius: 7, padding: '4px 8px', fontSize: 11, color: C.inkMid, cursor: 'pointer', opacity: idx === total - 1 ? 0.25 : 1 }}>↓</button>
            </>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.rule}` }}>
        <button onClick={() => setExpanded(e => !e)} style={{ width: '100%', background: 'none', border: 'none', padding: '8px 16px', fontSize: 12, color: C.inkMid, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
          <span>📊 Histórico de preço ({item.priceHistory.length})</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>
        {expanded && <div style={{ padding: '4px 16px 14px' }}><PriceHistory history={item.priceHistory} /></div>}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', brand: '', model: '', estimatedPrice: '', cat: 'cozinha', prio: 'planejado', status: 'quero', note: '', store: '', storeLink: '' }

export default function App() {
  // Identity (persisted in localStorage)
  const [myId]     = useState(() => localStorage.getItem('myId') || null)
  const [myName]   = useState(() => localStorage.getItem('myName') || '')
  const [roomCode] = useState(() => localStorage.getItem('roomCode') || '')
  const [setupStep, setSetupStep] = useState(() => localStorage.getItem('roomCode') ? 'done' : 'choose')

  const [nameInput, setNameInput] = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [pendingId, setPendingId] = useState(null)   // 'a' | 'b'
  const [pendingCode, setPendingCode] = useState('')
  const [pendingName, setPendingName] = useState('')

  // Data
  const [items, setItems] = useState([])
  const [lastSync, setLastSync] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const channelRef = useRef(null)

  // UI
  const [filter, setFilter] = useState('all')
  const [disponivel, setDisponivel] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [priceEntry, setPriceEntry] = useState({ price: '', note: '', date: todayStr() })
  const [showPriceModal, setShowPriceModal] = useState(null)
  const [showPaidModal, setShowPaidModal] = useState(null)
  const [paidInput, setPaidInput] = useState('')
  const [toast, setToast] = useState(null)
  const [copyMsg, setCopyMsg] = useState(false)

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  // ── Supabase: load & realtime ────────────────────────────────
  const loadRoom = useCallback(async (code) => {
    setSyncing(true)
    const { data } = await supabase
      .from('rooms')
      .select('items')
      .eq('code', code)
      .single()
    if (data?.items) { setItems(data.items); setLastSync(new Date()) }
    setSyncing(false)
  }, [])

  const saveRoom = useCallback(async (code, newItems) => {
    await supabase.from('rooms').upsert({ code, items: newItems, updated_at: new Date().toISOString() })
  }, [])

  useEffect(() => {
    if (setupStep !== 'done' || !roomCode) return

    loadRoom(roomCode)

    // Realtime subscription
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
        payload => { setItems(payload.new.items); setLastSync(new Date()) }
      )
      .subscribe()

    channelRef.current = channel
    return () => { channel.unsubscribe() }
  }, [setupStep, roomCode, loadRoom])

  // ── Setup ────────────────────────────────────────────────────
  async function createRoom() {
    if (!nameInput.trim()) return
    const code = genCode()
    await saveRoom(code, DEMO_ITEMS)
    localStorage.setItem('roomCode', code)
    localStorage.setItem('myId', 'a')
    localStorage.setItem('myName', nameInput.trim())
    window.location.reload()
  }

  async function joinRoom() {
    if (!nameInput.trim() || !joinInput.trim()) return
    const code = joinInput.trim().toUpperCase()
    const { data } = await supabase.from('rooms').select('code').eq('code', code).single()
    if (!data) { showToast('Sala não encontrada'); return }
    localStorage.setItem('roomCode', code)
    localStorage.setItem('myId', 'b')
    localStorage.setItem('myName', nameInput.trim())
    window.location.reload()
  }

  function leaveRoom() {
    localStorage.clear()
    window.location.reload()
  }

  // ── Mutations ────────────────────────────────────────────────
  async function mutate(newItems) {
    setItems(newItems)
    await saveRoom(roomCode, newItems)
  }

  function openNew() { setForm(EMPTY_FORM); setEditItem(null); setShowForm(true) }
  function openEdit(item) {
    setForm({ name: item.name, brand: item.brand||'', model: item.model||'', estimatedPrice: item.estimatedPrice, cat: item.cat, prio: item.prio, status: item.status, note: item.note||'', store: item.store||'', storeLink: item.storeLink||'' })
    setEditItem(item); setShowForm(true)
  }

  async function saveItem() {
    if (!form.name.trim() || !form.estimatedPrice) return
    const newItems = editItem
      ? items.map(i => i.id === editItem.id ? { ...i, ...form, estimatedPrice: parseFloat(form.estimatedPrice) } : i)
      : [...items, { ...form, id: Date.now(), estimatedPrice: parseFloat(form.estimatedPrice), paidPrice: null, votes: { a: myId === 'a', b: myId === 'b' }, priceHistory: [], addedAt: todayStr() }]
    await mutate(newItems); setShowForm(false)
  }

  async function removeItem(id) { await mutate(items.filter(i => i.id !== id)); setShowForm(false) }

  async function toggleVote(id) {
    await mutate(items.map(i => i.id !== id ? i : { ...i, votes: { ...i.votes, [myId]: !i.votes[myId] } }))
  }

  async function addPriceEntry(id) {
    if (!priceEntry.price) return
    const newItems = items.map(i => i.id !== id ? i : {
      ...i, estimatedPrice: parseFloat(priceEntry.price),
      priceHistory: [...i.priceHistory, { price: parseFloat(priceEntry.price), note: priceEntry.note, date: priceEntry.date }],
    })
    await mutate(newItems)
    setPriceEntry({ price: '', note: '', date: todayStr() })
    setShowPriceModal(null); showToast('Preço registrado!')
  }

  async function markBought(id) {
    const item = items.find(i => i.id === id)
    const paid = parseFloat(paidInput) || item?.estimatedPrice
    const newItems = items.map(i => i.id !== id ? i : {
      ...i, status: 'comprado', paidPrice: paid,
      priceHistory: [...i.priceHistory, { price: paid, note: 'preço pago', date: todayStr() }],
    })
    await mutate(newItems); setShowPaidModal(null); setPaidInput(''); showToast('✓ Comprado!')
  }

  function moveUp(id) {
    const idx = items.findIndex(i => i.id === id); if (idx <= 0) return
    const n = [...items]; [n[idx-1],n[idx]]=[n[idx],n[idx-1]]; mutate(n)
  }
  function moveDown(id) {
    const idx = items.findIndex(i => i.id === id); if (idx >= items.length - 1) return
    const n = [...items]; [n[idx+1],n[idx]]=[n[idx],n[idx+1]]; mutate(n)
  }

  // ── Derived ──────────────────────────────────────────────────
  const pending = items.filter(i => i.status !== 'comprado')
  const bought  = items.filter(i => i.status === 'comprado')
  const totalPending = pending.reduce((s,i) => s + i.estimatedPrice, 0)
  const totalBought  = bought.reduce((s,i) => s + (i.paidPrice || i.estimatedPrice), 0)
  const disp = parseFloat(disponivel) || 0
  const canAffordSet = new Set()
  if (disp > 0) { let acc=0; for (const i of pending) { if (acc+i.estimatedPrice<=disp){canAffordSet.add(i.id);acc+=i.estimatedPrice} } }

  const visible = items.filter(i => {
    if (filter === 'comprado') return i.status === 'comprado'
    if (filter === 'all') return i.status !== 'comprado'
    if (['logo','planejado','sonho'].includes(filter)) return i.status !== 'comprado' && i.prio === filter
    return i.status === filter
  })
  const visiblePending = visible.filter(i => i.status !== 'comprado')

  // ── Setup screens ─────────────────────────────────────────────
  const centerWrap = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }
  const card = { background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 20, padding: 32, width: '100%', maxWidth: 380 }

  if (setupStep === 'choose') return (
    <div style={centerWrap}>
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.03em' }}>Lista de compras</h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: C.inkMid }}>Para dois. À vista, sem parcela.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={() => setSetupStep('create')} style={{ background: C.ink, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Criar nova lista</button>
          <button onClick={() => setSetupStep('join')} style={{ background: 'transparent', color: C.ink, border: `1.5px solid ${C.rule}`, borderRadius: 12, padding: 13, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Entrar numa lista existente</button>
        </div>
      </div>
    </div>
  )

  if (setupStep === 'create') return (
    <div style={centerWrap}>
      <div style={card}>
        <button onClick={() => setSetupStep('choose')} style={{ background:'none',border:'none',color:C.inkMid,cursor:'pointer',fontSize:13,marginBottom:16,padding:0 }}>← voltar</button>
        <h2 style={{ margin:'0 0 20px',fontSize:18,fontWeight:800,color:C.ink }}>Criar lista</h2>
        <div style={{ display:'grid',gap:14 }}>
          <Field label="SEU NOME"><input style={inputSt} value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Ex: João" /></Field>
          <button onClick={createRoom} style={{ background:C.ink,color:'#fff',border:'none',borderRadius:12,padding:13,fontWeight:700,fontSize:14,cursor:'pointer' }}>Criar e entrar</button>
        </div>
        <p style={{ fontSize:12,color:C.inkFaint,marginTop:16,lineHeight:1.5 }}>Você receberá um código para compartilhar com a outra pessoa.</p>
      </div>
    </div>
  )

  if (setupStep === 'join') return (
    <div style={centerWrap}>
      <div style={card}>
        <button onClick={() => setSetupStep('choose')} style={{ background:'none',border:'none',color:C.inkMid,cursor:'pointer',fontSize:13,marginBottom:16,padding:0 }}>← voltar</button>
        <h2 style={{ margin:'0 0 20px',fontSize:18,fontWeight:800,color:C.ink }}>Entrar na lista</h2>
        <div style={{ display:'grid',gap:14 }}>
          <Field label="SEU NOME"><input style={inputSt} value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Ex: Maria" /></Field>
          <Field label="CÓDIGO DA LISTA">
            <input style={{ ...inputSt,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.1em',fontSize:18 }} value={joinInput} onChange={e=>setJoinInput(e.target.value)} placeholder="ABC123" maxLength={6} />
          </Field>
          <button onClick={joinRoom} style={{ background:C.ink,color:'#fff',border:'none',borderRadius:12,padding:13,fontWeight:700,fontSize:14,cursor:'pointer' }}>Entrar</button>
        </div>
      </div>
    </div>
  )

  // ── Main app ──────────────────────────────────────────────────
  const priceModalItem = items.find(i => i.id === showPriceModal)
  const paidModalItem  = items.find(i => i.id === showPaidModal)

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      {toast && (
        <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:C.ink,color:'#fff',padding:'10px 20px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:200,whiteSpace:'nowrap' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ background:C.paper,borderBottom:`1px solid ${C.rule}`,padding:'18px 20px 0',position:'sticky',top:0,zIndex:10 }}>
        <div style={{ maxWidth:600,margin:'0 auto' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
            <div>
              <h1 style={{ margin:0,fontSize:20,fontWeight:900,color:C.ink,letterSpacing:'-0.03em' }}>Lista de compras</h1>
              <div style={{ marginTop:4,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
                <span style={{ fontSize:12,color:C.inkMid }}>👤 {myName} · sala <b style={{ fontFamily:'monospace',letterSpacing:'0.05em' }}>{roomCode}</b></span>
                <button onClick={() => { navigator.clipboard?.writeText(roomCode); setCopyMsg(true); setTimeout(()=>setCopyMsg(false),1500) }}
                  style={{ fontSize:11,color:C.blue,background:'none',border:'none',cursor:'pointer',textDecoration:'underline',padding:0 }}>
                  {copyMsg ? 'copiado!' : 'copiar código'}
                </button>
                {syncing && <span style={{ fontSize:11,color:C.inkFaint }}>sincronizando…</span>}
                {lastSync && !syncing && <span style={{ fontSize:11,color:C.inkFaint }}>✓ {lastSync.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
              </div>
            </div>
            <button onClick={openNew} style={{ background:C.ink,color:'#fff',border:'none',borderRadius:10,padding:'9px 16px',fontWeight:700,fontSize:13,cursor:'pointer',flexShrink:0 }}>+ Adicionar</button>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:1,background:C.rule,borderRadius:'12px 12px 0 0',overflow:'hidden' }}>
            {[
              { label:'Falta comprar', val:fmt(totalPending), color:C.ink },
              { label:'Já compramos',  val:fmt(totalBought),  color:C.green },
              { label:`${pending.length} pendente${pending.length!==1?'s':''}`, val:`${bought.length} comprado${bought.length!==1?'s':''}`, color:C.inkMid },
            ].map((s,i) => (
              <div key={i} style={{ background:C.paper,padding:'12px 14px',textAlign:'center' }}>
                <div style={{ fontSize:15,fontWeight:800,color:s.color }}>{s.val}</div>
                <div style={{ fontSize:11,color:C.inkFaint,marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex',gap:8,overflowX:'auto',padding:'12px 0',scrollbarWidth:'none' }}>
            <Chip active={filter==='all'} onClick={()=>setFilter('all')} color={C.ink} bg="#f0ede8">Todos</Chip>
            {PRIOS.map(p=><Chip key={p.id} active={filter===p.id} onClick={()=>setFilter(p.id)} color={p.color} bg={p.bg}>{p.label}</Chip>)}
            {STATUSES.slice(1,3).map(s=><Chip key={s.id} active={filter===s.id} onClick={()=>setFilter(s.id)} color={s.color} bg={s.bg}>{s.emoji} {s.label}</Chip>)}
            <Chip active={filter==='comprado'} onClick={()=>setFilter('comprado')} color={C.green} bg={C.greenBg}>✓ Comprados</Chip>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:600,margin:'0 auto',padding:'20px 20px 80px' }}>
        <div style={{ background:C.paper,border:`1px solid ${C.rule}`,borderRadius:14,padding:'14px 16px',marginBottom:18 }}>
          <Field label="QUANTO TEMOS DISPONÍVEL AGORA (R$)">
            <input type="number" value={disponivel} onChange={e=>setDisponivel(e.target.value)} placeholder="0,00" style={{ ...inputSt,fontSize:17,fontWeight:700 }} />
          </Field>
          {disp>0 && (
            <div style={{ marginTop:10,fontSize:13,fontWeight:600,color:canAffordSet.size>0?C.green:C.amber }}>
              {canAffordSet.size>0 ? `✓ Dá pra comprar ${canAffordSet.size} item${canAffordSet.size>1?'s':''} em ordem de prioridade` : 'Ainda não chega no primeiro item'}
            </div>
          )}
        </div>

        {visible.length===0 && (
          <div style={{ textAlign:'center',padding:'50px 0',color:C.inkFaint }}>
            <div style={{ fontSize:36 }}>🛒</div>
            <div style={{ marginTop:10,fontSize:14 }}>Nada aqui ainda.</div>
          </div>
        )}

        <div style={{ display:'grid',gap:10 }}>
          {visible.map((item,idx) => (
            <ItemCard
              key={item.id} item={item} myId={myId}
              idx={idx} total={visiblePending.length}
              onEdit={openEdit} onVote={toggleVote}
              onMoveUp={()=>moveUp(item.id)} onMoveDown={()=>moveDown(item.id)}
              canAfford={canAffordSet.has(item.id)}
              onAddPrice={id=>{ setShowPriceModal(id); setPriceEntry({price:'',note:'',date:todayStr()}) }}
              onMarkBought={id=>{ setShowPaidModal(id); setPaidInput(String(items.find(i=>i.id===id)?.estimatedPrice||'')) }}
            />
          ))}
        </div>

        <div style={{ marginTop:30,textAlign:'center' }}>
          <button onClick={leaveRoom} style={{ fontSize:12,color:C.inkFaint,background:'none',border:'none',cursor:'pointer',textDecoration:'underline' }}>Sair desta lista</button>
        </div>
      </div>

      {/* Modal: Add/Edit */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editItem?'Editar item':'Novo item'}>
        <div style={{ display:'grid',gap:13 }}>
          <Field label="NOME DO PRODUTO"><input style={inputSt} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Cafeteira de cápsula" /></Field>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <Field label="MARCA"><input style={inputSt} value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} placeholder="Nespresso" /></Field>
            <Field label="MODELO"><input style={inputSt} value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} placeholder="Vertuo Pop" /></Field>
          </div>
          <Field label="PREÇO ESTIMADO (R$)"><input style={inputSt} type="number" value={form.estimatedPrice} onChange={e=>setForm(f=>({...f,estimatedPrice:e.target.value}))} placeholder="0,00" /></Field>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
            <Field label="CATEGORIA"><select style={inputSt} value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>{CATS.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select></Field>
            <Field label="PRIORIDADE"><select style={inputSt} value={form.prio} onChange={e=>setForm(f=>({...f,prio:e.target.value}))}>{PRIOS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
            <Field label="STATUS"><select style={inputSt} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}</select></Field>
          </div>
          <Field label="LOJA"><input style={inputSt} value={form.store} onChange={e=>setForm(f=>({...f,store:e.target.value}))} placeholder="Ex: Magazine Luiza" /></Field>
          <Field label="LINK (opcional)"><input style={inputSt} value={form.storeLink} onChange={e=>setForm(f=>({...f,storeLink:e.target.value}))} placeholder="https://..." /></Field>
          <Field label="OBSERVAÇÃO"><input style={inputSt} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Detalhes, modelo preferido..." /></Field>
          <div style={{ display:'flex',gap:10,marginTop:4 }}>
            <button onClick={saveItem} style={{ flex:1,background:C.ink,color:'#fff',border:'none',borderRadius:12,padding:13,fontWeight:700,fontSize:14,cursor:'pointer' }}>{editItem?'Salvar':'Adicionar'}</button>
            {editItem && <button onClick={()=>removeItem(editItem.id)} style={{ background:C.redBg,color:C.red,border:`1px solid ${C.red}30`,borderRadius:12,padding:'13px 16px',fontWeight:700,fontSize:14,cursor:'pointer' }}>Remover</button>}
          </div>
        </div>
      </Modal>

      {/* Modal: registrar preço */}
      <Modal open={!!showPriceModal} onClose={()=>setShowPriceModal(null)} title={`Registrar preço · ${priceModalItem?.name||''}`}>
        <div style={{ display:'grid',gap:13 }}>
          <Field label="PREÇO ENCONTRADO (R$)"><input style={{ ...inputSt,fontSize:18,fontWeight:700 }} type="number" value={priceEntry.price} onChange={e=>setPriceEntry(p=>({...p,price:e.target.value}))} placeholder="0,00" /></Field>
          <Field label="ONDE / OBSERVAÇÃO"><input style={inputSt} value={priceEntry.note} onChange={e=>setPriceEntry(p=>({...p,note:e.target.value}))} placeholder="Ex: Magalu com cupom" /></Field>
          <Field label="DATA"><input style={inputSt} type="date" value={priceEntry.date} onChange={e=>setPriceEntry(p=>({...p,date:e.target.value}))} /></Field>
          <button onClick={()=>addPriceEntry(showPriceModal)} style={{ background:C.ink,color:'#fff',border:'none',borderRadius:12,padding:13,fontWeight:700,fontSize:14,cursor:'pointer' }}>Salvar preço</button>
        </div>
      </Modal>

      {/* Modal: marcar comprado */}
      <Modal open={!!showPaidModal} onClose={()=>setShowPaidModal(null)} title={`Comprado! · ${paidModalItem?.name||''}`}>
        <div style={{ display:'grid',gap:13 }}>
          <Field label="PREÇO PAGO (R$)"><input style={{ ...inputSt,fontSize:18,fontWeight:700 }} type="number" value={paidInput} onChange={e=>setPaidInput(e.target.value)} /></Field>
          {paidModalItem && paidInput && parseFloat(paidInput) !== paidModalItem.estimatedPrice && (
            <div style={{ fontSize:13,fontWeight:600,color:parseFloat(paidInput)<paidModalItem.estimatedPrice?C.green:C.amber }}>
              {parseFloat(paidInput)<paidModalItem.estimatedPrice
                ? `✓ Economizou ${fmt(paidModalItem.estimatedPrice-parseFloat(paidInput))} vs estimativa`
                : `Gastou ${fmt(parseFloat(paidInput)-paidModalItem.estimatedPrice)} a mais vs estimativa`}
            </div>
          )}
          <button onClick={()=>markBought(showPaidModal)} style={{ background:C.green,color:'#fff',border:'none',borderRadius:12,padding:13,fontWeight:700,fontSize:14,cursor:'pointer' }}>✓ Confirmar compra</button>
        </div>
      </Modal>
    </div>
  )
}
