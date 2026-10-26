import { useState } from 'react'
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Fingerprint, Gamepad2, Image, LockKeyhole, ScanSearch, ShieldCheck, Upload, AlertTriangle, Info } from 'lucide-react'
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
    AI_GENERATED: 'AI-Generated Signatures Detected',
    NOT_AI_GENERATED: 'No Strong AI-Generated Indicators',
    INCONCLUSIVE: 'Inconclusive / Mixed Indicators',
  }[result.classification] || 'Analysis Complete';

  const classificationClass = result.classification.toLowerCase().replaceAll('_', '-');
  const scorePercent = result.score !== null ? (result.score * 100).toFixed(1) : null;
  const upperThreshold = result.threshold || 0.8;
  const lowerThreshold = +(1 - upperThreshold).toFixed(2);

  return (
    <div className="result-layout">
      <div style={{ display: 'grid', gap: '20px' }}>
        <GlassCard className="result-main detection-result-card">
          <div className="result-head" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div className="success-round">
              <ScanSearch size={24} />
            </div>
            <div>
              <span className="eyebrow">SIGHTENGINE GENAI FORENSIC REPORT</span>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Analysis Complete</h2>
            </div>
          </div>

          <div style={{ margin: '14px 0' }}>
            <span className={`detection-classification ${classificationClass}`} style={{ fontSize: '13px', padding: '8px 14px' }}>
              {classificationLabel}
            </span>
          </div>

          <div className="detection-score" style={{ margin: '20px 0 10px' }}>
            <strong style={{ fontSize: '38px', fontWeight: 800 }}>
              {scorePercent !== null ? `${scorePercent}%` : 'Unavailable'}
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              AI Generation Likelihood Score ({result.score !== null ? result.score.toFixed(4) : 'N/A'})
            </span>
          </div>

          {/* Visual Threshold Scale */}
          {result.score !== null && (
            <div style={{ margin: '20px 0 24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>
                <span>0% (Natural / Real)</span>
                <span>{lowerThreshold * 100}% Lower Bound</span>
                <span>{upperThreshold * 100}% AI Threshold</span>
                <span>100% (Synthetic)</span>
              </div>
              <div style={{ position: 'relative', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#e2e8f0', display: 'flex' }}>
                <div style={{ width: `${lowerThreshold * 100}%`, background: '#86efac' }} title="Natural Baseline" />
                <div style={{ width: `${(upperThreshold - lowerThreshold) * 100}%`, background: '#fde68a' }} title="Inconclusive Zone" />
                <div style={{ width: `${(1 - upperThreshold) * 100}%`, background: '#fca5a5' }} title="AI Detection Zone" />
              </div>
              <div style={{ position: 'relative', height: '14px', marginTop: '4px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${Math.min(Math.max(result.score * 100, 2), 98)}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--cyan)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  ▲ <span>{scorePercent}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Feature C: Explanation Breakdown */}
          <div style={{ display: 'grid', gap: '12px', margin: '20px 0' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
              <Info size={18} color="var(--cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#0369a1', lineHeight: '1.6' }}>
                <strong>Decision Methodology:</strong> Sightengine analyzes generative diffusion traces, latent artifacts, and unnatural frequency responses. Scores ≥ {upperThreshold} indicate high probability of synthetic generation; scores ≤ {lowerThreshold} reflect photographic baselines. Scores between {lowerThreshold} and {upperThreshold} indicate mixed visual features requiring human verification.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
                <strong>Important Limitations:</strong> The score represents a model indicator, not mathematical certainty. Factors such as aggressive compression (e.g. messaging apps), social media filters, extreme lighting, or manual photo retouching can introduce artifact noise.
              </div>
            </div>
          </div>

          <div className="result-actions" style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <Button variant="secondary" onClick={reset}>
              <ArrowLeft size={16} /> Choose another image
            </Button>
            <Button onClick={reset}>
              Analyze Another Image <ArrowRight size={16} />
            </Button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="summary-card">
        <h3>Selected Image</h3>
        <div className="summary-image">
          {file?.url ? <img src={file.url} alt="Selected upload" /> : <Image size={40} />}
        </div>
        <div className="summary-row">
          <span>File name</span>
          <b>{file?.name || 'Selected image'}</b>
        </div>
        <div className="summary-row">
          <span>Analysis Provider</span>
          <b>Sightengine GenAI</b>
        </div>
        <div className="summary-row">
          <span>Status</span>
          <b>Completed</b>
        </div>
      </GlassCard>
    </div>
  );
}

export function Identity({ notify, go, back }) {
  return (
    <PublicPage go={go} back={back}>
      <IdentityGuardianView notify={notify} />
    </PublicPage>
  );
}
function ReadyCard({icon:Icon,title,copy,items}){return <div className="analysis-aside"><GlassCard><span className="aside-icon"><Icon/></span><h3>{title}</h3><p>{copy}</p><div className="checks">{items.map(x=><span key={x}><CheckCircle2/> {x}</span>)}</div></GlassCard></div>}

export function Games({ go, back }) {
  const games = [
    ['DeepFake Detective', 'Find the fake image, test your intuition, and build your deepfake awareness skills.', ScanSearch, 'cyan'],
    ['Cyber Crime Investigation', 'Investigate a digital case and identify suspicious evidence.', Fingerprint, 'purple'],
    ['Deepfake Escape Room', 'Solve deepfake-related puzzles and complete the challenge.', LockKeyhole, 'blue'],
  ];
  const missions = [
    ['Spot the Fake', 'Practice noticing image details that may signal manipulation.', ScanSearch],
    ['Identity Check', 'Learn the steps of a safe identity comparison.', Fingerprint],
    ['Digital Investigation', 'Explore how to assess a suspicious image carefully.', ShieldCheck],
  ];

  return (
    <PublicPage go={go} back={back}>
      <SectionHead
        eyebrow="LEARN BY PLAYING"
        title="Game Center"
        copy="Learn about deepfakes and digital safety through interactive games."
      />

      {/* Global Leaderboard Callout */}
      <GlassCard
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '18px 24px',
          marginBottom: '28px',
          border: '1px solid #bae6fd',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.06), rgba(99, 102, 241, 0.06))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'grid',
              placeItems: 'center',
              fontSize: '22px',
            }}
          >
            🏆
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Global Detective Leaderboard</h3>
            <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '12px' }}>
              Compete with detectives worldwide, earn XP, and climb the ranks.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => go('leaderboard')}>
          View Global Leaderboard <ArrowRight size={14} />
        </Button>
      </GlassCard>

      <section className="mission-center">
        <div className="mission-heading">
          <span className="eyebrow">MISSION CENTER</span>
          <h2>Choose your next challenge</h2>
          <p>Short guided activities are being prepared for the platform.</p>
        </div>
        <div className="mission-grid">
          {missions.map(([title, copy, Icon]) => (
            <GlassCard className="mission-card" key={title}>
              <span className="mission-icon">
                <Icon />
              </span>
              <div>
                <span className="mission-status">COMING SOON</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <Button variant="disabled">
                Start Mission <ArrowRight size={15} />
              </Button>
            </GlassCard>
          ))}
        </div>
      </section>

      <div className="games-divider">
        <span>GAMES</span>
        <h2>Interactive learning games</h2>
      </div>

      <div className="game-grid">
        {games.map(([title, copy, Icon, color]) => (
          <GlassCard className={`game-card ${color}`} key={title}>
            <div className="game-visual">
              <Icon />
              <span>
                DEEPTRUST
                <br />
                ARCADE
              </span>
              <i />
            </div>
            <div className="game-body">
              <h3>{title}</h3>
              <p>{copy}</p>
              {title === 'DeepFake Detective' ? (
                <Button className="full-btn" onClick={() => go('deepfake-detective')}>
                  Play Detective <Gamepad2 size={16} />
                </Button>
              ) : (
                <Button variant="disabled" className="full-btn">
                  Coming Soon <Gamepad2 size={16} />
                </Button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </PublicPage>
  );
}
function PublicPage({children,go,back}){return <div className="modules-page module-detail"><PublicNav go={go}/><main><BackButton back={back}/>{children}</main></div>}
