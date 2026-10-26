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
} from 'lucide-react';
import { Button, GlassCard } from '../../../components/UI';
import { PublicNav, BackButton } from '../../../pages/Modules';
import { useAuth } from '../../../contexts/AuthContext';
import {
  GAME_TITLE,
  GAME_SUBTITLE,
  INVESTIGATION_ROUNDS,
  calculateAccuracy,
  getPerformanceTier,
} from './cyberCrimeData';
import {
  getUtcDateKey,
  getNextDailyResetInfo,
  getDailyMissionsForDate,
  loadUserProgress,
  saveUserProgress,
  loadActiveAttempt,
  saveActiveAttempt,
  clearActiveAttempt,
  createNewAttempt,
  recordRoundCompletion,
  recordCampaignCompletion,
  isMissionCompletedToday,
  recordMissionCompletion,
} from './cyberCrimeStorage';
import { claimCyberCrimeReward } from '../services/gameApi';
import './cyberCrime.css';

export function CyberCrimeInvestigationGame({ go, back, notify }) {
  const { user, updateUser } = useAuth();
  const userId = user?.id || user?._id || user?.email || 'detective_guest';

  // Game flow states: 'hub' | 'campaign' | 'round_summary' | 'campaign_results' | 'mission_play'
  const [viewState, setViewState] = useState('hub');
  // In-game Hub sub-tabs: 'campaign' | 'missions' (Analytics and Badges moved to Profile)
  const [activeTab, setActiveTab] = useState('campaign');

  // Persistent user statistics (Layer 2)
  const [userProgress, setUserProgress] = useState(() => loadUserProgress(userId));
  const [resetTimer, setResetTimer] = useState(() => getNextDailyResetInfo());

  // Active attempt state (Layer 3)
  const [activeAttempt, setActiveAttempt] = useState(() => loadActiveAttempt(userId));

  // In-game question state for the active attempt
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showClues, setShowClues] = useState(false);

  // Round summary interstitial state
  const [roundSummaryData, setRoundSummaryData] = useState(null);

  // Final campaign results state
  const [lastCampaignSummary, setLastCampaignSummary] = useState(null);

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

  // Reload progress and active attempt when user changes
  useEffect(() => {
    setUserProgress(loadUserProgress(userId));
    setActiveAttempt(loadActiveAttempt(userId));
  }, [userId]);

  // Live timer for next UTC daily reset
  useEffect(() => {
    const interval = setInterval(() => {
      setResetTimer(getNextDailyResetInfo());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync questions and active attempt index on resumption
  useEffect(() => {
    if (activeAttempt && activeAttempt.questions && activeAttempt.questions.length > 0) {
      const idx = Math.min(
        activeAttempt.currentQuestionIndex || 0,
        activeAttempt.questions.length - 1
      );
      setCurrentQuestionIndex(idx);
    }
  }, [activeAttempt]);

  // Current active question
  const currentQuestion = useMemo(() => {
    if (activeAttempt && activeAttempt.questions && activeAttempt.questions[currentQuestionIndex]) {
      return activeAttempt.questions[currentQuestionIndex];
    }
    return null;
  }, [activeAttempt, currentQuestionIndex]);

  // Current round definition
  const currentRound = useMemo(() => {
    if (!currentQuestion) return INVESTIGATION_ROUNDS[0];
    return (
      INVESTIGATION_ROUNDS.find((r) => r.id === currentQuestion.roundId) ||
      INVESTIGATION_ROUNDS[0]
    );
  }, [currentQuestion]);

  // Calculate score for active attempt
  const currentAttemptScore = useMemo(() => {
    if (!activeAttempt || !activeAttempt.evaluatedAnswers) return 0;
    return activeAttempt.evaluatedAnswers.filter((a) => a.isCorrect).length * 10;
  }, [activeAttempt]);

  // Global total XP (Layer 1): prefer authenticated user profile, fallback to local
  const globalTotalXP = user?.totalXP !== undefined ? user.totalXP : userProgress.totalPoints;
  const globalLevel = user?.currentLevel !== undefined ? user.currentLevel : 1;
  const globalRank = user?.currentRank || 'Bronze Detective';

  /**
   * Starts a brand new campaign investigation playthrough (Layer 3).
   * Generates a varied 9-question set (3 per round) avoiding recently seen questions.
   */
  const handleStartNewCampaign = () => {
    const freshAttempt = createNewAttempt(userId, userProgress);
    setActiveAttempt(freshAttempt);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setShowClues(false);
    setRoundSummaryData(null);
    setLastCampaignSummary(null);
    setViewState('campaign');
  };

  /**
   * Resumes an existing unfinished attempt (Layer 3).
   */
  const handleResumeAttempt = () => {
    if (!activeAttempt) {
      handleStartNewCampaign();
      return;
    }

    if (activeAttempt.pausedAtRoundSummary) {
      setRoundSummaryData(activeAttempt.pausedAtRoundSummary);
      setViewState('round_summary');
      return;
    }

    const idx = Math.min(
      activeAttempt.currentQuestionIndex || 0,
      (activeAttempt.questions?.length || 9) - 1
    );
    setCurrentQuestionIndex(idx);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setShowClues(false);
    setViewState('campaign');
  };

  /**
   * Discards an unfinished attempt and starts a fresh one.
   */
  const handleDiscardAndNew = () => {
    clearActiveAttempt(userId);
    handleStartNewCampaign();
  };

  /**
   * Submits evaluation for the active question.
   */
  const handleSubmitCampaignAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted || !currentQuestion || !activeAttempt) return;

    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    const answerRecord = {
      questionId: currentQuestion.id,
      roundId: currentQuestion.roundId,
      questionNumber: currentQuestionIndex + 1,
      selectedOptionId,
      correctOptionId: currentQuestion.correctOptionId,
      isCorrect,
      explanation: currentQuestion.explanation,
    };

    const updatedAnswers = [...(activeAttempt.evaluatedAnswers || []), answerRecord];
    const updatedAttempt = {
      ...activeAttempt,
      evaluatedAnswers: updatedAnswers,
    };

    setActiveAttempt(updatedAttempt);
    saveActiveAttempt(userId, updatedAttempt);
    setIsAnswerSubmitted(true);
  };

  /**
   * Advances to the next question or triggers round/campaign completion.
   */
  const handleNextCampaignQuestion = async () => {
    if (!activeAttempt || !currentQuestion) return;

    const nextIndex = currentQuestionIndex + 1;
    const isRound1End = nextIndex === 3; // Finished Questions 0, 1, 2
    const isRound2End = nextIndex === 6; // Finished Questions 3, 4, 5
    const isCampaignEnd = nextIndex >= (activeAttempt.questions?.length || 9);

    if (isRound1End) {
      // Complete Round 1 & Show Round 1 Summary Interstitial
      const { newlyUnlockedBadges, updatedProgress, updatedAttempt } = recordRoundCompletion(
        userId,
        activeAttempt,
        'round-1'
      );
      setUserProgress(updatedProgress);

      const r1Answers = updatedAttempt.evaluatedAnswers.filter((a) => a.roundId === 'round-1');
      const r1Correct = r1Answers.filter((a) => a.isCorrect).length;
      const r1Accuracy = calculateAccuracy(r1Correct, r1Answers.length);

      const summaryPayload = {
        roundId: 'round-1',
        roundNumber: 1,
        roundTitle: 'The Phishing Trap',
        nextRoundNumber: 2,
        nextRoundTitle: 'The Fake Identity',
        nextRoundOverview:
          'In Round 2, evaluate social engineering, executive impersonation, and fraudulent colleague identities.',
        score: r1Correct * 10,
        maxScore: 30,
        correctCount: r1Correct,
        evaluatedCount: r1Answers.length,
        accuracy: r1Accuracy,
        newlyUnlockedBadges,
      };

      updatedAttempt.currentQuestionIndex = 3;
      updatedAttempt.currentRoundNumber = 2;
      updatedAttempt.currentRoundId = 'round-2';
      updatedAttempt.pausedAtRoundSummary = summaryPayload;
      setActiveAttempt(updatedAttempt);
      saveActiveAttempt(userId, updatedAttempt);

      // Award Round 1 EXP immediately into Global Profile
      const r1Score = r1Correct * 10;
      if (r1Score > 0 && user && updateUser) {
        updateUser({
          totalXP: (user.totalXP || 0) + r1Score,
        });
      }
      if (r1Score > 0 && user) {
        claimCyberCrimeReward({
          rewardType: 'round',
          attemptId: activeAttempt.attemptId,
          roundId: 'round-1',
          correctCount: r1Correct,
        })
          .then((res) => {
            const serverUser = res?.user || res?.data?.user;
            if (serverUser && updateUser) updateUser(serverUser);
          })
          .catch((err) => console.warn('Round 1 EXP sync fallback:', err?.message || err));
      }

      setRoundSummaryData(summaryPayload);
      setViewState('round_summary');

      if (newlyUnlockedBadges.length > 0 && notify) {
        notify(`Badge Unlocked: ${newlyUnlockedBadges.map((b) => b.name).join(', ')}! (+${r1Score} EXP credited)`);
      }
      return;
    }

    if (isRound2End) {
      // Complete Round 2 & Show Round 2 Summary Interstitial
      const { newlyUnlockedBadges, updatedProgress, updatedAttempt } = recordRoundCompletion(
        userId,
        activeAttempt,
        'round-2'
      );
      setUserProgress(updatedProgress);

      const r2Answers = updatedAttempt.evaluatedAnswers.filter((a) => a.roundId === 'round-2');
      const r2Correct = r2Answers.filter((a) => a.isCorrect).length;
      const r2Accuracy = calculateAccuracy(r2Correct, r2Answers.length);

      const cumulativeCorrect = updatedAttempt.evaluatedAnswers.filter((a) => a.isCorrect).length;

      const summaryPayload = {
        roundId: 'round-2',
        roundNumber: 2,
        roundTitle: 'The Fake Identity',
        nextRoundNumber: 3,
        nextRoundTitle: 'The Suspicious Transaction',
        nextRoundOverview:
          'In Round 3, investigate unauthorized fund transfers, fraudulent banking alerts, and OTP bypass vectors.',
        score: r2Correct * 10,
        maxScore: 30,
        correctCount: r2Correct,
        evaluatedCount: r2Answers.length,
        cumulativeScore: cumulativeCorrect * 10,
        accuracy: r2Accuracy,
        newlyUnlockedBadges,
      };

      updatedAttempt.currentQuestionIndex = 6;
      updatedAttempt.currentRoundNumber = 3;
      updatedAttempt.currentRoundId = 'round-3';
      updatedAttempt.pausedAtRoundSummary = summaryPayload;
      setActiveAttempt(updatedAttempt);
      saveActiveAttempt(userId, updatedAttempt);

      // Award Round 2 EXP immediately into Global Profile
      const r2Score = r2Correct * 10;
      if (r2Score > 0 && user && updateUser) {
        updateUser({
          totalXP: (user.totalXP || 0) + r2Score,
        });
      }
      if (r2Score > 0 && user) {
        claimCyberCrimeReward({
          rewardType: 'round',
          attemptId: activeAttempt.attemptId,
          roundId: 'round-2',
          correctCount: r2Correct,
        })
          .then((res) => {
            const serverUser = res?.user || res?.data?.user;
            if (serverUser && updateUser) updateUser(serverUser);
          })
          .catch((err) => console.warn('Round 2 EXP sync fallback:', err?.message || err));
      }

      setRoundSummaryData(summaryPayload);
      setViewState('round_summary');

      if (newlyUnlockedBadges.length > 0 && notify) {
        notify(`Badge Unlocked: ${newlyUnlockedBadges.map((b) => b.name).join(', ')}! (+${r2Score} EXP credited)`);
      }
      return;
    }

    if (isCampaignEnd) {
      // Record complete campaign results locally (Layer 2)
      const { resultRecord, updatedProgress, newlyUnlockedBadges } = recordCampaignCompletion(
        userId,
        activeAttempt
      );
      setUserProgress(updatedProgress);
      setActiveAttempt(null);
      clearActiveAttempt(userId);

      setLastCampaignSummary({
        ...resultRecord,
        newlyUnlockedBadges,
      });
      setViewState('campaign_results');

      // Award EXP into Layer 1 shared global profile immediately
      const earnedXP = resultRecord.questionScore;
      if (user && updateUser) {
        updateUser({
          totalXP: (user.totalXP || 0) + earnedXP,
        });
      }

      // Synchronize authoritative reward with backend
      if (user) {
        try {
          const rewardResponse = await claimCyberCrimeReward({
            rewardType: 'campaign',
            attemptId: resultRecord.attemptId,
            correctCount: resultRecord.correctCount,
          });

          const serverUser = rewardResponse?.user || rewardResponse?.data?.user;
          if (serverUser && updateUser) {
            updateUser(serverUser);
          }
        } catch (err) {
          console.warn('Backend EXP sync fallback:', err?.message || err);
        }
      }

      if (notify) {
        notify(
          `Case Closed! You scored ${resultRecord.questionScore}/90 pts (+${resultRecord.questionScore} Global EXP credited).`
        );
      }
      return;
    }

    // Advance to next question in same round
    const updatedAttempt = {
      ...activeAttempt,
      currentQuestionIndex: nextIndex,
      pausedAtRoundSummary: null,
    };
    setActiveAttempt(updatedAttempt);
    saveActiveAttempt(userId, updatedAttempt);

    setCurrentQuestionIndex(nextIndex);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setShowClues(false);
  };

  /**
   * Resumes gameplay from Round Summary interstitial into next round.
   */
  const handleContinueFromRoundSummary = () => {
    if (!activeAttempt || !roundSummaryData) {
      setViewState('campaign');
      return;
    }

    const nextIndex = roundSummaryData.roundNumber * 3;
    const updatedAttempt = {
      ...activeAttempt,
      currentQuestionIndex: nextIndex,
      pausedAtRoundSummary: null,
    };

    setActiveAttempt(updatedAttempt);
    saveActiveAttempt(userId, updatedAttempt);

    setCurrentQuestionIndex(nextIndex);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setShowClues(false);
    setRoundSummaryData(null);
    setViewState('campaign');
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
   * If correct: awards configured EXP and updates global profile.
   * If incorrect: displays failure message and awards ZERO EXP.
   */
  const handleSubmitMissionAnswer = async () => {
    if (!missionSelectedOption || isMissionSubmitted || !selectedMission) return;

    const isCorrect = missionSelectedOption === selectedMission.question.correctOptionId;
    setIsMissionSubmitted(true);

    let rewardAwarded = 0;
    let alreadyCompleted = false;

    if (isCorrect) {
      const completionResult = recordMissionCompletion(
        userId,
        selectedMission.id,
        selectedMission.rewardXP,
        todayDateKey
      );
      rewardAwarded = completionResult.rewardAwarded;
      alreadyCompleted = completionResult.alreadyCompleted;
      setUserProgress(completionResult.updatedProgress);

      // Award EXP into Layer 1 shared global profile immediately
      if (rewardAwarded > 0 && user && updateUser) {
        updateUser({
          totalXP: (user.totalXP || 0) + rewardAwarded,
        });
      }

      // Synchronize with backend API authoritatively
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
      alreadyCompleted,
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
            <button onClick={() => go('games')}>Game Center</button>
            <span className="cyber-breadcrumb-separator">/</span>
            <button
              onClick={() => setViewState('hub')}
              style={{ fontWeight: viewState === 'hub' ? 700 : 500 }}
            >
              Cyber Crime Investigation
            </button>
            {viewState === 'campaign' && currentRound && (
              <>
                <span className="cyber-breadcrumb-separator">/</span>
                <span>
                  Round {currentRound.roundNumber}: {currentRound.title}
                </span>
              </>
            )}
            {viewState === 'round_summary' && roundSummaryData && (
              <>
                <span className="cyber-breadcrumb-separator">/</span>
                <span>Round {roundSummaryData.roundNumber} Assessment</span>
              </>
            )}
            {viewState === 'campaign_results' && (
              <>
                <span className="cyber-breadcrumb-separator">/</span>
                <span>Final Performance Report</span>
              </>
            )}
            {viewState === 'mission_play' && selectedMission && (
              <>
                <span className="cyber-breadcrumb-separator">/</span>
                <span>Daily Mission: {selectedMission.title}</span>
              </>
            )}
          </div>

          {/* Top Hero Banner: Displays Shared Global Profile (Layer 1) & Cyber Stats */}
          <div className="cyber-hero-banner">
            <div className="cyber-hero-title-group">
              <div className="cyber-hero-icon">
                <Fingerprint size={32} />
              </div>
              <div className="cyber-hero-text">
                <h1>{GAME_TITLE}</h1>
                <p>{GAME_SUBTITLE}</p>
              </div>
            </div>

            <div className="cyber-hero-stats">
              {/* Shared Global Profile Balance (Layer 1) */}
              <div className="cyber-stat-pill points" title="Shared Global Profile EXP from all games">
                <Trophy size={16} />
                <span>{globalTotalXP} Global EXP</span>
              </div>
              <div className="cyber-stat-pill" title="Global Profile Level">
                <Award size={16} />
                <span>Level {globalLevel} • {globalRank}</span>
              </div>
              <div
                className="cyber-stat-pill"
                style={{ cursor: 'pointer' }}
                onClick={() => go('profile')}
                title="View Full Game Analysis in Profile"
              >
                <BarChart3 size={16} />
                <span>Profile Analytics ↗</span>
              </div>
            </div>
          </div>

          {/* VIEW: HUB / DASHBOARD */}
          {viewState === 'hub' && (
            <div>
              {/* Ongoing Attempt Resumption Banner (Layer 3) */}
              {activeAttempt && !activeAttempt.isComplete && (
                <div className="cyber-resume-banner">
                  <div className="cyber-resume-content">
                    <div className="cyber-resume-icon">
                      <Play size={22} />
                    </div>
                    <div className="cyber-resume-details">
                      <h4>Active Case in Progress</h4>
                      <p>
                        Round {activeAttempt.currentRoundNumber || 1}:{' '}
                        {activeAttempt.currentRoundId === 'round-1'
                          ? 'The Phishing Trap'
                          : activeAttempt.currentRoundId === 'round-2'
                          ? 'The Fake Identity'
                          : 'The Suspicious Transaction'}{' '}
                        • Question {(activeAttempt.currentQuestionIndex || 0) + 1} of 9 • Current
                        Score: {currentAttemptScore} pts
                      </p>
                    </div>
                  </div>
                  <div className="cyber-resume-actions">
                    <Button variant="primary" onClick={handleResumeAttempt}>
                      <Play size={16} /> Resume Investigation
                    </Button>
                    <Button variant="secondary" onClick={handleDiscardAndNew}>
                      Discard & Start Fresh
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Tabs (Campaign & Daily Missions) */}
              <div className="cyber-nav-tabs">
                <button
                  className={`cyber-tab-btn ${activeTab === 'campaign' ? 'active' : ''}`}
                  onClick={() => setActiveTab('campaign')}
                >
                  <ShieldCheck size={18} />
                  Investigation Campaign (3 Rounds)
                </button>
                <button
                  className={`cyber-tab-btn ${activeTab === 'missions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('missions')}
                >
                  <Calendar size={18} />
                  Daily Missions
                </button>
              </div>

              {/* TAB 1: CAMPAIGN */}
              {activeTab === 'campaign' && (
                <div className="cyber-welcome-card">
                  <div className="cyber-welcome-header">
                    <div>
                      <h2>Investigate Digital Crime Scenarios</h2>
                      <p>
                        Analyze real forensic evidence, identify deceptive social engineering, and
                        protect corporate infrastructure through 3 consecutive investigation rounds.
                        Each playthrough dynamically draws fresh challenges from a comprehensive 90+
                        scenario library.
                      </p>
                    </div>
                    <Button
                      onClick={activeAttempt ? handleResumeAttempt : handleStartNewCampaign}
                      variant="primary"
                    >
                      <Gamepad2 size={18} />{' '}
                      {activeAttempt ? 'Resume Active Case' : 'Start Investigation'}
                    </Button>
                  </div>

                  <div className="cyber-rounds-preview-grid">
                    {INVESTIGATION_ROUNDS.map((round) => (
                      <div key={round.id} className="cyber-round-preview-card">
                        <div className="cyber-round-preview-header">
                          <span className="cyber-round-badge">Round {round.roundNumber}</span>
                          {round.id === 'round-1' && <Mail size={18} color="var(--purple)" />}
                          {round.id === 'round-2' && <UserCheck size={18} color="var(--blue)" />}
                          {round.id === 'round-3' && <CreditCard size={18} color="var(--cyan)" />}
                        </div>
                        <h3>{round.title}</h3>
                        <p>{round.overview}</p>
                      </div>
                    ))}
                  </div>

                  {userProgress.lastCampaignResult && (
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        background: 'var(--surface2, #f8fafc)',
                        border: '1px solid var(--line, #e2e8f0)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Trophy size={20} color="var(--cyan)" />
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text)' }}>
                            Last Completed Investigation
                          </strong>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                            Score: {userProgress.lastCampaignResult.questionScore}/90 pts • Accuracy:{' '}
                            {userProgress.lastCampaignResult.accuracy}% (
                            {userProgress.lastCampaignResult.correctCount}/
                            {userProgress.lastCampaignResult.evaluatedCount} correct)
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setLastCampaignSummary(userProgress.lastCampaignResult);
                            setViewState('campaign_results');
                          }}
                        >
                          View Results Report
                        </Button>
                        <Button variant="secondary" onClick={() => go('profile')}>
                          <BarChart3 size={16} /> Profile Analytics
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DAILY MISSIONS */}
              {activeTab === 'missions' && (
                <div className="cyber-missions-section">
                  <div className="cyber-missions-header">
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>
                        Today's Cyber Defense Missions
                      </h2>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                        Targeted mini-investigations refreshing daily at 00:00 UTC. Earn bonus EXP
                        that contributes directly to your shared Global Profile.
                      </p>
                    </div>
                    <div className="cyber-reset-timer">
                      <Clock size={16} />
                      <span>Next Reset: in {resetTimer.formatted} (00:00 UTC)</span>
                    </div>
                  </div>

                  <div className="cyber-missions-grid">
                    {dailyMissions.map((mission) => {
                      const isCompleted = isMissionCompletedToday(userId, mission.id, todayDateKey);
                      return (
                        <div
                          key={mission.id}
                          className={`cyber-mission-card ${isCompleted ? 'completed' : ''}`}
                        >
                          <div>
                            <div className="cyber-mission-top">
                              <span className={`cyber-difficulty-badge ${mission.difficulty}`}>
                                {mission.difficulty}
                              </span>
                              <span className="cyber-mission-reward">
                                <Sparkles size={14} /> +{mission.rewardXP} Global EXP
                              </span>
                            </div>

                            <h3 className="cyber-mission-title" style={{ marginTop: '12px' }}>
                              {mission.title}
                            </h3>
                            <p className="cyber-mission-desc">{mission.description}</p>

                            <div style={{ margin: '14px 0 0' }}>
                              <strong
                                style={{
                                  fontSize: '11px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  color: 'var(--muted)',
                                  display: 'block',
                                  marginBottom: '6px',
                                }}
                              >
                                Mission Objectives
                              </strong>
                              <ul className="cyber-mission-objectives">
                                {mission.objectives.map((obj, i) => (
                                  <li key={i}>
                                    <CheckCircle2 size={13} /> {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div style={{ paddingTop: '10px' }}>
                            {isCompleted ? (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '10px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: 'var(--green, #059669)',
                                  }}
                                >
                                  <CheckCircle2 size={16} /> Mission Completed Today (+{mission.rewardXP} EXP)
                                </span>
                                <Button
                                  variant="secondary"
                                  onClick={() => handleStartMission(mission)}
                                >
                                  Review Scenario
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                onClick={() => handleStartMission(mission)}
                                style={{ width: '100%' }}
                              >
                                Investigate Mission <ArrowRight size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: PLAYING ACTIVE CAMPAIGN (Layer 3) */}
          {viewState === 'campaign' && currentQuestion && (
            <div>
              {/* Question Progress Header */}
              <div className="cyber-question-tracker-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="cyber-round-badge">
                    Round {currentRound.roundNumber}: {currentRound.title}
                  </span>
                  <div className="cyber-dots-container">
                    {(activeAttempt?.questions || []).map((_, i) => (
                      <span
                        key={i}
                        className={`cyber-step-dot ${
                          i === currentQuestionIndex
                            ? 'active'
                            : i < (activeAttempt?.evaluatedAnswers?.length || 0)
                            ? 'completed'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Question {currentQuestionIndex + 1} of{' '}
                    {activeAttempt?.questions?.length || 9}
                  </span>
                  <span className="cyber-question-score-pill">
                    Score: {currentAttemptScore} /{' '}
                    {(activeAttempt?.questions?.length || 9) * 10} pts
                  </span>
                </div>
              </div>

              {/* Dynamic Investigation Grid */}
              <div className="cyber-play-grid">
                {/* Left: Forensic Evidence Dossier */}
                <div className="cyber-evidence-card">
                  <div className="cyber-evidence-header">
                    <h3>
                      <Fingerprint size={20} color="var(--purple)" /> Case Evidence Dossier
                    </h3>
                    <span className="cyber-round-badge">{currentQuestion.topic || currentRound.category}</span>
                  </div>

                  {/* High-tech Evidence Scenario Box */}
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
                      Incident Description & Intercepted Communication:
                    </strong>
                    {currentQuestion.scenario}
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
                          <div>
                            <strong>Forensic Guidance:</strong> Look closely at urgency indicators,
                            unusual sender addresses, unsolicited financial transfers, or requests
                            that bypass standard verification protocols.
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
                      Question {currentQuestionIndex + 1} of{' '}
                      {activeAttempt?.questions?.length || 9}
                    </span>
                    <span className="cyber-question-score-pill">+10 Global EXP</span>
                  </div>

                  <h3 className="cyber-question-prompt">{currentQuestion.question}</h3>

                  {/* 4 Shuffled Options with Preserved Correct Mapping */}
                  <div className="cyber-options-list">
                    {currentQuestion.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      const isCorrect = isAnswerSubmitted && option.id === currentQuestion.correctOptionId;
                      const isIncorrect = isAnswerSubmitted && isSelected && !isCorrect;

                      let stateClass = '';
                      if (isCorrect) stateClass = 'correct';
                      else if (isIncorrect) stateClass = 'incorrect';
                      else if (isSelected) stateClass = 'selected';

                      return (
                        <button
                          key={option.id}
                          className={`cyber-option-btn ${stateClass}`}
                          disabled={isAnswerSubmitted}
                          onClick={() => setSelectedOptionId(option.id)}
                        >
                          <span className="cyber-option-letter">{option.id.toUpperCase()}</span>
                          <span>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Button: Submit or Proceed */}
                  {!isAnswerSubmitted ? (
                    <Button
                      variant="primary"
                      disabled={!selectedOptionId}
                      onClick={handleSubmitCampaignAnswer}
                    >
                      Submit Evaluation <CheckCircle2 size={16} />
                    </Button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div
                        className={`cyber-feedback-box ${
                          selectedOptionId === currentQuestion.correctOptionId
                            ? 'correct'
                            : 'incorrect'
                        }`}
                      >
                        <div className="cyber-feedback-title">
                          {selectedOptionId === currentQuestion.correctOptionId ? (
                            <>
                              <CheckCircle2 size={18} /> Good observation! (+10 Points)
                            </>
                          ) : (
                            <>
                              <HelpCircle size={18} /> Good try! Here's what to look for: (0 Points)
                            </>
                          )}
                        </div>
                        <p className="cyber-feedback-text">{currentQuestion.explanation}</p>
                      </div>

                      <Button variant="primary" onClick={handleNextCampaignQuestion}>
                        {currentQuestionIndex === 2 ? (
                          <>
                            Complete Round 1 & View Assessment <ArrowRight size={16} />
                          </>
                        ) : currentQuestionIndex === 5 ? (
                          <>
                            Complete Round 2 & View Assessment <ArrowRight size={16} />
                          </>
                        ) : currentQuestionIndex + 1 < (activeAttempt?.questions?.length || 9) ? (
                          <>
                            Next Question <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            Finish Investigation & View Final Report <Trophy size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ROUND SUMMARY INTERSTITIAL (Layer 3 Progression) */}
          {viewState === 'round_summary' && roundSummaryData && (
            <div className="cyber-round-summary-container">
              <div className="cyber-round-summary-icon">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="cyber-round-summary-title">
                Round {roundSummaryData.roundNumber}: {roundSummaryData.roundTitle} Complete!
              </h2>
              <p className="cyber-round-summary-desc">{roundSummaryData.nextRoundOverview}</p>

              <div className="cyber-round-stat-row">
                <div className="cyber-round-stat-box">
                  <span>Round Accuracy</span>
                  <strong style={{ color: 'var(--cyan)' }}>
                    {roundSummaryData.accuracy !== null ? `${roundSummaryData.accuracy}%` : '—'}
                  </strong>
                </div>
                <div className="cyber-round-stat-box">
                  <span>Round Score</span>
                  <strong style={{ color: 'var(--purple)' }}>
                    {roundSummaryData.score} / {roundSummaryData.maxScore}
                  </strong>
                </div>
                <div className="cyber-round-stat-box">
                  <span>Correct Clues</span>
                  <strong>
                    {roundSummaryData.correctCount} / {roundSummaryData.evaluatedCount}
                  </strong>
                </div>
              </div>

              {roundSummaryData.newlyUnlockedBadges &&
                roundSummaryData.newlyUnlockedBadges.length > 0 && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: 'rgba(124, 58, 237, 0.08)',
                      border: '1px solid rgba(124, 58, 237, 0.25)',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                    }}
                  >
                    <Medal size={22} color="var(--purple)" />
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--purple)' }}>
                        New Badges Unlocked!
                      </strong>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                        {roundSummaryData.newlyUnlockedBadges.map((b) => b.name).join(', ')}
                      </div>
                    </div>
                  </div>
                )}

              <Button
                variant="primary"
                onClick={handleContinueFromRoundSummary}
                style={{ width: '100%', padding: '14px' }}
              >
                Continue to Round {roundSummaryData.nextRoundNumber}:{' '}
                {roundSummaryData.nextRoundTitle} <ArrowRight size={18} />
              </Button>
            </div>
          )}

          {/* VIEW: FINAL CAMPAIGN RESULTS SCREEN */}
          {viewState === 'campaign_results' && lastCampaignSummary && (
            <div className="cyber-results-container">
              {(() => {
                const tierInfo = getPerformanceTier(lastCampaignSummary.accuracy);
                return (
                  <div>
                    <div className="cyber-results-header">
                      <div className="cyber-results-trophy">
                        <Trophy size={36} />
                      </div>
                      <span className={`cyber-results-tier-badge ${tierInfo.color}`}>
                        <Award size={16} /> {tierInfo.tier}
                      </span>
                      <h2>Investigation Final Report</h2>
                      <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
                        {tierInfo.message}
                      </p>
                    </div>

                    <div className="cyber-results-grid">
                      <div className="cyber-result-stat-card">
                        <span>Accuracy Rate</span>
                        <strong style={{ color: 'var(--cyan)' }}>
                          {lastCampaignSummary.accuracy !== null
                            ? `${lastCampaignSummary.accuracy}%`
                            : '—'}
                        </strong>
                      </div>
                      <div className="cyber-result-stat-card">
                        <span>Campaign Score</span>
                        <strong style={{ color: 'var(--purple)' }}>
                          {lastCampaignSummary.questionScore} / 90
                        </strong>
                      </div>
                      <div className="cyber-result-stat-card">
                        <span>Questions Evaluated</span>
                        <strong>
                          {lastCampaignSummary.correctCount} /{' '}
                          {lastCampaignSummary.evaluatedCount} Correct
                        </strong>
                      </div>
                    </div>

                    {/* Shared Global Profile Reward Banner (Layer 1) */}
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        marginBottom: '20px',
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
                            Shared Global Profile Updated!
                          </strong>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                            Awarded +{lastCampaignSummary.questionScore} EXP directly to your DeepTrust
                            Academy Global Profile (Current Balance: {globalTotalXP} Global EXP).
                          </p>
                        </div>
                      </div>
                      <span className="cyber-round-badge" style={{ background: 'var(--purple)', color: '#fff' }}>
                        Level {globalLevel} • {globalRank}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="cyber-results-actions">
                      <Button variant="primary" onClick={handleStartNewCampaign}>
                        <RotateCcw size={16} /> Play Again (New Scenarios)
                      </Button>
                      <Button variant="secondary" onClick={() => go('profile')}>
                        <BarChart3 size={16} /> View Profile Analytics & Badges
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setActiveTab('missions');
                          setViewState('hub');
                        }}
                      >
                        <Calendar size={16} /> Explore Daily Missions
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

          {/* VIEW: DAILY MISSION PLAY / REVIEW */}
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

                {/* Complete Scenario & Forensic Evidence Box (FIXED) */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--cyan, #0284c7)',
                        letterSpacing: '0.5px',
                        fontWeight: 800,
                      }}
                    >
                      Case Scenario & Incident Evidence:
                    </strong>
                    {selectedMission.taskScenario?.sender && (
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                        Source: {selectedMission.taskScenario.sender}
                      </span>
                    )}
                  </div>

                  {selectedMission.taskScenario?.headline && (
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>
                      {selectedMission.taskScenario.headline}
                    </div>
                  )}

                  <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    {selectedMission.taskScenario?.body || selectedMission.scenario || selectedMission.description}
                  </div>

                  {selectedMission.taskScenario?.link && (
                    <div
                      style={{
                        fontSize: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: 'var(--danger, #ef4444)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={14} /> Forensic Flag: {selectedMission.taskScenario.link}
                    </div>
                  )}
                </div>

                {/* Mission Objectives */}
                {selectedMission.objectives && selectedMission.objectives.length > 0 && (
                  <div style={{ marginBottom: '18px' }}>
                    <strong
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'var(--muted)',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Mission Objectives:
                    </strong>
                    <ul className="cyber-mission-objectives">
                      {selectedMission.objectives.map((obj, i) => (
                        <li key={i}>
                          <CheckCircle2 size={13} /> {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Question Prompt */}
                <h3 className="cyber-question-prompt" style={{ fontSize: '16px', margin: '14px 0 12px' }}>
                  {selectedMission.question?.prompt || selectedMission.question?.question}
                </h3>

                {/* Answer Options */}
                <div className="cyber-options-list">
                  {(selectedMission.question?.options || []).map((opt) => {
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

                {/* Evaluation Action / Immediate Result Feedback */}
                {!isMissionSubmitted ? (
                  <Button
                    variant="primary"
                    disabled={!missionSelectedOption}
                    onClick={handleSubmitMissionAnswer}
                  >
                    Submit Mission Evaluation <CheckCircle2 size={16} />
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
                            <CheckCircle2 size={20} /> Mission Successful!{' '}
                            {missionResultData.alreadyCompleted
                              ? '(Previously Claimed Today)'
                              : `(+${missionResultData.rewardAwarded} Global EXP Credited to Profile!)`}
                          </>
                        ) : (
                          <>
                            <XCircle size={20} /> Mission Unsuccessful! No EXP awarded.
                          </>
                        )}
                      </div>
                      <p className="cyber-feedback-text">
                        {missionResultData?.explanation ||
                          'Incorrect observation. Review the scenario clues and try again.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {!missionResultData?.isCorrect && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setIsMissionSubmitted(false);
                            setMissionSelectedOption(null);
                            setMissionResultData(null);
                          }}
                        >
                          <RotateCcw size={16} /> Try Again
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        onClick={() => {
                          setActiveTab('missions');
                          setViewState('hub');
                        }}
                      >
                        Return to Daily Missions <Calendar size={16} />
                      </Button>
                    </div>
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
