import { useState } from 'react'
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Fingerprint, Gamepad2, Image, LockKeyhole, ScanSearch, ShieldCheck, Upload } from 'lucide-react'
import { Button, GlassCard, SectionHead, UploadBox } from '../components/UI'
import { BackButton, PublicNav } from './Modules'
import { analyzeImage } from '../features/detection/services/detectionApi'
import '../features/detection/detection.css'
import { IdentityGuardianView } from '../features/identity/IdentityGuardianView'

export function Detection({ notify, go, back }) {
  const [file, setFile] = useState(null)
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const analyze = async () => {
    if (!file?.file) {
      setError('Choose an image first.')
      return
    }
    setError('')
    setState('analyzing')
    try {
      setResult(await analyzeImage(file.file))
      setState('result')
    } catch (analysisError) {
      setError(analysisError.message)
      setState('error')
    }
  }
  const reset = () => {
    if (file?.url) URL.revokeObjectURL(file.url)
    setFile(null)
    setResult(null)
    setError('')
    setState('idle')
  }
  const handleFile = (selectedFile) => {
    setFile(selectedFile)
    setResult(null)
    setError('')
    setState('idle')
  }
  const handleInvalidFile = (message) => {
    if (file?.url) URL.revokeObjectURL(file.url)
    setFile(null)
    setResult(null)
    setError(message)
    setState('idle')
  }
  return <PublicPage go={go} back={back}><SectionHead eyebrow="AI IMAGE ANALYSIS" title="AI-Generated Image Detection" copy="Upload an image to check for indicators of AI generation."/>{state === 'result' ? <DetectionResult file={file} result={result} reset={reset}/> : <div className="detection-layout"><GlassCard className="detect-upload-card"><div className="upload-heading"><span className="tiny-icon"><Upload/></span><div><h3>Drop your image here</h3><p>Select a supported image file to begin the analysis.</p></div></div><UploadBox label="Drop your image here" file={file} onFile={handleFile} onInvalid={handleInvalidFile} disabled={state==='analyzing'} helper="PNG, JPG or WEBP up to 10 MB · preview appears here"/>{error&&<div className="detection-error" role="alert">{error}</div>}<Button className="full-btn" disabled={state==='analyzing'||!file} onClick={analyze}>{state==='analyzing'?<><i className="spinner"/> Analyzing image...</>:<>Analyze Image <ScanSearch size={18}/></>}</Button>{state==='analyzing'&&<div className="scan-loading" role="status"><i/><span>Sending image securely for analysis...</span></div>}</GlassCard><ReadyCard icon={BrainCircuit} title="Analysis ready" copy="Your image will be analyzed by Sightengine's AI-generated image model." items={['AI-generation indicators','Model score','Clear confidence limitations']}/></div>}</PublicPage>
}
function DetectionResult({ file, result, reset }) {
  const classificationLabel = {
    AI_GENERATED: 'AI-generated indicators detected',
    NOT_AI_GENERATED: 'No strong AI-generation indicators detected',
    INCONCLUSIVE: 'Inconclusive result',
  }[result.classification]
  const classificationClass = result.classification.toLowerCase().replaceAll('_', '-')
  return <div className="result-layout"><GlassCard className="result-main detection-result-card"><div className="result-head"><div className="success-round"><ScanSearch/></div><div><span className="eyebrow">SIGHTENGINE GENAI RESULT</span><h2>Analysis complete</h2></div></div><span className={`detection-classification ${classificationClass}`}>{classificationLabel}</span><div className="detection-score"><strong>{result.score === null ? 'Unavailable' : result.score.toFixed(3)}</strong><span>AI-generated score (Sightengine model score)</span></div><p className="detection-score-note">Classification uses a configurable threshold of {result.threshold} and its corresponding lower bound of {(1-result.threshold).toFixed(2)}. The score is not a guaranteed probability.</p><p className="detection-disclaimer">{result.disclaimer}</p><div className="result-actions"><Button variant="secondary" onClick={reset}><ArrowLeft size={16}/> Choose another image</Button><Button onClick={reset}>Analyze Another Image <ArrowRight size={16}/></Button></div></GlassCard><GlassCard className="summary-card"><h3>Selected Image</h3><div className="summary-image">{file?.url?<img src={file.url} alt="Selected upload"/>:<Image/>}</div><div className="summary-row"><span>File name</span><b>{file?.name || 'Selected image'}</b></div><div className="summary-row"><span>Status</span><b>Analysis complete</b></div></GlassCard></div>
}

export function Identity({ notify, go, back }) {
  return (
    <PublicPage go={go} back={back}>
      <IdentityGuardianView notify={notify} />
    </PublicPage>
  );
}
function ReadyCard({icon:Icon,title,copy,items}){return <div className="analysis-aside"><GlassCard><span className="aside-icon"><Icon/></span><h3>{title}</h3><p>{copy}</p><div className="checks">{items.map(x=><span key={x}><CheckCircle2/> {x}</span>)}</div></GlassCard></div>}

export function Games({go,back}){const games=[['DeepFake Detective','Find the fake image and build your deepfake awareness skills.',ScanSearch,'cyan'],['Cyber Crime Investigation','Investigate a digital case and identify suspicious evidence.',Fingerprint,'purple'],['Deepfake Escape Room','Solve deepfake-related puzzles and complete the challenge.',LockKeyhole,'blue']];const missions=[['Spot the Fake','Practice noticing image details that may signal manipulation.',ScanSearch],['Identity Check','Learn the steps of a safe identity comparison.',Fingerprint],['Digital Investigation','Explore how to assess a suspicious image carefully.',ShieldCheck]];return <PublicPage go={go} back={back}><SectionHead eyebrow="LEARN BY PLAYING" title="Game Center" copy="Learn about deepfakes and digital safety through interactive games."/><section className="mission-center"><div className="mission-heading"><span className="eyebrow">MISSION CENTER</span><h2>Choose your next challenge</h2><p>Short guided activities are being prepared for the platform.</p></div><div className="mission-grid">{missions.map(([title,copy,Icon])=><GlassCard className="mission-card" key={title}><span className="mission-icon"><Icon/></span><div><span className="mission-status">COMING SOON</span><h3>{title}</h3><p>{copy}</p></div><Button variant="disabled">Start Mission <ArrowRight size={15}/></Button></GlassCard>)}</div></section><div className="games-divider"><span>GAMES</span><h2>Interactive learning games</h2></div><div className="game-grid">{games.map(([title,copy,Icon,color])=><GlassCard className={`game-card ${color}`} key={title}><div className="game-visual"><Icon/><span>DEEPTRUST<br/>ARCADE</span><i/></div><div className="game-body"><h3>{title}</h3><p>{copy}</p><Button variant="disabled" className="full-btn">Coming Soon <Gamepad2 size={16}/></Button></div></GlassCard>)}</div></PublicPage>}
function PublicPage({children,go,back}){return <div className="modules-page module-detail"><PublicNav go={go}/><main><BackButton back={back}/>{children}</main></div>}
