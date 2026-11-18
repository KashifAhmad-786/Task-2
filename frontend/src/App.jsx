import { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const emptyFarm = {
  farmName: '',
  location: '',
  farmSize: '',
  soilType: '',
  cropType: '',
  plantingDate: '',
  harvestDate: '',
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    leaf: <><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z" /><path d="M4 21c3-6 7-9 13-12" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

async function request(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the backend. Start it with npm run dev in the backend folder, then try again.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validationMessage = payload.errors?.map((error) => error.message).join(', ')
    throw new Error(validationMessage || payload.message || 'Something went wrong. Please try again.')
  }
  return payload
}

function formatDate(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function getSeasonStage(farm) {
  if (!farm.plantingDate || !farm.harvestDate) return 'Planning'
  const now = new Date()
  const planting = new Date(farm.plantingDate)
  const harvest = new Date(farm.harvestDate)
  if (now < planting) return 'Upcoming'
  if (now > harvest) return 'Harvested'
  return 'Growing'
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { token, user } = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('greenfield-session', JSON.stringify({ token, user }))
      onAuthenticated({ token, user })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-photo" aria-label="Sunlit fields at harvest">
        <div className="photo-mark"><Icon name="leaf" size={22} /> Greenfield</div>
        <div className="photo-caption"><span className="eyebrow">GROW WITH INTENTION</span><h1>Good work<br />starts in the field.</h1><p>One clear view of every farm, crop, and season you care for.</p></div>
        <span className="photo-credit">Field notes / 01</span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><Icon name="leaf" size={22} /> Greenfield</div>
          <span className="eyebrow">FARM MANAGEMENT</span>
          <h2>{mode === 'login' ? 'Welcome back.' : 'Make room to grow.'}</h2>
          <p className="muted">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create your farmer account to get started.'}</p>
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Create account</button>
          </div>
          <form onSubmit={handleSubmit} className="form-stack">
            {mode === 'register' && <label>Full name<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>}
            <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            <label>Password<input required type="password" minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}<Icon name="arrow" size={17} /></button>
          </form>
          <p className="auth-footnote">A considered way to keep your growing season in view.</p>
        </div>
      </section>
    </main>
  )
}

function FarmDialog({ farm, onClose, onSave, busy, error }) {
  const [form, setForm] = useState(farm || emptyFarm)
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  function submit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''))
    payload.farmSize = Number(form.farmSize)
    onSave(payload)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="farm-dialog" role="dialog" aria-modal="true" aria-labelledby="farm-dialog-title">
        <div className="dialog-heading"><div><span className="eyebrow">FIELD RECORD</span><h2 id="farm-dialog-title">{farm?._id ? 'Edit farm' : 'Add a farm'}</h2></div><button className="icon-button" title="Close" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>
        <form className="farm-form" onSubmit={submit}>
          <label>Farm name<input autoFocus required value={form.farmName} onChange={(event) => update('farmName', event.target.value)} placeholder="e.g. North Orchard" /></label>
          <div className="form-row"><label>Location<input required value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Town or region" /></label><label>Size (acres)<input required type="number" min="0.1" step="0.1" value={form.farmSize} onChange={(event) => update('farmSize', event.target.value)} placeholder="0.0" /></label></div>
          <div className="form-row"><label>Primary crop<input required value={form.cropType} onChange={(event) => update('cropType', event.target.value)} placeholder="e.g. Wheat" /></label><label>Soil type<input value={form.soilType} onChange={(event) => update('soilType', event.target.value)} placeholder="e.g. Loamy" /></label></div>
          <div className="form-row"><label>Planting date<input type="date" value={form.plantingDate ? form.plantingDate.slice(0, 10) : ''} onChange={(event) => update('plantingDate', event.target.value)} /></label><label>Expected harvest<input type="date" value={form.harvestDate ? form.harvestDate.slice(0, 10) : ''} onChange={(event) => update('harvestDate', event.target.value)} /></label></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : farm?._id ? 'Save changes' : 'Add farm'}</button></div>
        </form>
      </section>
    </div>
  )
}

