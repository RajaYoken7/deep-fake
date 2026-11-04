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
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Radio,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { Button, GlassCard } from '../../components/UI';
import { BackButton, PublicNav } from '../../pages/Modules';
import { useAuth } from '../../contexts/AuthContext';
import {
  startGameSession,
  submitGamePrediction,
  completeGameSession,
  getUserGameStats,
} from './services/gameApi';
import { AchievementsModal } from './AchievementsModal';
import './game.css';

export function DeepfakeDetectiveGame({ go, back, notify }) {
  const { user, updateUser } = useAuth();

  // Navigation states: 'hub' | 'playing' | 'summary'
  const [gameState, setGameState] = useState('hub');

  // User Stats & Session state
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Status flags from backend
  const [allCompleted, setAllCompleted] = useState(false);
  const [totalPublished, setTotalPublished] = useState(0);

  // Submission & evaluation state
  const [submitting, setSubmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [verdictAnimation, setVerdictAnimation] = useState(null); // 'analyzing' | 'correct' | 'incorrect' | null
  const [sessionHistory, setSessionHistory] = useState([]);
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
  const handleStartChallenge = async () => {
    try {
      setSubmitting(true);
      const data = await startGameSession();
      setSessionId(data?.sessionId);
      const fetchedChallenges = data?.challenges || [];
      setChallenges(fetchedChallenges);
      setAllCompleted(Boolean(data?.allCompleted));
      setTotalPublished(Number(data?.totalPublished || 0));
      setCurrentIndex(0);
      setCurrentResult(null);
      setSelectedPrediction(null);
      setVerdictAnimation(null);
      setSessionHistory([]);
      setShowClues(false);
      if (data?.playerStats) setPlayerStats(data.playerStats);
      setGameState('playing');
    } catch (err) {
      if (notify) notify(err.message || 'Could not start game session.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Answer (REAL or AI_GENERATED)
  const handleAnswer = async (prediction) => {
    if (submitting || currentResult) return;

    try {
      setSubmitting(true);
      setSelectedPrediction(prediction);
      setVerdictAnimation('analyzing');

      const activeChallenge = challenges[currentIndex];
      const payload = {
        sessionId,
        userPrediction: prediction,
        challengeId: activeChallenge?.id || activeChallenge?._id,
      };

      const result = await submitGamePrediction(payload);
      setCurrentResult(result);
      setVerdictAnimation(result.isCorrect ? 'correct' : 'incorrect');

      // Record in session history for detailed summary review
      setSessionHistory((prev) => [
        ...prev,
        {
          challenge: activeChallenge,
          userPrediction: prediction,
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          xpEarned: result.xpEarned,
          explanation: result.explanation || result.educationalExplanation || '',
        },
      ]);

      if (result.playerStats) {
        setPlayerStats((prev) => ({
          ...prev,
          ...result.playerStats,
          currentStreak: result.currentStreak,
          highestStreak: result.highestStreak,
        }));

        if (updateUser) {
          updateUser({
            totalXP: result.playerStats.totalXP,
            currentLevel: result.playerStats.currentLevel,
            currentRank: result.playerStats.currentRank,
          });
        }
      }
    } catch (err) {
      setVerdictAnimation(null);
      if (notify) notify(err.message || 'Failed to submit prediction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Advance to next question or complete session
  const handleNextQuestion = async () => {
    setVerdictAnimation(null);
    if (currentIndex + 1 < challenges.length) {
      setCurrentIndex((i) => i + 1);
      setCurrentResult(null);
      setSelectedPrediction(null);
      setShowClues(false);
    } else {
      await handleFinishSession();
    }
  };

  // Finish / Complete active session
  const handleFinishSession = async () => {
    try {
      setSubmitting(true);
      if (sessionId) {
        try {
          const completed = await completeGameSession(sessionId);
          setSessionCompletedData(completed);
          if (completed?.playerStats) {
            setPlayerStats((prev) => ({
              ...prev,
              ...completed.playerStats,
            }));

            if (updateUser) {
              updateUser({
                totalXP: completed.playerStats.totalXP,
                currentLevel: completed.playerStats.currentLevel,
                currentRank: completed.playerStats.currentRank,
              });
            }
          }
        } catch {
          // If session was already marked or network glitch, proceed to summary
        }
      }
      setGameState('summary');
    } catch (err) {
      if (notify) notify(err.message || 'Could not complete session.');
      setGameState('summary');
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
                  <Button onClick={() => handleStartChallenge()} disabled={loadingStats}>
                    <Gamepad2 size={16} /> Start Challenge
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAchievementsModal(true)}>
                    <Award size={16} /> Badges ({playerStats?.totalAchievementsUnlocked || 0}/8)
                  </Button>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="game-stat-grid">
                <div className="game-stat-card">
                  <div className="game-stat-label">TOTAL PREDICTIONS</div>
                  <div className="game-stat-value">{playerStats?.totalAttempts || 0}</div>
                  <div className="game-stat-sub">
                    {playerStats?.correctAnswers || 0} Correct · {playerStats?.incorrectAnswers || 0} Incorrect
                  </div>
                </div>

                <div className="game-stat-card">
                  <div className="game-stat-label">ACCURACY RATE</div>
                  <div className="game-stat-value">
                    {playerStats?.accuracy !== undefined && playerStats?.accuracy !== null
                      ? `${playerStats.accuracy}%`
                      : '0%'}
                  </div>
                  <div className="game-stat-sub">Decisive Accuracy</div>
                </div>

                <div className="game-stat-card">
                  <div className="game-stat-label">CURRENT STREAK</div>
                  <div className="game-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame size={24} color="#f97316" /> {playerStats?.currentStreak || 0}
                  </div>
                  <div className="game-stat-sub">Best Streak: {playerStats?.highestStreak || 0}</div>
                </div>

                <div className="game-stat-card">
                  <div className="game-stat-label">GLOBAL RANK</div>
                  <div className="game-stat-value" style={{ fontSize: '18px', paddingTop: '4px' }}>
                    {playerStats?.currentRank || 'Bronze Detective'}
                  </div>
                  <div className="game-stat-sub">Level {playerStats?.currentLevel || 1} Investigator</div>
                </div>
              </div>

              {/* Leaderboard CTA */}
              <GlassCard
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  padding: '22px 28px',
                  background: '#ffffff',
                  border: '1px solid #000000',
                  borderRadius: '4px',
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
              VIEW 2: ACTIVE GAMEPLAY SCREEN OR WAITING FOR ADMIN STATE
              ========================================================================= */}
          {gameState === 'playing' && (
            challenges.length === 0 ? (
              allCompleted || totalPublished > 0 ? (
                /* -------------------------------------------------------------
                   STATE A: ALL IMAGES COMPLETED BY USER -> WAITING FOR ADMIN UPLOAD
                   ------------------------------------------------------------- */
                <div className="waiting-admin-deck">
                  <div className="waiting-radar-icon">
                    <Radio size={42} />
                  </div>

                  <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 10px', color: '#0f172a' }}>
                    All Available Photographs Detected!
                  </h2>

                  <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: 1.6, margin: '0 auto 16px', maxWidth: '480px' }}>
                    You have successfully analyzed all {totalPublished > 0 ? totalPublished : ''} photographs currently in the database.
                  </p>

                  <div className="waiting-admin-badge">
                    <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    Waiting for administrator to upload new questions
                  </div>

                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
                    Once the administrator uploads and publishes new human photographs in the Admin Portal, you can continue playing immediately.
                  </p>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button onClick={handleStartChallenge} variant="primary">
                      <RefreshCw size={16} /> Check for New Photos
                    </Button>
                    <Button onClick={() => setGameState('hub')} variant="secondary">
                      <ArrowLeft size={16} /> Return to Game Hub
                    </Button>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------------
                   STATE B: ZERO IMAGES IN DATABASE
                   ------------------------------------------------------------- */
                <div className="waiting-admin-deck">
                  <div className="waiting-radar-icon" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#d97706' }}>
                    <AlertTriangle size={42} />
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 10px' }}>
                    No Questions Available
                  </h3>
                  <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
                    No questions are currently available. Please wait for the administrator to add new questions.
                  </p>
                  <Button onClick={() => setGameState('hub')} variant="secondary">
                    <ArrowLeft size={16} /> Return to Game Hub
                  </Button>
                </div>
              )
            ) : (
              /* -------------------------------------------------------------
                 STATE C: ACTIVE GAMEPLAY
                 ------------------------------------------------------------- */
              <div className="play-stage">
                {/* Header Bar */}
                <div className="play-header">
                  <div className="play-header-left">
                    <span className="question-pill">
                      CASE {currentIndex + 1} OF {challenges.length}
                    </span>
                    {currentChallenge && (
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

                {/* Clues Accordion (if available) */}
                {currentChallenge?.clues && (
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

                {/* Challenge Image Frame with Brand New HUD Animation */}
                <div
                  className="challenge-image-frame"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
                    boxShadow:
                      verdictAnimation === 'correct'
                        ? '0 0 40px rgba(16, 185, 129, 0.45)'
                        : verdictAnimation === 'incorrect'
                        ? '0 0 40px rgba(239, 68, 68, 0.45)'
                        : '0 8px 30px rgba(0, 0, 0, 0.12)',
                    border:
                      verdictAnimation === 'correct'
                        ? '2px solid #10b981'
                        : verdictAnimation === 'incorrect'
                        ? '2px solid #ef4444'
                        : '1px solid #e2e8f0',
                  }}
                >
                  {/* Brand New Animation Layer 1: Forensic Targeting & Radar Ring while Analyzing */}
                  {verdictAnimation === 'analyzing' && (
                    <div className="hud-targeting-overlay">
                      <div className="hud-corner top-left" />
                      <div className="hud-corner top-right" />
                      <div className="hud-corner bottom-left" />
                      <div className="hud-corner bottom-right" />

                      <div className="forensic-radar-ring">
                        <div className="forensic-radar-sweep" />
                        <Target size={36} color="#38bdf8" />
                      </div>

                      <div className="forensic-hud-status">
                        [ ANALYZING FACIAL SENSOR NOISE... ]
                      </div>
                    </div>
                  )}

                  {/* Brand New Animation Layer 2: Holographic Verdict Stamp Pop on Result */}
                  {verdictAnimation === 'correct' && (
                    <div className="hud-targeting-overlay" style={{ background: 'rgba(5, 150, 105, 0.25)' }}>
                      <div className="verdict-stamp-badge correct">
                        <CheckCircle2 size={46} color="#ffffff" strokeWidth={2.5} />
                        <div className="verdict-stamp-title">CORRECT!</div>
                        <div className="verdict-stamp-sub">
                          +{currentResult?.xpEarned || 10} XP EARNED
                        </div>
                      </div>
                    </div>
                  )}

                  {verdictAnimation === 'incorrect' && (
                    <div className="hud-targeting-overlay" style={{ background: 'rgba(220, 38, 38, 0.25)' }}>
                      <div className="verdict-stamp-badge incorrect">
                        <XCircle size={46} color="#ffffff" strokeWidth={2.5} />
                        <div className="verdict-stamp-title">INCORRECT!</div>
                        <div className="verdict-stamp-sub">
                          Actual: {currentResult?.correctAnswer === 'REAL' ? 'REAL PHOTO' : 'AI-GENERATED DEEPFAKE'}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentChallenge?.imageUrl && (
                    <img
                      src={currentChallenge.imageUrl}
                      alt={currentChallenge.title || 'Case challenge'}
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '440px',
                        objectFit: 'contain',
                        display: 'block',
                        background: '#0a0f1d',
                      }}
                    />
                  )}
                </div>

                {/* Prompt Instruction */}
                <div style={{ textAlign: 'center', margin: '20px 0 10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    YOUR FORENSIC VERDICT
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 900 }}>
                    Is this photograph REAL or AI-GENERATED?
                  </h3>
                </div>

                {/* Decision Buttons (REAL or AI_GENERATED) with Crystal Clear Feedback */}
                <div className="decision-buttons-grid">
                  <button
                    className={`btn-decision btn-real ${
                      selectedPrediction === 'REAL' ? 'selected' : ''
                    } ${
                      currentResult
                        ? currentResult.correctAnswer === 'REAL'
                          ? 'correct'
                          : selectedPrediction === 'REAL'
                          ? 'incorrect'
                          : ''
                        : ''
                    }`}
                    style={
                      currentResult
                        ? currentResult.correctAnswer === 'REAL'
                          ? { border: '3px solid #10b981', background: '#ecfdf5', color: '#065f46' }
                          : selectedPrediction === 'REAL'
                          ? { border: '3px solid #ef4444', background: '#fef2f2', color: '#991b1b' }
                          : { opacity: 0.55 }
                        : {}
                    }
                    disabled={submitting || currentResult !== null}
                    onClick={() => handleAnswer('REAL')}
                  >
                    <span className="decision-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {currentResult?.correctAnswer === 'REAL' && <Check size={18} color="#10b981" />}
                      {selectedPrediction === 'REAL' && currentResult && !currentResult.isCorrect && <X size={18} color="#ef4444" />}
                      REAL
                    </span>
                    <span className="decision-desc">Genuine Camera Photograph</span>
                  </button>

                  <button
                    className={`btn-decision btn-fake ${
                      selectedPrediction === 'AI_GENERATED' ? 'selected' : ''
                    } ${
                      currentResult
                        ? currentResult.correctAnswer === 'AI_GENERATED'
                          ? 'correct'
                          : selectedPrediction === 'AI_GENERATED'
                          ? 'incorrect'
                          : ''
                        : ''
                    }`}
                    style={
                      currentResult
                        ? currentResult.correctAnswer === 'AI_GENERATED'
                          ? { border: '3px solid #10b981', background: '#ecfdf5', color: '#065f46' }
                          : selectedPrediction === 'AI_GENERATED'
                          ? { border: '3px solid #ef4444', background: '#fef2f2', color: '#991b1b' }
                          : { opacity: 0.55 }
                        : {}
                    }
                    disabled={submitting || currentResult !== null}
                    onClick={() => handleAnswer('AI_GENERATED')}
                  >
                    <span className="decision-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {currentResult?.correctAnswer === 'AI_GENERATED' && <Check size={18} color="#10b981" />}
                      {selectedPrediction === 'AI_GENERATED' && currentResult && !currentResult.isCorrect && <X size={18} color="#ef4444" />}
                      AI-GENERATED
                    </span>
                    <span className="decision-desc">AI-Generated Synthetic Image</span>
                  </button>
                </div>

                {/* =====================================================================
                    INLINE FEEDBACK CARD (APPEARS ON THE SAME SCREEN UPON ANSWER SUBMISSION)
                    ===================================================================== */}
                {currentResult && (
                  <div
                    className={`result-feedback-card ${
                      currentResult.isCorrect ? 'correct' : 'incorrect'
                    }`}
                    style={{
                      marginTop: '24px',
                      animation: 'fadeIn 0.3s ease',
                      border: currentResult.isCorrect ? '2px solid #10b981' : '2px solid #ef4444',
                      background: currentResult.isCorrect ? '#f0fdf4' : '#fff5f5',
                    }}
                  >
                    <div className="result-badge-strip">
                      <div className="result-heading">
                        {currentResult.isCorrect ? (
                          <CheckCircle2 size={34} color="#059669" />
                        ) : (
                          <XCircle size={34} color="#dc2626" />
                        )}

                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                            FORENSIC EVALUATION RESULT
                          </span>
                          <h3 style={{ margin: '2px 0 0', fontSize: '19px', fontWeight: 900, color: currentResult.isCorrect ? '#059669' : '#dc2626' }}>
                            {currentResult.isCorrect ? '✓ CORRECT IDENTIFICATION!' : '✗ INCORRECT IDENTIFICATION'}
                          </h3>
                        </div>
                      </div>

                      {currentResult.xpEarned > 0 ? (
                        <div className="xp-tag-earned" style={{ fontSize: '15px', fontWeight: 800, padding: '6px 14px' }}>
                          <Sparkles size={16} /> +{currentResult.xpEarned} XP
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', padding: '6px 14px' }}>
                          +0 XP
                        </div>
                      )}
                    </div>

                    {/* Unlocked achievement banner */}
                    {currentResult.newlyUnlockedAchievements?.length > 0 && (
                      <div className="achievement-unlock-banner" style={{ margin: '14px 0' }}>
                        <span style={{ fontSize: '32px' }}>
                          {currentResult.newlyUnlockedAchievements[0].badge || '🎖️'}
                        </span>
                        <div>
                          <h4>Badge Unlocked: {currentResult.newlyUnlockedAchievements[0].name}!</h4>
                          <p>{currentResult.newlyUnlockedAchievements[0].description}</p>
                        </div>
                      </div>
                    )}

                    {/* Ground truth vs Player selection */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        margin: '16px 0',
                        background: '#ffffff',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          YOUR SELECTION
                        </span>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            marginTop: '3px',
                            color: currentResult.isCorrect ? '#059669' : '#dc2626',
                          }}
                        >
                          {selectedPrediction === 'REAL' ? 'REAL (Genuine Photo)' : 'AI-GENERATED (Synthetic)'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          CORRECT ANSWER (GROUND TRUTH)
                        </span>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: currentResult.correctAnswer === 'REAL' ? '#059669' : '#0284c7',
                            marginTop: '3px',
                          }}
                        >
                          {currentResult.correctAnswer === 'REAL'
                            ? 'REAL (Genuine Human Photograph)'
                            : 'AI-GENERATED (Synthetic Human Photograph)'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          CURRENT STREAK
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '3px' }}>
                          🔥 {currentResult.currentStreak || 0}
                        </div>
                      </div>
                    </div>

                    {/* Educational Explanation */}
                    {(currentResult.explanation || currentResult.educationalExplanation) && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          margin: '16px 0',
                          padding: '14px 16px',
                          background: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <Info size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: 1.6 }}>
                          <strong>Visual Forensic Explanation: </strong>
                          {currentResult.explanation || currentResult.educationalExplanation}
                        </div>
                      </div>
                    )}

                    {/* Action: Next Question or Complete Session Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                      <Button variant="primary" onClick={handleNextQuestion} style={{ padding: '10px 24px', fontSize: '14px' }}>
                        {currentIndex + 1 < challenges.length ? (
                          <>
                            Next Photograph <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            View Session Results <Trophy size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* =========================================================================
              VIEW 3: SESSION COMPLETED / SUMMARY SCREEN
              ========================================================================= */}
          {gameState === 'summary' && (
            <GlassCard style={{ padding: '36px 28px', textAlign: 'center', maxWidth: '720px', margin: '20px auto' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '44px',
                  margin: '0 auto 18px',
                  boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)',
                }}
              >
                🏆
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 8px' }}>
                Session Investigation Completed!
              </h2>

              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
                You have finished analyzing all photographs in this deck. Here is your forensic performance:
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
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PHOTOGRAPHS</span>
                  <div style={{ fontSize: '22px', fontWeight: 900 }}>
                    {sessionCompletedData?.session?.questionsAttempted || sessionHistory.length || challenges.length}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>CORRECT</span>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669' }}>
                    {sessionCompletedData?.session?.correctAnswers ??
                      sessionHistory.filter((h) => h.isCorrect).length}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>INCORRECT</span>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626' }}>
                    {sessionCompletedData?.session?.incorrectAnswers ??
                      sessionHistory.filter((h) => !h.isCorrect).length}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>TOTAL XP</span>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb' }}>
                    +{(
                      sessionCompletedData?.session?.xpEarned ||
                      sessionHistory.reduce((acc, h) => acc + (h.xpEarned || 0), 0)
                    ).toLocaleString()}{' '}
                    XP
                  </div>
                </div>
              </div>

              {/* Bonus tag if applicable */}
              {sessionCompletedData?.completionBonus > 0 && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#fef9c3',
                    border: '1px solid #fde047',
                    color: '#854d0e',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '24px',
                  }}
                >
                  ⭐ Earned +{sessionCompletedData.completionBonus} XP Session Completion Bonus!
                </div>
              )}

              {/* Question-by-Question Review Breakdown */}
              {sessionHistory.length > 0 && (
                <div style={{ textAlign: 'left', marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px' }}>
                    Case-by-Case Breakdown:
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {sessionHistory.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          background: item.isCorrect ? '#f0fdf4' : '#fff5f5',
                          borderRadius: '8px',
                          border: `1px solid ${item.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                          fontSize: '13px',
                        }}
                      >
                        {item.challenge?.imageUrl && (
                          <img
                            src={item.challenge.imageUrl}
                            alt={`Case #${idx + 1}`}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block' }}>Case #{idx + 1}: {item.challenge?.title || 'Photograph'}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Your choice: <strong>{item.userPrediction}</strong> · Correct: <strong>{item.correctAnswer}</strong>
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, color: item.isCorrect ? '#059669' : '#dc2626' }}>
                          {item.isCorrect ? `+${item.xpEarned} XP` : '+0 XP'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button onClick={() => handleStartChallenge()}>
                  <RotateCcw size={16} /> Play Next Deck
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
