import { Menu, X, LayoutDashboard, ScanSearch, ShieldCheck, Gamepad2, History, UserRound, LogOut, Users, Images, ClipboardCheck, FileBarChart2 } from 'lucide-react'

const userItems = [['dashboard','Dashboard',LayoutDashboard],['detection','Deepfake Detection',ScanSearch],['identity','Identity Guardian',ShieldCheck],['games','Game Center',Gamepad2],['history','History',History],['profile','Profile',UserRound]]
const adminItems = [['admin-dashboard','Dashboard',LayoutDashboard],['admin-users','Users',Users],['admin-images','Uploaded Images',Images],['admin-results','Detection Results',ClipboardCheck],['admin-identity','Identity Records',ShieldCheck],['admin-reports','Reports',FileBarChart2]]

export function Brand({ compact = false }) { return <div className="brand"><span className="brand-mark"><ShieldCheck size={compact ? 19 : 22}/></span><span>DeepTrust <b>Academy</b></span></div> }

export function Sidebar({ page, go, admin = false, open, setOpen }) {
  const list = admin ? adminItems : userItems
  const navigate = (id) => { go(id); setOpen(false) }
  return <><button className="mobile-menu" onClick={()=>setOpen(true)}><Menu/></button><aside className={`sidebar ${open ? 'shown' : ''}`}><div className="sidebar-top"><Brand/><button className="sidebar-close" onClick={()=>setOpen(false)}><X/></button></div><div className="area-label">{admin ? 'ADMIN CONSOLE' : 'USER SPACE'}</div><nav>{list.map(([id, name, Icon]) => <button className={page === id ? 'active' : ''} key={id} onClick={()=>navigate(id)}><Icon size={19}/><span>{name}</span>{id === 'identity' && !admin && <i className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><button onClick={()=>go(admin ? 'admin-login' : 'landing')}><LogOut size={19}/><span>Logout</span></button><small>© 2026 DeepTrust</small></div></aside>{open && <div className="side-scrim" onClick={()=>setOpen(false)}/>}</>
}
