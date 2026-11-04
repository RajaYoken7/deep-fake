import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  Mail,
  UserCheck,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Calendar,
  BarChart3,
  Medal,
  Play,
  Check,
  Layers,
  FileText,
  Search,
  ExternalLink,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { Button, GlassCard } from '../../../components/UI';
import { PublicNav, BackButton } from '../../../pages/Modules';
import { useAuth } from '../../../contexts/AuthContext';
import {
  GAME_TITLE,
  GAME_SUBTITLE,
  calculateAccuracy,
  getPerformanceTier,
} from './cyberCrimeData';
import {
  getUtcDateKey,
  getNextDailyResetInfo,
  getDailyMissionsForDate,
  loadUserProgress,
  saveUserProgress,
  isMissionCompletedToday,
  recordMissionCompletion,
} from './cyberCrimeStorage';
import {
  claimCyberCrimeReward,
  getCyberCrimeRounds,
  evaluateCyberCrimeAnswer,
} from '../services/gameApi';
import './cyberCrime.css';

export function CyberCrimeInvestigationGame({ go, back, notify }) {
  const { user, updateUser } = useAuth();
  const userId = user?.id || user?._id || user?.email || 'detective_guest';

  // Database-backed published rounds from MongoDB Atlas
  const [dbRounds, setDbRounds] = useState([]);
  const [loadingDbRounds, setLoadingDbRounds] = useState(true);

  // Completed deck tracking
  const [completedDeckIds, setCompletedDeckIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`deeptrust_cyber_completed_decks_${userId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });


  // In-game flow states: 'hub' | 'deck_play' | 'deck_results' | 'mission_play'
  const [viewState, setViewState] = useState('hub');
  // Sub-tabs: 'campaign' (Deck Selection) | 'missions'
  const [activeTab, setActiveTab] = useState('campaign');

  // Selected Deck and active question state
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentEvalResult, setCurrentEvalResult] = useState(null);
  const [deckAnswers, setDeckAnswers] = useState([]);
  const [showClues, setShowClues] = useState(false);

  // Deck Summary data for 'deck_results'
  const [deckSummaryData, setDeckSummaryData] = useState(null);

  // Persistent user statistics (Layer 2)
  const [userProgress, setUserProgress] = useState(() => loadUserProgress(userId));
  const [resetTimer, setResetTimer] = useState(() => getNextDailyResetInfo());

  // Daily Mission state
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionSelectedOption, setMissionSelectedOption] = useState(null);
  const [isMissionSubmitted, setIsMissionSubmitted] = useState(false);
  const [missionResultData, setMissionResultData] = useState(null);

  // Current date key in UTC
  const todayDateKey = useMemo(() => getUtcDateKey(), []);

  // Daily missions pool for today
  const dailyMissions = useMemo(
    () => getDailyMissionsForDate(todayDateKey, 3),
    [todayDateKey]
  );

  // Global total XP (Layer 1): prefer authenticated user profile, fallback to local
  const globalTotalXP = user?.totalXP !== undefined ? user.totalXP : userProgress.totalPoints;
  const globalLevel = user?.currentLevel !== undefined ? user.currentLevel : 1;
  const globalRank = user?.currentRank || 'Bronze Detective';

  // Fetch published rounds from database
  const fetchRounds = useCallback(async () => {
    try {
      setLoadingDbRounds(true);
      const res = await getCyberCrimeRounds();
      const loaded = res?.data?.rounds || res?.rounds || [];

      // Filter only published rounds that have questions
      const playable = loaded.filter(
        (r) => Array.isArray(r.questions) && r.questions.length > 0
      );
      setDbRounds(playable);

      const validDeckIds = new Set(playable.map((r) => r.id));

      // Build active completed set strictly from valid playable rounds and backend metadata
      const nextCompleted = new Set();
      playable.forEach((r) => {
        if (r.isCompleted) {
          nextCompleted.add(r.id);
        }
      });

      // Synchronize with localStorage: only retain IDs that belong to currently published playable decks
      try {
        const storedKey = `deeptrust_cyber_completed_decks_${userId}`;
        const stored = localStorage.getItem(storedKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((id) => {
              if (validDeckIds.has(id)) {
                const deck = playable.find((r) => r.id === id);
                if (deck && deck.isCompleted) {
                  nextCompleted.add(deck.id);
                }
              }
            });
          }
        }
        localStorage.setItem(storedKey, JSON.stringify(Array.from(nextCompleted)));
      } catch {}

      setCompletedDeckIds(nextCompleted);

      // If user currently had a selected deck that was deleted by admin, reset view back to hub
      setSelectedDeck((currentSelected) => {
        if (currentSelected && !validDeckIds.has(currentSelected.id)) {
          setViewState('hub');
          return null;
        }
        return currentSelected;
      });
    } catch (err) {
      console.warn('Failed to load published Cyber Crime rounds from database:', err);
    } finally {
      setLoadingDbRounds(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // Live timer for next UTC daily reset
  useEffect(() => {
    const interval = setInterval(() => {
      setResetTimer(getNextDailyResetInfo());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reload progress when user changes
  useEffect(() => {
    setUserProgress(loadUserProgress(userId));
  }, [userId]);

  // Available uncompleted decks (finished decks automatically vanish)
  const availableDecks = useMemo(() => {
    return dbRounds.filter(
      (r) => !completedDeckIds.has(r.id) && !completedDeckIds.has(r.roundId) && !r.isCompleted
    );
  }, [dbRounds, completedDeckIds]);

  // Determine if all published decks have been completed
  const allDecksCompleted = useMemo(() => {
    if (dbRounds.length === 0) return false;
    return availableDecks.length === 0;
  }, [dbRounds, availableDecks]);

  // Current active question in active deck
  const activeQuestion = useMemo(() => {
    if (selectedDeck && selectedDeck.questions && selectedDeck.questions[currentQuestionIndex]) {
      return selectedDeck.questions[currentQuestionIndex];
    }
    return null;
  }, [selectedDeck, currentQuestionIndex]);

  // Current deck accumulated score
  const currentDeckScore = useMemo(() => {
    return deckAnswers.filter((a) => a.isCorrect).length * 10;
  }, [deckAnswers]);

  /**
   * User selects ANY deck to play. Non-consecutive.
   */
  const handleSelectDeck = (deck) => {
    if (!deck || !deck.questions || deck.questions.length === 0) return;
    setSelectedDeck(deck);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setCurrentEvalResult(null);
    setDeckAnswers([]);
    setShowClues(false);
    setDeckSummaryData(null);
    setViewState('deck_play');
  };

  /**
   * Replays current or selected deck.
   */
  const handleReplayDeck = () => {
    if (!selectedDeck) {
      setViewState('hub');
      return;
    }
    handleSelectDeck(selectedDeck);
  };

  /**
   * Submits evaluation for the active question against MongoDB backend.
   */
  const handleSubmitDeckAnswer = async () => {
    if (!selectedOptionId || isAnswerSubmitted || !activeQuestion || submittingAnswer) return;

    setSubmittingAnswer(true);
    let isCorrect = false;
    let explanation = activeQuestion.explanation || '';
    let correctOptionId = '';
    let xpAwarded = 0;

    try {
      const evalRes = await evaluateCyberCrimeAnswer({
        questionId: activeQuestion.id || activeQuestion.questionId,
        selectedOptionId,
      });

      // Unwrap response whether it is { data: { isCorrect, ... } } or { isCorrect, ... }
      const resObj = evalRes?.data && typeof evalRes.data === 'object' && 'isCorrect' in evalRes.data
        ? evalRes.data
        : evalRes;

      if (resObj && typeof resObj.isCorrect === 'boolean') {
        isCorrect = resObj.isCorrect;
        explanation = resObj.explanation || explanation;
        correctOptionId = String(resObj.correctOptionId || resObj.correctAnswer || '').toLowerCase();
        xpAwarded = resObj.xpAwarded !== undefined ? resObj.xpAwarded : (isCorrect ? 10 : 0);
      } else {
        console.warn('Unexpected evaluate response format:', evalRes);
        const expected = String(activeQuestion.correctAnswer || activeQuestion.correctOptionId || '').toLowerCase();
        isCorrect = expected ? selectedOptionId.toLowerCase() === expected : false;
        correctOptionId = expected || 'a';
        xpAwarded = isCorrect ? 10 : 0;
      }
    } catch (err) {
      console.warn('Backend answer evaluation fallback to local:', err);
      const expected = String(activeQuestion.correctAnswer || activeQuestion.correctOptionId || '').toLowerCase();
      isCorrect = expected ? selectedOptionId.toLowerCase() === expected : false;
      correctOptionId = expected || 'a';
      xpAwarded = isCorrect ? 10 : 0;
    } finally {
      setSubmittingAnswer(false);
    }

    const evalResult = {
      isCorrect,
      explanation,
      correctOptionId,
      xpAwarded,
      selectedOptionId,
    };

    setCurrentEvalResult(evalResult);

    const answerRecord = {
      questionIndex: currentQuestionIndex,
      questionText: activeQuestion.questionText || activeQuestion.question,
      selectedOptionId,
      correctOptionId,
      isCorrect,
      explanation,
      xpAwarded,
    };

    setDeckAnswers((prev) => [...prev, answerRecord]);
    setIsAnswerSubmitted(true);
  };

  /**
   * Advance to next question or complete deck.
   */
  const handleNextDeckQuestion = () => {
    if (!selectedDeck) return;

    if (currentQuestionIndex + 1 < selectedDeck.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setCurrentEvalResult(null);
      setShowClues(false);
    } else {
      handleFinishDeck();
    }
  };

  /**
   * Finishes the selected deck, awards EXP, and shows the Deck Results Screen.
   */
  const handleFinishDeck = async () => {
    if (!selectedDeck) return;

    const totalQuestions = selectedDeck.questions.length;
    const correctCount = deckAnswers.filter((a) => a.isCorrect).length;
    const totalScore = correctCount * 10;
    const maxScore = totalQuestions * 10;
    const accuracy = calculateAccuracy(correctCount, totalQuestions);

    const deckUniqueId = selectedDeck.id || selectedDeck._id;

    // Persist completed deck ID
    setCompletedDeckIds((prev) => {
      const updated = new Set(prev);
      if (deckUniqueId) updated.add(deckUniqueId);
      try {
        localStorage.setItem(
          `deeptrust_cyber_completed_decks_${userId}`,
          JSON.stringify(Array.from(updated))
        );
      } catch {}
      return updated;
    });

    // Synchronize in-memory dbRounds state so UI updates immediately
    setDbRounds((prev) =>
      prev.map((r) =>
        r.id === deckUniqueId || r.roundId === selectedDeck.roundId
          ? { ...r, isCompleted: true }
          : r
      )
    );

    // Award EXP authoritatively to global profile
    if (user) {
      try {
        const rewardRes = await claimCyberCrimeReward({
          rewardType: 'round',
          attemptId: 'deck_' + Date.now(),
          roundId: deckUniqueId || selectedDeck.roundId,
          correctCount,
          totalQuestions,
        });

        const serverUser = rewardRes?.user || rewardRes?.data?.user;
        if (serverUser && updateUser) {
          updateUser(serverUser);
        } else if (totalScore > 0 && updateUser) {
          updateUser({
            totalXP: (user.totalXP || 0) + totalScore,
          });
        }
      } catch (err) {
        console.warn('EXP claim fallback:', err);
        if (totalScore > 0 && updateUser) {
          updateUser({
            totalXP: (user.totalXP || 0) + totalScore,
          });
        }
      }
    }

    if (notify) {
      notify(`Deck Completed! +${totalScore} Global EXP awarded.`);
    }

    const summaryPayload = {
      deck: selectedDeck,
      score: totalScore,
      maxScore,
      accuracy,
      correctCount,
      totalQuestions,
      answers: deckAnswers,
    };

    setDeckSummaryData(summaryPayload);
    setViewState('deck_results');
  };

  /**
   * Start a specific daily mission.
   */
  const handleStartMission = (mission) => {
    setSelectedMission(mission);
    setMissionSelectedOption(null);
    setIsMissionSubmitted(false);
    setMissionResultData(null);
    setViewState('mission_play');
  };

  /**
   * Submit evaluation for daily mission.
   */
  const handleSubmitMissionAnswer = async () => {
    if (!missionSelectedOption || isMissionSubmitted || !selectedMission) return;

    const isCorrect = missionSelectedOption === selectedMission.question.correctOptionId;
    setIsMissionSubmitted(true);

    let rewardAwarded = 0;

    if (isCorrect) {
      const completionResult = recordMissionCompletion(
        userId,
        selectedMission.id,
        selectedMission.rewardXP,
        todayDateKey
      );
      rewardAwarded = completionResult.rewardAwarded;
      setUserProgress(completionResult.updatedProgress);

      if (rewardAwarded > 0 && user && updateUser) {
        updateUser({
          totalXP: (user.totalXP || 0) + rewardAwarded,
        });
      }

      if (rewardAwarded > 0 && user) {
        try {
          const rewardResponse = await claimCyberCrimeReward({
            rewardType: 'mission',
            missionId: selectedMission.id,
            dateKey: todayDateKey,
          });

          const serverUser = rewardResponse?.user || rewardResponse?.data?.user;
          if (serverUser && updateUser) {
            updateUser(serverUser);
          }
        } catch (err) {
          console.warn('Backend mission EXP sync fallback:', err?.message || err);
        }
      }

      if (rewardAwarded > 0 && notify) {
        notify(`Mission Successful! Awarded +${rewardAwarded} Global EXP.`);
      }
    } else {
      if (notify) {
        notify('Mission Unsuccessful! No EXP awarded.');
      }
    }

    setMissionResultData({
      isCorrect,
      rewardAwarded,
      explanation: selectedMission.question.explanation,
    });
  };

  return (
    <div className="modules-page module-detail">
      <PublicNav go={go} />
      <main>
        <BackButton back={viewState === 'hub' ? back : () => setViewState('hub')} />

        <div className="cyber-game-container">
          {/* Breadcrumb Navigation */}
          <div className="cyber-breadcrumb">
            <button onClick={() => go('modules')}>DeepTrust Academy</button>
            <span className="cyber-breadcrumb-separator">/</span>
            <button onClick={() => go('games')}>Game Center</button>
            <span className="cyber-breadcrumb-separator">/</span>
            <button
              onClick={() => setViewState('hub')}
              style={{ fontWeight: viewState === 'hub' ? 700 : 500 }}
            >
              Cyber Crime Investigation
            </button>
            {viewState === 'deck_play' && selectedDeck && (
              <>
                <span className="cyber-breadcrumb-separator">/</span>
                <span style={{ color: 'var(--text, #0f172a)', fontWeight: 700 }}>
                  Deck #{selectedDeck.roundNumber}: {selectedDeck.roundTitle}
                </span>
              </>
            )}
            {viewState === 'deck_results' && selectedDeck && (
              <>
                <span className="cyber-breadcrumb-separator">/</span>
                <span style={{ color: 'var(--text, #0f172a)', fontWeight: 700 }}>
                  Deck Results: {selectedDeck.roundTitle}
                </span>
              </>
            )}
          </div>

          {/* Hero Header Banner */}
          <div className="cyber-hero-banner">
            <div className="cyber-hero-title-group">
              <div className="cyber-hero-icon">
                <ShieldCheck size={32} />
              </div>
              <div className="cyber-hero-text">
                <h1>{GAME_TITLE}</h1>
                <p>{GAME_SUBTITLE}</p>
              </div>
            </div>

            {/* Profile Level & XP Pill */}
            <div className="cyber-hero-stats">
              <div className="cyber-stat-pill">
                <Sparkles size={16} color="var(--purple, #7c3aed)" />
                <span>{globalTotalXP} Global EXP</span>
              </div>
              <div className="cyber-stat-pill">
                <Award size={16} />
                <span>Level {globalLevel} • {globalRank}</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              VIEW: HUB (INVESTIGATION DECKS)
              ========================================================================= */}
          {viewState === 'hub' && (
            <div>
              {/* Case 1: Loading state */}
              {loadingDbRounds && (
                    <div className="waiting-admin-deck" style={{ padding: '60px 24px' }}>
                      <RotateCcw size={40} className="spin-icon" style={{ color: '#0284c7', margin: '0 auto 16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                        Connecting to Forensic Case Database...
                      </h3>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                        Retrieving published investigation decks from MongoDB Atlas.
                      </p>
                    </div>
                  )}

                  {/* Case 2: Zero published rounds in database -> Waiting Screen */}
                  {!loadingDbRounds && dbRounds.length === 0 && (
                    <div className="waiting-admin-deck">
                      <div className="waiting-radar-icon">
                        <Fingerprint size={42} />
                      </div>
                      <span className="waiting-admin-badge">AWAITING INVESTIGATION CASES</span>
                      <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '8px 0 12px', color: '#0f172a' }}>
                        No Active Investigation Cases Available
                      </h2>
                      <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: '480px' }}>
                        All investigation cases have been concluded. Please wait for the administrator to upload new investigation rounds and questions. Once uploaded, you can continue playing.
                      </p>
                      <Button
                        variant="primary"
                        disabled={loadingDbRounds}
                        onClick={fetchRounds}
                        style={{ minWidth: '240px', padding: '12px 24px', fontSize: '15px', fontWeight: 700 }}
                      >
                        <RotateCcw size={18} className={loadingDbRounds ? 'spin-icon' : ''} style={{ marginRight: '8px' }} />
                        {loadingDbRounds ? 'Checking Database...' : 'Check for New Rounds (Refresh)'}
                      </Button>
                    </div>
                  )}

                  {/* Case 3: All published decks finished by user -> Waiting for Admin Upload Screen */}
                  {!loadingDbRounds && dbRounds.length > 0 && availableDecks.length === 0 && (
                    <div className="waiting-admin-deck">
                      <div className="waiting-radar-icon" style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)', border: '1px solid #86efac', color: '#059669' }}>
                        <CheckCircle2 size={42} />
                      </div>
                      <span className="waiting-admin-badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                        ALL INVESTIGATION CASES SOLVED
                      </span>
                      <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '8px 0 12px', color: '#0f172a' }}>
                        All Available Investigation Decks Completed!
                      </h2>
                      <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: '480px' }}>
                        You have successfully solved every published investigation case! Please wait for the administrator to upload new investigation rounds and questions. Once uploaded, you can continue playing immediately.
                      </p>
                      <Button
                        variant="primary"
                        disabled={loadingDbRounds}
                        onClick={fetchRounds}
                        style={{ minWidth: '240px', padding: '12px 24px', fontSize: '15px', fontWeight: 700 }}
                      >
                        <RotateCcw size={18} className={loadingDbRounds ? 'spin-icon' : ''} style={{ marginRight: '8px' }} />
                        {loadingDbRounds ? 'Checking Database...' : 'Check for New Rounds (Refresh)'}
                      </Button>
                    </div>
                  )}

                  {/* Case 4: Uncompleted active decks available -> Render availableDecks only */}
                  {!loadingDbRounds && availableDecks.length > 0 && (
                    <div>
                      {/* Section Heading & Refresh Shortcut */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                            Select an Investigation Deck
                          </h2>
                          <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted, #64748b)' }}>
                            Choose any case below to investigate forensic clues and identify deceptive threats. Finished cases automatically vanish.
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={fetchRounds}
                          disabled={loadingDbRounds}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <RotateCcw size={16} className={loadingDbRounds ? 'spin-icon' : ''} />
                          Check for Updates
                        </Button>
                      </div>

                      {/* DECK GRID: User can select ANY active uncompleted card */}
                      <div className="cyber-rounds-preview-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {availableDecks.map((deck) => {
                          return (
                            <div
                              key={deck.id || deck.roundId}
                              className="cyber-round-preview-card"
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                border: '1px solid var(--line, #e2e8f0)',
                                background: 'var(--card-bg, #ffffff)',
                                transition: 'all 0.2s ease',
                              }}
                              onClick={() => handleSelectDeck(deck)}
                            >
                              <div>
                                <div className="cyber-round-preview-header" style={{ marginBottom: '14px' }}>
                                  <span className="cyber-round-badge">
                                    Round {deck.roundNumber}
                                  </span>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span
                                      className={`cyber-difficulty-badge ${deck.difficulty?.toLowerCase() || 'medium'}`}
                                      style={{ fontSize: '11px', padding: '3px 8px' }}
                                    >
                                      {deck.difficulty || 'Medium'}
                                    </span>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        color: '#0284c7',
                                        background: '#e0f2fe',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                      }}
                                    >
                                      <Sparkles size={12} /> ACTIVE CASE
                                    </span>
                                  </div>
                                </div>

                                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text, #0f172a)' }}>
                                  {deck.roundTitle}
                                </h3>

                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                  {deck.caseDossierTitle} • {deck.evidenceCategory}
                                </div>

                                <p style={{ fontSize: '13px', color: 'var(--muted, #64748b)', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {deck.incidentDescription}
                                </p>
                              </div>

                              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--line, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted, #64748b)' }}>
                                  {deck.questions?.length || 0} Forensic Challenges
                                </span>
                                <Button
                                  variant="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectDeck(deck);
                                  }}
                                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 700 }}
                                >
                                  Investigate Case →
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
            </div>
          )}

          {/* =========================================================================
              VIEW: PLAYING SELECTED DECK
              ========================================================================= */}
          {viewState === 'deck_play' && selectedDeck && activeQuestion && (
            <div>
              {/* Question Progress Header Bar */}
              <div className="cyber-question-tracker-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="cyber-round-badge">
                    Deck #{selectedDeck.roundNumber}: {selectedDeck.roundTitle}
                  </span>
                  <div className="cyber-dots-container">
                    {(selectedDeck.questions || []).map((_, i) => (
                      <span
                        key={i}
                        className={`cyber-step-dot ${
                          i === currentQuestionIndex
                            ? 'active'
                            : i < deckAnswers.length
                            ? 'completed'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Question {currentQuestionIndex + 1} of {selectedDeck.questions.length}
                  </span>
                  <span className="cyber-question-score-pill">
                    Score: {currentDeckScore} / {selectedDeck.questions.length * 10} pts
                  </span>
                </div>
              </div>

              {/* Dynamic Investigation Grid */}
              <div className="cyber-play-grid">
                {/* Left: Forensic Evidence Dossier */}
                <div className="cyber-evidence-card">
                  <div className="cyber-evidence-header">
                    <h3>
                      <Fingerprint size={20} color="var(--purple)" /> {selectedDeck.caseDossierTitle || 'Case Evidence Dossier'}
                    </h3>
                    <span className="cyber-round-badge">{selectedDeck.evidenceCategory || 'Digital Forensics'}</span>
                  </div>

                  {/* Incident Description */}
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: '12px',
                      background: 'var(--surface2, #f8fafc)',
                      border: '1px solid var(--line, #e2e8f0)',
                      fontSize: '14px',
                      color: 'var(--text, #0f172a)',
                      lineHeight: '1.6',
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'var(--cyan, #0284c7)',
                      }}
                    >
                      Incident Description:
                    </strong>
                    <p style={{ margin: '0 0 10px 0' }}>
                      {selectedDeck.incidentDescription}
                    </p>

                    {selectedDeck.interceptedCommunication && (
                      <div style={{ marginTop: '12px' }}>
                        <strong
                          style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: 'var(--purple, #7c3aed)',
                          }}
                        >
                          Intercepted Communication:
                        </strong>
                        <pre
                          style={{
                            margin: 0,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'var(--surface, #ffffff)',
                            border: '1px solid var(--line, #e2e8f0)',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            color: 'var(--text, #0f172a)',
                          }}
                        >
                          {selectedDeck.interceptedCommunication}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Forensic Clues Inspection Toggle */}
                  <div className="cyber-clues-section">
                    <button
                      className="cyber-clues-toggle"
                      onClick={() => setShowClues(!showClues)}
                    >
                      <HelpCircle size={16} />
                      {showClues ? 'Hide Detective Notes' : 'Inspect Forensic Clues'}
                      {showClues ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showClues && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="cyber-clue-item warning">
                          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ whiteSpace: 'pre-line' }}>
                            <strong>Forensic Clues: </strong>
                            {selectedDeck.forensicClues ||
                              'Analyze indicators of artificial urgency, spoofed domains, unexpected payment requests, or unusual communication protocols.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Question & Multiple Choice Options Panel */}
                <div className="cyber-question-card">
                  <div className="cyber-question-header">
                    <span className="cyber-question-number">
                      Forensic Challenge {currentQuestionIndex + 1} of {selectedDeck.questions.length}
                    </span>
                    <span className="cyber-question-score-pill">+10 Global EXP</span>
                  </div>

                  <h3 className="cyber-question-prompt">
                    {activeQuestion.questionText || activeQuestion.question}
                  </h3>

                  {/* Options (A, B, C, D) */}
                  <div className="cyber-options-list">
                    {(activeQuestion.options || []).map((option) => {
                      const optId = option.id.toLowerCase();
                      const isSelected = selectedOptionId === optId;
                      const isCorrectAnswer = isAnswerSubmitted && currentEvalResult && optId === currentEvalResult.correctOptionId;
                      const isSelectedWrong = isAnswerSubmitted && isSelected && !currentEvalResult?.isCorrect;

                      let stateClass = '';
                      let customStyle = {};
                      if (isCorrectAnswer) {
                        stateClass = 'correct';
                        customStyle = { border: '2.5px solid #059669', background: '#ecfdf5', color: '#065f46' };
                      } else if (isSelectedWrong) {
                        stateClass = 'incorrect';
                        customStyle = { border: '2.5px solid #dc2626', background: '#fef2f2', color: '#991b1b' };
                      } else if (isAnswerSubmitted) {
                        customStyle = { opacity: 0.5 };
                      } else if (isSelected) {
                        stateClass = 'selected';
                      }

                      return (
                        <button
                          key={optId}
                          className={`cyber-option-btn ${stateClass}`}
                          style={customStyle}
                          disabled={isAnswerSubmitted || submittingAnswer}
                          onClick={() => setSelectedOptionId(optId)}
                        >
                          <span className="cyber-option-letter" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {isCorrectAnswer && <Check size={14} color="#059669" />}
                            {isSelectedWrong && <X size={14} color="#dc2626" />}
                            {optId.toUpperCase()}
                          </span>
                          <span>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Button: Submit or Proceed */}
                  {!isAnswerSubmitted ? (
                    <Button
                      variant="primary"
                      disabled={!selectedOptionId || submittingAnswer}
                      onClick={handleSubmitDeckAnswer}
                    >
                      {submittingAnswer ? 'Evaluating...' : 'Submit Forensic Analysis'} <CheckCircle2 size={16} />
                    </Button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {currentEvalResult?.isCorrect ? (
                        <div
                          className="cyber-feedback-box correct"
                          style={{
                            border: '2px solid #10b981',
                            background: '#f0fdf4',
                            padding: '20px',
                            borderRadius: '14px',
                            animation: 'fadeIn 0.3s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <CheckCircle2 size={26} color="#059669" />
                              <div>
                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#059669' }}>
                                  ✓ CORRECT FORENSIC FINDING!
                                </h4>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>
                                  Well done! Option {currentEvalResult.correctOptionId?.toUpperCase()} is the correct answer.
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                background: '#15803d',
                                color: '#ffffff',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Sparkles size={14} /> +{currentEvalResult.xpAwarded || 10} Global EXP
                            </span>
                          </div>

                          <div style={{ padding: '14px 16px', background: '#ffffff', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            <strong style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#059669', marginBottom: '6px' }}>
                              Forensic Clue & Educational Explanation:
                            </strong>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#1e293b' }}>
                              {currentEvalResult.explanation || activeQuestion.explanation}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cyber-feedback-box incorrect"
                          style={{
                            border: '2px solid #ef4444',
                            background: '#fef2f2',
                            padding: '20px',
                            borderRadius: '14px',
                            animation: 'fadeIn 0.3s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <XCircle size={26} color="#dc2626" />
                              <div>
                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>
                                  ✗ INCORRECT ANALYSIS
                                </h4>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>
                                  Your Answer (Option {selectedOptionId?.toUpperCase()}) is wrong. The correct answer is Option {currentEvalResult?.correctOptionId?.toUpperCase()}.
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                background: '#f1f5f9',
                                color: '#64748b',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 800,
                              }}
                            >
                              +0 EXP
                            </span>
                          </div>

                          <div style={{ padding: '14px 16px', background: '#ffffff', borderRadius: '10px', border: '1px solid #fecaca' }}>
                            <strong style={{ display: 'block', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: '6px' }}>
                              Answer is wrong because:
                            </strong>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#1e293b' }}>
                              {currentEvalResult?.explanation || activeQuestion.explanation}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button variant="primary" onClick={handleNextDeckQuestion}>
                        {currentQuestionIndex + 1 < selectedDeck.questions.length ? (
                          <>
                            Next Forensic Question <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            Complete Deck & View Results <Trophy size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW: DECK RESULTS SCREEN
              ========================================================================= */}
          {viewState === 'deck_results' && deckSummaryData && (
            <div className="cyber-results-container">
              {(() => {
                const tierInfo = getPerformanceTier(deckSummaryData.accuracy);
                return (
                  <div>
                    <div className="cyber-results-header">
                      <div className="cyber-results-trophy">
                        <Trophy size={36} />
                      </div>
                      <span className={`cyber-results-tier-badge ${tierInfo.color}`}>
                        <Award size={16} /> {tierInfo.tier}
                      </span>
                      <h2>Investigation Deck Resolved!</h2>
                      <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: '#0f172a', fontWeight: 800 }}>
                        {deckSummaryData.deck?.roundTitle}
                      </h3>
                      <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                        {tierInfo.message}
                      </p>
                    </div>

                    <div className="cyber-results-grid">
                      <div className="cyber-result-stat-card">
                        <span>Accuracy Rate</span>
                        <strong style={{ color: 'var(--cyan)' }}>
                          {deckSummaryData.accuracy}%
                        </strong>
                      </div>
                      <div className="cyber-result-stat-card">
                        <span>Deck Score</span>
                        <strong style={{ color: 'var(--purple)' }}>
                          {deckSummaryData.score} / {deckSummaryData.maxScore}
                        </strong>
                      </div>
                      <div className="cyber-result-stat-card">
                        <span>Correct Findings</span>
                        <strong>
                          {deckSummaryData.correctCount} / {deckSummaryData.totalQuestions}
                        </strong>
                      </div>
                    </div>

                    {/* EXP Reward Banner */}
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={22} color="var(--purple)" />
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text)' }}>
                            EXP Credited to Global Profile!
                          </strong>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                            Awarded +{deckSummaryData.score} EXP to your shared DeepTrust Academy account.
                          </p>
                        </div>
                      </div>
                      <span className="cyber-round-badge" style={{ background: 'var(--purple)', color: '#fff' }}>
                        Level {globalLevel} • {globalRank}
                      </span>
                    </div>

                    {/* Question by Question Review */}
                    <div style={{ textAlign: 'left', marginBottom: '28px' }}>
                      <h4 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        Case Findings & Evidence Review
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {deckSummaryData.answers.map((ans, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              background: ans.isCorrect ? '#f0fdf4' : '#fef2f2',
                              border: ans.isCorrect ? '1px solid #86efac' : '1px solid #fca5a5',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              {ans.isCorrect ? (
                                <CheckCircle2 size={16} color="#059669" />
                              ) : (
                                <XCircle size={16} color="#dc2626" />
                              )}
                              <strong style={{ fontSize: '13px', color: ans.isCorrect ? '#065f46' : '#991b1b' }}>
                                Challenge #{idx + 1}: {ans.isCorrect ? 'Correct Finding (+10 EXP)' : 'Incorrect Analysis (+0 EXP)'}
                              </strong>
                            </div>
                            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                              {ans.questionText}
                            </p>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                              Your Answer: <strong style={{ textTransform: 'uppercase' }}>Option {ans.selectedOptionId}</strong> • Correct Answer: <strong style={{ textTransform: 'uppercase' }}>Option {ans.correctOptionId}</strong>
                            </div>
                            <div style={{ fontSize: '12px', color: '#334155', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.7)', padding: '8px 12px', borderRadius: '8px' }}>
                              <strong style={{ color: ans.isCorrect ? '#065f46' : '#991b1b', fontStyle: 'normal', display: 'block', marginBottom: '4px' }}>
                                {ans.isCorrect ? 'Forensic Clue & Explanation:' : 'Answer is wrong because:'}
                              </strong>
                              {ans.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="cyber-results-actions">
                      <Button variant="primary" onClick={() => setViewState('hub')}>
                        <Layers size={16} /> Continue to Case Hub
                      </Button>
                      <Button variant="secondary" onClick={() => go('games')}>
                        <Gamepad2 size={16} /> Back to Game Center
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* =========================================================================
              VIEW: DAILY MISSION PLAY / REVIEW
              ========================================================================= */}
          {viewState === 'mission_play' && selectedMission && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="cyber-question-card">
                <div className="cyber-question-header">
                  <span className="cyber-round-badge">Daily Mission · {selectedMission.difficulty}</span>
                  <span className="cyber-question-score-pill">
                    <Sparkles size={14} /> +{selectedMission.rewardXP} Global EXP
                  </span>
                </div>

                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>
                  {selectedMission.title}
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--muted)' }}>
                  {selectedMission.description}
                </p>

                {/* Scenario & Evidence Box */}
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    background: 'var(--surface2, #f8fafc)',
                    border: '1px solid var(--line, #e2e8f0)',
                    marginBottom: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'var(--cyan, #0284c7)',
                        marginBottom: '4px',
                      }}
                    >
                      Scenario Dossier:
                    </strong>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                      {selectedMission.scenario}
                    </p>
                  </div>

                  {selectedMission.evidenceText && (
                    <div style={{ marginTop: '8px' }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'var(--purple, #7c3aed)',
                          marginBottom: '4px',
                        }}
                      >
                        Intercepted Communication:
                      </strong>
                      <pre
                        style={{
                          margin: 0,
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'var(--surface, #ffffff)',
                          border: '1px solid var(--line, #e2e8f0)',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          color: 'var(--text, #0f172a)',
                        }}
                      >
                        {selectedMission.evidenceText}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Question */}
                <h3 className="cyber-question-prompt">
                  {selectedMission.question.question}
                </h3>

                <div className="cyber-options-list">
                  {selectedMission.question.options.map((opt) => {
                    const isSelected = missionSelectedOption === opt.id;
                    const isCorrect =
                      isMissionSubmitted && opt.id === selectedMission.question.correctOptionId;
                    const isIncorrect = isMissionSubmitted && isSelected && !isCorrect;

                    let stateClass = '';
                    if (isCorrect) stateClass = 'correct';
                    else if (isIncorrect) stateClass = 'incorrect';
                    else if (isSelected) stateClass = 'selected';

                    return (
                      <button
                        key={opt.id}
                        className={`cyber-option-btn ${stateClass}`}
                        disabled={isMissionSubmitted}
                        onClick={() => setMissionSelectedOption(opt.id)}
                      >
                        <span className="cyber-option-letter">{opt.id.toUpperCase()}</span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {!isMissionSubmitted ? (
                  <Button
                    variant="primary"
                    disabled={!missionSelectedOption}
                    onClick={handleSubmitMissionAnswer}
                  >
                    Submit Mission Analysis <CheckCircle2 size={16} />
                  </Button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div
                      className={`cyber-feedback-box ${
                        missionResultData?.isCorrect ? 'correct' : 'incorrect'
                      }`}
                    >
                      <div className="cyber-feedback-title">
                        {missionResultData?.isCorrect ? (
                          <>
                            <CheckCircle2 size={18} /> Mission Succeeded! (+
                            {selectedMission.rewardXP} Global EXP Credited)
                          </>
                        ) : (
                          <>
                            <XCircle size={18} /> Mission Unsuccessful (0 Global EXP)
                          </>
                        )}
                      </div>
                      <p className="cyber-feedback-text">
                        {selectedMission.question.explanation}
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => {
                        setViewState('hub');
                        setActiveTab('missions');
                      }}
                    >
                      Back to Daily Missions <ArrowRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CyberCrimeInvestigationGame;
