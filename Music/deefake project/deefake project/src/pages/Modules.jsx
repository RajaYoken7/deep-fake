import { ArrowLeft, ArrowRight, CircleUserRound, Fingerprint, Gamepad2, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react'
import { Button, GlassCard, SectionHead } from '../components/UI'

const modules = [
  ['DEEPFAKE DETECTION', 'Check whether an image is real or AI-generated.', ScanSearch, 'cyan', 'detection'],
  ['IDENTITY GUARDIAN', 'Compare a suspicious image with your registered face.', Fingerprint, 'purple', 'identity'],
  ['GAME CENTER', 'Learn about deepfakes through interactive games.', Gamepad2, 'blue', 'games']
]
export function Modules({ go, back }) { return <div className="modules-page"><PublicNav go={go}/><main><BackButton back={back}/><SectionHead eyebrow="YOUR DEEPTRUST JOURNEY" title="Explore DeepTrust Academy" copy="Choose a feature to continue."/><div className="module-grid">{modules.map(([title,copy,Icon,color,page])=><GlassCard className={`module-card ${color}`} key={title}><div className="module-icon"><Icon/></div><span className="eyebrow">{title}</span><h2>{title === 'DEEPFAKE DETECTION' ? <>Deepfake<br/>Detection</> : title === 'IDENTITY GUARDIAN' ? <>Identity<br/>Guardian</> : 'Game Center'}</h2><p>{copy}</p><Button variant="secondary" onClick={()=>go(page)}>Explore <ArrowRight size={16}/></Button></GlassCard>)}</div></main></div> }
export function PublicNav({ go }) { return <header className="public-nav"><BrandMark/><div><Button variant="ghost" onClick={()=>go('login')}>Login</Button><Button onClick={()=>go('register')}>Register</Button><button className="profile-nav-icon" onClick={()=>go('profile')} aria-label="Open profile"><CircleUserRound/></button></div></header> }
export function BackButton({ back }) { return <button className="back-button" onClick={back}><ArrowLeft size={16}/> Back</button> }
function BrandMark(){return <div className="brand"><span className="brand-mark"><ShieldCheck size={22}/></span><span>DeepTrust <b>Academy</b></span></div>}
