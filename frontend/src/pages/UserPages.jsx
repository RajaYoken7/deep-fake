import { useState } from 'react'
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Fingerprint, Gamepad2, Image, LockKeyhole, ScanSearch, ShieldCheck, Upload } from 'lucide-react'
import { Button, GlassCard, SectionHead, UploadBox } from '../components/UI'
import { BackButton, PublicNav } from './Modules'
import { analyzeImage } from '../features/detection/services/detectionApi'
import '../features/detection/detection.css'

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

export function Identity({ notify, go, back }) { const [original,setOriginal]=useState(null),[suspicious,setSuspicious]=useState(null),[state,setState]=useState('idle'); const register=()=>{if(!original)return notify('Upload an original image first.');notify('Identity reference is ready for comparison.')} ; const compare=()=>{if(!original || !suspicious)return notify('Upload both images before comparing.');setState('comparing');setTimeout(()=>setState('result'),1300)};return <PublicPage go={go} back={back}><SectionHead eyebrow="FACE VERIFICATION" title="Identity Guardian" copy="Protect your identity by registering your original face and comparing it with a suspicious image."/><div className="identity-sections"><GlassCard className="identity-section"><span className="module-icon"><Fingerprint/></span><h2>Register Your Identity</h2><p>Upload an original image of your face to create your identity reference.</p><UploadBox label="Upload Original Face" file={original} onFile={setOriginal} compact/><Button className="full-btn" onClick={register}>Register Identity <ShieldCheck size={16}/></Button></GlassCard><GlassCard className="identity-section"><span className="module-icon purple"><ScanSearch/></span><h2>Check Suspicious Image</h2><p>Upload an image to compare it with your registered identity.</p><UploadBox label="Upload Suspicious Image" file={suspicious} onFile={setSuspicious} compact/><Button className="full-btn" disabled={state==='comparing'} onClick={compare}>{state==='comparing'?<><i className="spinner"/> Comparing facial features...</>:<>Compare Image <ArrowRight size={16}/></>}</Button></GlassCard></div>{state==='result'&&<IdentityResult/>}<div className="identity-privacy"><LockKeyhole/><span>This tool only compares the original image you register with the suspicious image you upload. It does not search the internet or social media.</span></div></PublicPage>}
function IdentityResult(){return <GlassCard className="identity-result placeholder-result"><div><span className="eyebrow">IDENTITY VERIFICATION RESULT</span><h2>Comparison complete</h2></div><div className="result-placeholder"><Fingerprint/><div><span>FACE MATCH</span><strong>Match result will appear here</strong></div><div><span>IDENTITY RESULT</span><strong>Result will appear here</strong></div></div><div className="model-chip"><BrainCircuit/><span>PLANNED MODEL<b>FaceNet</b></span></div></GlassCard>}
function ReadyCard({icon:Icon,title,copy,items}){return <div className="analysis-aside"><GlassCard><span className="aside-icon"><Icon/></span><h3>{title}</h3><p>{copy}</p><div className="checks">{items.map(x=><span key={x}><CheckCircle2/> {x}</span>)}</div></GlassCard></div>}

export function Games({go,back}){const games=[['DeepFake Detective','Find the fake image and build your deepfake awareness skills.',ScanSearch,'cyan'],['Cyber Crime Investigation','Investigate a digital case and identify suspicious evidence.',Fingerprint,'purple'],['Deepfake Escape Room','Solve deepfake-related puzzles and complete the challenge.',LockKeyhole,'blue']];const missions=[['Spot the Fake','Practice noticing image details that may signal manipulation.',ScanSearch],['Identity Check','Learn the steps of a safe identity comparison.',Fingerprint],['Digital Investigation','Explore how to assess a suspicious image carefully.',ShieldCheck]];return <PublicPage go={go} back={back}><SectionHead eyebrow="LEARN BY PLAYING" title="Game Center" copy="Learn about deepfakes and digital safety through interactive games."/><section className="mission-center"><div className="mission-heading"><span className="eyebrow">MISSION CENTER</span><h2>Choose your next challenge</h2><p>Short guided activities are being prepared for the platform.</p></div><div className="mission-grid">{missions.map(([title,copy,Icon])=><GlassCard className="mission-card" key={title}><span className="mission-icon"><Icon/></span><div><span className="mission-status">COMING SOON</span><h3>{title}</h3><p>{copy}</p></div><Button variant="disabled">Start Mission <ArrowRight size={15}/></Button></GlassCard>)}</div></section><div className="games-divider"><span>GAMES</span><h2>Interactive learning games</h2></div><div className="game-grid">{games.map(([title,copy,Icon,color])=><GlassCard className={`game-card ${color}`} key={title}><div className="game-visual"><Icon/><span>DEEPTRUST<br/>ARCADE</span><i/></div><div className="game-body"><h3>{title}</h3><p>{copy}</p><Button variant="disabled" className="full-btn">Coming Soon <Gamepad2 size={16}/></Button></div></GlassCard>)}</div></PublicPage>}
function PublicPage({children,go,back}){return <div className="modules-page module-detail"><PublicNav go={go}/><main><BackButton back={back}/>{children}</main></div>}
