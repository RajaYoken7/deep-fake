import { useState } from 'react'
import { Toast } from './components/UI'
import { Landing } from './pages/Landing'
import { AuthPage } from './pages/Auth'
import { Modules } from './pages/Modules'
import { Detection, Games, Identity } from './pages/UserPages'
import { AdminArea, HistoryPage, ProfilePage } from './pages/EmptyPages'

export default function App(){const [page,setPage]=useState('landing');const [history,setHistory]=useState([]);const [toast,setToast]=useState('');const go=(to)=>{setHistory(items=>[...items,page]);setPage(to);window.scrollTo({top:0,behavior:'smooth'})};const back=()=>{setHistory(items=>{const previous=items.at(-1);if(previous)setPage(previous);else setPage('landing');return items.slice(0,-1)});window.scrollTo({top:0,behavior:'smooth'})};const notify=(m)=>{setToast(m);setTimeout(()=>setToast(''),3200)};let content;
  if(page==='landing') content=<Landing go={go}/>;
  else if(['login','register','admin-login'].includes(page)) content=<AuthPage mode={page} go={go} back={back} notify={notify}/>;
  else { const pages={modules:<Modules go={go} back={back}/>,detection:<Detection notify={notify} go={go} back={back}/>,identity:<Identity notify={notify} go={go} back={back}/>,games:<Games go={go} back={back}/>,history:<HistoryPage go={go} back={back}/>,profile:<ProfilePage go={go} back={back}/>, 'admin-dashboard':<AdminArea go={go} back={back}/>};content=pages[page] || <Landing go={go}/> }
  return <>{content}{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</>
}
