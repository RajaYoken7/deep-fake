import { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Trophy,
  Award,
  Flame,
  Target,
  ScanSearch,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Upload,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, GlassCard, UploadBox } from '../../components/UI';
import { BackButton, PublicNav } from '../../pages/Modules';
import {
  startGameSession,
  submitGamePrediction,
  completeGameSession,
  getUserGameStats,
} from './services/gameApi';
import { AchievementsModal } from './AchievementsModal';
import './game.css';

export function DeepfakeDetectiveGame({ go, back, notify }) {
  // Navigation states: 'hub' | 'playing' | 'result' | 'summary'
  const [gameState, setGameState] = useState('hub');
  const [gameMode, setGameMode] = useState('academy'); // 'academy' | 'custom'

  // User Stats & Session state
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Custom upload state
  const [customFile, setCustomFile] = useState(null);

  // Submission & evaluation state
  const [submitting, setSubmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [showClues, setShowClues] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [sessionCompletedData, setSessionCompletedData] = useState(null);

  // Load user game stats on mount
  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        setLoadingStats(true);
        const stats = await getUserGameStats();
        if (active) setPlayerStats(stats);
      } catch (err) {
        console.error('Failed to load player game stats:', err);
      } finally {
        if (active) setLoadingStats(false);
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  // Start new challenge session
  const handleStartChallenge = async (mode = 'academy') => {
    try {
      setGameMode(mode);
      setSubmitting(true);
      const data = await startGameSession();
      setSessionId(data.sessionId);
      setChallenges(data.challenges || []);
      setCurrentIndex(0);
      setCustomFile(null);
      setCurrentResult(null);
      setShowClues(false);
      if (data.playerStats) setPlayerStats(data.playerStats);
      setGameState('playing');
    } catch (err) {
      if (notify) notify(err.message || 'Could not start game session.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Answer (REAL or FAKE)
  const handleAnswer = async (prediction) => {
    if (submitting) return;

    if (gameMode === 'custom' && !customFile?.file) {
      if (notify) notify('Please select or upload an image first.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        sessionId,
        userPrediction: prediction,
      };

      if (gameMode === 'academy') {
        const activeChallenge = challenges[currentIndex];
        payload.challengeId = activeChallenge.id;
      } else {
        payload.file = customFile.file;
      }

      const result = await submitGamePrediction(payload);
      setCurrentResult(result);
      if (result.playerStats) {
        setPlayerStats((prev) => ({
          ...prev,
          ...result.playerStats,
          currentStreak: result.currentStreak,
          highestStreak: result.highestStreak,
        }));
      }

      setGameState('result');
    } catch (err) {
      if (notify) notify(err.message || 'Failed to submit prediction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Advance to next question or complete session
  const handleNextQuestion = async () => {
    if (gameMode === 'academy') {
      if (currentIndex + 1 < challenges.length) {
        setCurrentIndex((i) => i + 1);
        setCurrentResult(null);
        setShowClues(false);
        setGameState('playing');
      } else {
        await handleFinishSession();
      }
    } else {
      // In custom mode, reset custom file
      if (customFile?.url) URL.revokeObjectURL(customFile.url);
      setCustomFile(null);
      setCurrentResult(null);
      setGameState('playing');
    }
  };

  // Finish / Complete active session
  const handleFinishSession = async () => {
    try {
      setSubmitting(true);
      if (sessionId) {
        const completed = await completeGameSession(sessionId);
        setSessionCompletedData(completed);
        if (completed.playerStats) {
          setPlayerStats((prev) => ({
            ...prev,
            ...completed.playerStats,
          }));
        }
      }
      setGameState('summary');
    } catch (err) {
      if (notify) notify(err.message || 'Could not complete session.');
      setGameState('hub');
    } finally {
      setSubmitting(false);
    }
  };

  const currentChallenge = challenges[currentIndex] || null;

  return (
    <div className="modules-page module-detail">
      <PublicNav go={go} />
      <main>
        <BackButton back={() => (gameState === 'hub' ? back() : setGameState('hub'))} />

        <div className="game-shell">
          {/* Breadcrumb Navigation */}
          <div className="game-breadcrumb">
            <button onClick={() => go('modules')}>DeepTrust Academy</button>
            <span className="game-breadcrumb-divider">/</span>
            <button onClick={() => go('games')}>Game Center</button>
            <span className="game-breadcrumb-divider">/</span>
            <span>Deepfake Detective</span>
          </div>

          {/* =========================================================================
              VIEW 1: GAME HUB / DASHBOARD
              ========================================================================= */}
          {gameState === 'hub' && (
            <>
              {/* Hero / Level Banner */}
              <div className="game-hero-card">
                <div className="game-avatar-badge">
                  <span>{playerStats?.levelInfo?.badge || '🕵️'}</span>
                  <span className="tier-tag">LVL {playerStats?.currentLevel || 1}</span>
                </div>

                <div className="game-hero-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2>Deepfake Detective</h2>
                    <span className="game-rank-tag">
                      <ShieldCheck size={14} /> {playerStats?.currentRank || 'Bronze Detective'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px', color: '#000000', fontSize: '13px' }}>
                    Title: <strong>{playerStats?.levelInfo?.title || 'Beginner'}</strong> · Can You Tell What's Real?
                  </p>

                  {/* Level Progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ color: '#000000' }}>
                        {(playerStats?.totalXP || 0).toLocaleString()} Total XP
                      </span>
                      <span style={{ color: '#000000' }}>
                        {playerStats?.levelInfo?.xpNeededForNext > 0
                          ? `${playerStats.levelInfo.xpNeededForNext.toLocaleString()} XP to Level ${(playerStats?.currentLevel || 1) + 1}`
                          : 'Max Level Reached'}
                      </span>
                    </div>

                    <div className="game-level-progress-bar">
                      <div
                        className="game-level-progress-fill"
                        style={{ width: `${playerStats?.levelInfo?.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="game-hero-actions">
                  <Button onClick={() => handleStartChallenge('academy')} disabled={loadingStats}>
                    <Gamepad2 size={16} /> Start Challenge
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAchievementsModal(true)}>
                    <Award size={16} /> Badges ({playerStats?.totalAchievementsUnlocked || 0}/8)
                  </Button>
                </div>
              </div>

              {/* Stats Ribbon */}
              <div className="game-stats-ribbon">
                <div className="game-stat-card">
                  <div className="game-stat-icon cyan">
                    <Target size={22} />
                  </div>
                  <div className="game-stat-meta">
                    <span>Games Played</span>
                    <strong>{playerStats?.gamesPlayed || 0}</strong>
                  </div>
                </div>

                <div className="game-stat-card">
                  <div className="game-stat-icon emerald">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="game-stat-meta">
                    <span>Accuracy</span>
                    <strong>{playerStats?.accuracy || 0}%</strong>
                  </div>
                </div>

                <div className="game-stat-card">
                  <div className="game-stat-icon amber">
                    <span className="streak-flame-active">🔥</span>
                  </div>
                  <div className="game-stat-meta">
                    <span>Current Streak</span>
                    <strong>{playerStats?.currentStreak || 0}</strong>
                  </div>
                </div>

                <div className="game-stat-card">
                  <div className="game-stat-icon purple">
                    <Flame size={22} />
                  </div>
                  <div className="game-stat-meta">
                    <span>Highest Streak</span>
                    <strong>{playerStats?.highestStreak || 0}</strong>
                  </div>
                </div>

                <div className="game-stat-card" style={{ cursor: 'pointer' }} onClick={() => go('leaderboard')}>
                  <div className="game-stat-icon rose">
                    <Trophy size={22} />
                  </div>
                  <div className="game-stat-meta">
                    <span>Global Rank</span>
                    <strong>#{playerStats?.leaderboardPosition || '--'}</strong>
                  </div>
                </div>
              </div>

              {/* Game Modes Selection */}
              <div style={{ margin: '30px 0 16px' }}>
                <span className="eyebrow" style={{ fontSize: '11px', fontWeight: 800, color: '#000000' }}>
                  SELECT CHALLENGE MODE
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800 }}>Choose how you want to investigate</h3>
              </div>

              <div className="game-mode-grid">
                <div
                  className={`game-mode-card ${gameMode === 'academy' ? 'active' : ''}`}
                  onClick={() => setGameMode('academy')}
                >
                  <div>
                    <span className="mode-badge academy">CURATED DECK</span>
                    <h3>Academy Challenge Deck</h3>
                    <p>
                      Solve 10 progressive forensic cases featuring photorealistic AI faces, diffusion landscapes,
                      photojournalism, and synthetic art verified by Sightengine.
                    </p>
                  </div>
                  <Button onClick={() => handleStartChallenge('academy')} className="full-btn">
                    Play Academy Deck <ArrowRight size={16} />
                  </Button>
                </div>

                <div
                  className={`game-mode-card ${gameMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setGameMode('custom')}
                >
                  <div>
                    <span className="mode-badge custom">CUSTOM UPLOAD</span>
                    <h3>Custom Investigation</h3>
                    <p>
                      Upload any image from your device (JPG, PNG, WEBP), test your intuition by guessing REAL or FAKE,
                      and have Sightengine GenAI independently verify it.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => handleStartChallenge('custom')} className="full-btn">
                    Upload & Investigate <Upload size={16} />
                  </Button>
                </div>
              </div>

              {/* Leaderboard CTA Card */}
              <GlassCard
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  padding: '22px 28px',
                  background: '#ffffff', border: '1px solid #000000', borderRadius: '4px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Trophy size={18} stroke="#000000" />
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Global Detective Leaderboard</h4>
                  </div>
                  <p style={{ margin: 0, color: '#000000', fontSize: '13px' }}>
                    See where you rank against investigators around the world.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => go('leaderboard')}>
                  View Leaderboard <ArrowRight size={16} />
                </Button>
              </GlassCard>
            </>
          )}

          {/* =========================================================================
              VIEW 2: ACTIVE GAMEPLAY SCREEN
              ========================================================================= */}
          {gameState === 'playing' && (
            <div className="play-stage">
              {/* Header Bar */}
              <div className="play-header">
                <div className="play-header-left">
                  <span className="question-pill">
                    {gameMode === 'academy'
                      ? `CASE ${currentIndex + 1} OF ${challenges.length}`
                      : 'CUSTOM INVESTIGATION'}
                  </span>
                  {gameMode === 'academy' && currentChallenge && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000' }}>
                      {currentChallenge.category} · {currentChallenge.difficulty}
                    </span>
                  )}
                </div>

                <div className="play-header-right">
                  <div className="streak-counter">
                    <span className="streak-flame-active">🔥</span>
                    <span>Streak: {playerStats?.currentStreak || 0}</span>
                  </div>

                  <Button variant="secondary" onClick={handleFinishSession} style={{ padding: '6px 14px', fontSize: '12px' }}>
                    Finish Session
                  </Button>
                </div>
              </div>

              {/* Clues Accordion (Academy Mode) */}
              {gameMode === 'academy' && currentChallenge?.clues && (
                <div className="clues-box">
                  <div className="clues-trigger" onClick={() => setShowClues(!showClues)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HelpCircle size={16} /> Forensic Clues & Inspection Hints
                    </span>
                    {showClues ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {showClues && <div className="clues-content">{currentChallenge.clues}</div>}
                </div>
              )}

              {/* Image Frame */}
              <div className="challenge-image-frame">
                {submitting && (
                  <div className="scanning-overlay">
                    <div className="scan-laser-line" />
                    <ScanSearch size={40} className="spinner" />
                    <strong style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
                      Sending image to Sightengine GenAI forensically...
                    </strong>
                    <span style={{ fontSize: '12px', color: '#000000' }}>
                      Extracting latent diffusion signatures and sensor noise
                    </span>
                  </div>
                )}

                {gameMode === 'academy' && currentChallenge?.imageUrl && (
                  <img src={currentChallenge.imageUrl} alt={currentChallenge.title || 'Case challenge'} />
                )}

                {gameMode === 'custom' && (
                  <div style={{ padding: '24px', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                    {customFile?.url ? (
                      <img src={customFile.url} alt="Custom upload" style={{ maxHeight: '420px', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '100%', maxWidth: '480px' }}>
                        <UploadBox
                          label="Drop image to investigate"
                          file={customFile}
                          onFile={(f) => setCustomFile(f)}
                          onInvalid={(msg) => notify && notify(msg)}
                          helper="PNG, JPG or WEBP up to 10 MB · Preview will appear here"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Image Change Option */}
              {gameMode === 'custom' && customFile && !submitting && (
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <button
                    onClick={() => {
                      if (customFile.url) URL.revokeObjectURL(customFile.url);
                      setCustomFile(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Choose a different image
                  </button>
                </div>
              )}

              {/* Prompt Instruction */}
              <div style={{ textAlign: 'center', margin: '20px 0 10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  YOUR FORENSIC VERDICT
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 900 }}>
                  Is this photograph REAL or AI-GENERATED?
                </h3>
              </div>

              {/* Big REAL / FAKE Buttons */}
              <div className="decision-buttons-grid">
                <button
                  className="btn-decision btn-real"
                  disabled={submitting || (gameMode === 'custom' && !customFile?.file)}
                  onClick={() => handleAnswer('REAL')}
                >
                  <span className="decision-title">REAL</span>
                  <span className="decision-desc">Genuine Camera Photograph</span>
                </button>

                <button
                  className="btn-decision btn-fake"
                  disabled={submitting || (gameMode === 'custom' && !customFile?.file)}
                  onClick={() => handleAnswer('FAKE')}
                >
                  <span className="decision-title">FAKE</span>
                  <span className="decision-desc">AI-Generated Synthetic Image</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: RESULT EVALUATION SCREEN
              ========================================================================= */}
          {gameState === 'result' && currentResult && (
            <div className="play-stage">
              <div
                className={`result-feedback-card ${
                  currentResult.isCorrect === true
                    ? 'correct'
                    : currentResult.isCorrect === false
                    ? 'incorrect'
                    : 'inconclusive'
                }`}
              >
                {/* Heading Strip */}
                <div className="result-badge-strip">
                  <div className="result-heading">
                    {currentResult.isCorrect === true ? (
                      <CheckCircle2 size={32} stroke="#000000" />
                    ) : currentResult.isCorrect === false ? (
                      <XCircle size={32} stroke="#000000" />
                    ) : (
                      <AlertTriangle size={32} stroke="#000000" />
                    )}

                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                        FORENSIC VERIFICATION
                      </span>
                      <h3
                        style={{
                          color:
                            '#000000',
                        }}
                      >
                        {currentResult.isCorrect === true
                          ? 'CORRECT PREDICTION!'
                          : currentResult.isCorrect === false
                          ? 'INCORRECT PREDICTION'
                          : 'INCONCLUSIVE RESULT'}
                      </h3>
                    </div>
                  </div>

                  {currentResult.xpEarned > 0 && (
                    <div className="xp-tag-earned">
                      <Sparkles size={16} /> +{currentResult.xpEarned} XP
                    </div>
                  )}
                </div>

                {/* Newly Unlocked Achievement Notification */}
                {currentResult.newlyUnlockedAchievements?.length > 0 && (
                  <div className="achievement-unlock-banner">
                    <span style={{ fontSize: '32px' }}>
                      {currentResult.newlyUnlockedAchievements[0].badge || '🎖️'}
                    </span>
                    <div>
                      <h4>Badge Unlocked: {currentResult.newlyUnlockedAchievements[0].name}!</h4>
                      <p>{currentResult.newlyUnlockedAchievements[0].description}</p>
                    </div>
                  </div>
                )}

                {/* Score and Comparison Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    margin: '16px 0',
                    background: '#ffffff',
                    padding: '16px',
                    borderRadius: '4px',
                    border: '1px solid #000000',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#000000', fontWeight: 600 }}>
                      YOUR PREDICTION
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>
                      {currentResult.userPrediction === 'REAL' ? 'Natural Photograph (REAL)' : 'AI-Generated (FAKE)'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#000000', fontWeight: 600 }}>
                      SIGHTENGINE CLASSIFICATION
                    </span>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color:
                          '#000000',
                      }}
                    >
                      {currentResult.aiClassification === 'AI_GENERATED'
                        ? 'AI-GENERATED / SYNTHETIC'
                        : currentResult.aiClassification === 'NOT_AI_GENERATED'
                        ? 'NATURAL PHOTOGRAPH'
                        : 'INCONCLUSIVE'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#000000', fontWeight: 600 }}>
                      AI GENERATION SCORE
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#000000' }}>
                      {currentResult.aiScore !== null
                        ? `${(currentResult.aiScore * 100).toFixed(1)}% (${currentResult.aiScore})`
                        : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: '#000000', fontWeight: 600 }}>
                      CURRENT STREAK
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#000000' }}>
                      🔥 {currentResult.currentStreak || 0}
                    </div>
                  </div>
                </div>

                {/* Sightengine Threshold Visualizer Scale */}
                {currentResult.aiScore !== null && (
                  <div className="score-scale-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#000000', fontWeight: 700 }}>
                      <span>0% (Real Photographic Grain)</span>
                      <span>20% Lower Bound</span>
                      <span>80% AI Threshold</span>
                      <span>100% (Synthetic Traces)</span>
                    </div>

                    <div className="score-scale-track">
                      <div className="score-scale-zone real" style={{ width: '20%' }} title="Real / Natural Baseline" />
                      <div className="score-scale-zone inconclusive" style={{ width: '60%' }} title="Inconclusive Range" />
                      <div className="score-scale-zone fake" style={{ width: '20%' }} title="AI Generated Range" />
                    </div>

                    <div style={{ position: 'relative', height: '18px' }}>
                      <div
                        className="score-pointer-arrow"
                        style={{
                          left: `${Math.min(Math.max(currentResult.aiScore * 100, 3), 97)}%`,
                        }}
                      >
                        ▲ <span>{(currentResult.aiScore * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* XP Breakdown list */}
                {currentResult.xpBreakdown?.length > 0 && (
                  <div style={{ margin: '14px 0', padding: '12px 16px', background: '#ffffff', borderRadius: '4px', border: '1px solid #000000' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>
                      REWARD BREAKDOWN
                    </span>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {currentResult.xpBreakdown.map((item, idx) => (
                        <span key={idx} style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>
                          ✓ {item.reason}: +{item.xp} XP
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Educational Breakdown */}
                {currentResult.educationalExplanation && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', margin: '16px 0', padding: '14px 16px', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                    <Info size={18} stroke="#000000" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: '#000000', lineHeight: '1.6' }}>
                      <strong>Forensic Explanation:</strong> {currentResult.educationalExplanation}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px', color: '#000000', marginTop: '12px' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>{currentResult.disclaimer}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <Button variant="secondary" onClick={handleFinishSession}>
                    Finish Session
                  </Button>
                  <Button onClick={handleNextQuestion}>
                    {gameMode === 'academy' && currentIndex + 1 >= challenges.length
                      ? 'Complete Challenge Deck'
                      : 'Next Challenge'}{' '}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: SESSION COMPLETED / SUMMARY SCREEN
              ========================================================================= */}
          {gameState === 'summary' && (
            <GlassCard style={{ padding: '36px', textAlign: 'center', maxWidth: '650px', margin: '20px auto' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '24px',
                  background: '#000000', color: '#ffffff', border: '1px solid #000000',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '44px',
                  margin: '0 auto 18px',
                  boxShadow: 'none',
                }}
              >
                🏆
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 8px' }}>
                Challenge Session Completed!
              </h2>

              <p style={{ color: '#000000', fontSize: '14px', margin: '0 0 24px' }}>
                You have sharpened your AI deepfake detection skills. Check your performance below.
              </p>

              {/* Session Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  marginBottom: '26px',
                }}
              >
                <div style={{ padding: '14px', background: '#ffffff', borderRadius: '4px', border: '1px solid #000000' }}>
                  <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>QUESTIONS</span>
                  <div style={{ fontSize: '20px', fontWeight: 900 }}>
                    {sessionCompletedData?.session?.questionsAttempted || 0}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#000000', color: '#ffffff', borderRadius: '4px', border: '1px solid #000000' }}>
                  <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>CORRECT</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                    {sessionCompletedData?.session?.correctAnswers || 0}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#ffffff', color: '#000000', borderRadius: '4px', border: '1px solid #000000' }}>
                  <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>INCORRECT</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                    {sessionCompletedData?.session?.incorrectAnswers || 0}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#ffffff', color: '#000000', borderRadius: '4px', border: '1px solid #000000' }}>
                  <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>TOTAL XP</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                    +{(sessionCompletedData?.session?.xpEarned || 0).toLocaleString()} XP
                  </div>
                </div>
              </div>

              {sessionCompletedData?.completionBonus > 0 && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '4px',
                    background: '#ffffff', border: '1px solid #000000',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '24px',
                  }}
                >
                  ⭐ Earned +{sessionCompletedData.completionBonus} XP Session Completion Bonus!
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button onClick={() => handleStartChallenge('academy')}>
                  <RotateCcw size={16} /> Play Again
                </Button>
                <Button variant="secondary" onClick={() => go('leaderboard')}>
                  <Trophy size={16} /> View Leaderboard
                </Button>
                <Button variant="secondary" onClick={() => go('games')}>
                  Game Center
                </Button>
              </div>
            </GlassCard>
          )}

          {/* Achievements Modal */}
          <AchievementsModal
            isOpen={showAchievementsModal}
            onClose={() => setShowAchievementsModal(false)}
          />
        </div>
      </main>
    </div>
  );
}

export default DeepfakeDetectiveGame;