function Dashboard({ session, onLogout }) {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All farms')
  const [dialogFarm, setDialogFarm] = useState(null)
  const [dialogError, setDialogError] = useState('')
  const [saving, setSaving] = useState(false)
  const [menuFarm, setMenuFarm] = useState('')

  async function loadFarms() {
    setPageError('')
    setLoading(true)
    try {
      const result = await request('/farms', { token: session.token })
      setFarms(result.farms)
    } catch (error) {
      if (error.message.includes('token') || error.message.includes('Authentication')) onLogout()
      else setPageError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFarms() }, [])

  const totalAcres = farms.reduce((total, farm) => total + Number(farm.farmSize || 0), 0)
  const growingCount = farms.filter((farm) => getSeasonStage(farm) === 'Growing').length
  const filteredFarms = useMemo(() => farms.filter((farm) => {
    const matchesText = `${farm.farmName} ${farm.location} ${farm.cropType}`.toLowerCase().includes(search.toLowerCase())
    return matchesText && (filter === 'All farms' || getSeasonStage(farm) === filter)
  }), [farms, search, filter])

  async function saveFarm(payload) {
    setSaving(true)
    setDialogError('')
    try {
      const editing = Boolean(dialogFarm?._id)
      const result = await request(editing ? `/farms/${dialogFarm._id}` : '/farms', {
        token: session.token,
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setFarms((current) => editing ? current.map((farm) => farm._id === result.farm._id ? result.farm : farm) : [result.farm, ...current])
      setDialogFarm(null)
    } catch (error) {
      setDialogError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteFarm(farm) {
    if (!window.confirm(`Remove ${farm.farmName} from your farm list?`)) return
    setMenuFarm('')
    try {
      await request(`/farms/${farm._id}`, { token: session.token, method: 'DELETE' })
      setFarms((current) => current.filter((item) => item._id !== farm._id))
    } catch (error) {
      setPageError(error.message)
    }
  }

  function openCreate() { setDialogError(''); setDialogFarm({ ...emptyFarm }) }
  function openEdit(farm) { setDialogError(''); setDialogFarm({ ...farm }) }
  const initials = session.user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="app-shell" onClick={() => menuFarm && setMenuFarm('')}>
      <aside className="sidebar">
        <a className="brand" href="#overview"><span className="brand-icon"><Icon name="leaf" size={21} /></span><span>greenfield<small>FARM DESK</small></span></a>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation"><a className="nav-item selected" href="#overview"><Icon name="grid" /> Overview</a><a className="nav-item" href="#farms"><Icon name="leaf" /> My farms <span className="nav-count">{farms.length}</span></a></nav>
        <div className="sidebar-bottom"><div className="weather-card"><div className="weather-top"><span>FIELD CONDITIONS</span><Icon name="sun" size={18} /></div><strong>Good day to grow</strong><small>Season overview · {new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date())}</small></div><button className="profile-row" onClick={onLogout}><span className="avatar">{initials}</span><span className="profile-copy"><strong>{session.user.name}</strong><small>Farmer account</small></span><Icon name="logout" size={17} /></button></div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Overview</div><div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</span><span className="avatar top-avatar">{initials}</span></div></header>
        <div className="content-wrap">
          <section className="welcome-row"><div><span className="eyebrow">YOUR FARM DESK</span><h1>Good morning, {session.user.name.split(' ')[0]}<span className="period">.</span></h1><p className="muted">A clear view of what’s growing and what’s next.</p></div><button className="button button-primary" onClick={openCreate}><Icon name="plus" size={17} /> Add a farm</button></section>
          {pageError && <div className="notice" role="alert"><span>{pageError}</span><button onClick={loadFarms}>Try again</button></div>}
          <section className="metrics" aria-label="Farm summary">
            <article className="metric"><div className="metric-head"><span>REGISTERED FARMS</span><span className="metric-icon olive"><Icon name="leaf" size={17} /></span></div><strong>{loading ? '—' : farms.length.toString().padStart(2, '0')}</strong><small>Your growing spaces</small></article>
            <article className="metric"><div className="metric-head"><span>LAND IN CARE</span><span className="metric-icon gold">A</span></div><strong>{loading ? '—' : `${Number(totalAcres.toFixed(1)).toLocaleString()} `}<em>{loading ? '' : 'acres'}</em></strong><small>Total registered area</small></article>
            <article className="metric"><div className="metric-head"><span>IN SEASON</span><span className="metric-icon green-dot"><i /></span></div><strong>{loading ? '—' : growingCount.toString().padStart(2, '0')}</strong><small>Fields actively growing</small></article>
            <article className="metric season-metric"><div className="metric-head"><span>SEASONAL NOTE</span><span className="season-quarter">Q{Math.floor(new Date().getMonth() / 3) + 1}</span></div><strong>{new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date())}</strong><small>Make each day count in the field.</small></article>
          </section>

          <section className="season-banner"><div className="banner-copy"><span className="eyebrow">THE SEASON, AT A GLANCE</span><h2>Every field has a story.</h2><p>{farms.length ? `${farms.length} ${farms.length === 1 ? 'farm is' : 'farms are'} in your records. Keep planting dates and harvest plans close as the season unfolds.` : 'Add your first farm to bring planting dates, harvest plans, and the season ahead into focus.'}</p><a href="#farms" className="text-link">View farm records <Icon name="arrow" size={16} /></a></div><div className="banner-image" role="img" aria-label="Rows of crops in a green field"><span>FIELD NOTES&nbsp; / &nbsp;01</span></div></section>

          <section className="farm-section" id="farms"><div className="section-heading"><div><span className="eyebrow">YOUR LAND</span><h2>Farm records <span className="count-badge">{farms.length}</span></h2></div><button className="button button-outline" onClick={openCreate}><Icon name="plus" size={16} /> New farm</button></div>
            <div className="farm-toolbar"><label className="search-box"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search farms, crops, locations" aria-label="Search farms" /></label><div className="filter-tabs" aria-label="Filter farms">{['All farms', 'Growing', 'Planning', 'Upcoming', 'Harvested'].map((option) => <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)}>{option}</button>)}</div></div>
            <div className="farm-table-wrap"><table className="farm-table"><thead><tr><th>FARM</th><th>PRIMARY CROP</th><th>AREA</th><th>SEASON</th><th>PLANTING</th><th></th></tr></thead><tbody>
              {loading ? <tr><td className="table-message" colSpan="6">Loading your farm records...</td></tr> : filteredFarms.length ? filteredFarms.map((farm, index) => {
                const stage = getSeasonStage(farm)
                return <tr key={farm._id}><td><div className="farm-name-cell"><span className={`crop-swatch swatch-${index % 4}`}><Icon name="leaf" size={17} /></span><span><strong>{farm.farmName}</strong><small><Icon name="pin" size={12} /> {farm.location}</small></span></div></td><td><span className="crop-name">{farm.cropType}</span><small className="soil-name">{farm.soilType || 'Soil not specified'}</small></td><td>{Number(farm.farmSize).toLocaleString()} <span className="unit">ac</span></td><td><span className={`status status-${stage.toLowerCase()}`}><i />{stage}</span></td><td><span className="plant-date">{formatDate(farm.plantingDate)}</span></td><td><div className="row-actions" onClick={(event) => event.stopPropagation()}><button className="icon-button" aria-label={`Actions for ${farm.farmName}`} title="Farm actions" onClick={() => setMenuFarm(menuFarm === farm._id ? '' : farm._id)}><Icon name="more" /></button>{menuFarm === farm._id && <div className="action-menu"><button onClick={() => openEdit(farm)}><Icon name="edit" size={15} /> Edit details</button><button className="danger-action" onClick={() => deleteFarm(farm)}><Icon name="trash" size={15} /> Remove farm</button></div>}</div></td></tr>
              }) : <tr><td className="table-message empty-state" colSpan="6"><span className="empty-mark"><Icon name="leaf" size={23} /></span><strong>{farms.length ? 'No matching farms' : 'Your fields start here'}</strong><span>{farms.length ? 'Try another search or season filter.' : 'Add your first farm to bring your growing season into view.'}</span>{!farms.length && <button className="text-link" onClick={openCreate}>Add your first farm <Icon name="arrow" size={15} /></button>}</td></tr>}
            </tbody></table></div>
            <div className="table-footer"><span>Showing {filteredFarms.length} of {farms.length} farms</span><span>Updated just now <i className="sync-dot" /></span></div>
          </section>
          <footer className="page-footer"><span>GREENFIELD FARM DESK</span><span>GOOD THINGS GROW WITH CARE</span></footer>
        </div>
      </main>
      {dialogFarm && <FarmDialog farm={dialogFarm} onClose={() => setDialogFarm(null)} onSave={saveFarm} busy={saving} error={dialogError} />}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('greenfield-session') || 'null') } catch { return null }
  })
  function logout() {
    localStorage.removeItem('greenfield-session')
    setSession(null)
  }
  return session?.token && session?.user ? <Dashboard session={session} onLogout={logout} /> : <AuthScreen onAuthenticated={setSession} />
}