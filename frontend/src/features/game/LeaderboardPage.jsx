import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Medal,
  Search,
  ArrowLeft,
  Gamepad2,
  Sparkles,
  Flame,
  UserCheck,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button, GlassCard } from '../../components/UI';
import { BackButton, PublicNav } from '../../pages/Modules';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaderboard } from './services/gameApi';
import './game.css';

export function LeaderboardPage({ go, back }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all_time'); // 'all_time' | 'monthly' | 'weekly'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ leaderboard: [], currentUserRanking: null });

  const fetchLeaderboard = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      const result = await getLeaderboard(filter, 100);
      if (result) {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Current user's standing card information
  const userRankInfo = useMemo(() => {
    if (data.currentUserRanking) return data.currentUserRanking;
    if (!user) return null;
    const found = (data.leaderboard || []).find(
      (p) =>
        p.isCurrentUser ||
        p.userId === user.id ||
        p.userId === user._id ||
        p.name === user.name
    );
    if (found) return found;
    return {
      rank: '--',
      name: user.name,
      username: user.username || user.email?.split('@')[0],
      profilePicture: user.profilePicture || '',
      currentRank: user.currentRank || 'Bronze Detective',
      level: user.currentLevel || 1,
      xp: filter === 'all_time' ? (user.totalXP || 0) : 0,
      accuracy: 0,
      gamesPlayed: user.gamesPlayed || 0,
      isCurrentUser: true,
    };
  }, [data.currentUserRanking, data.leaderboard, user, filter]);

  // Client-side search filtering
  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return data.leaderboard;
    const term = search.toLowerCase();
    return data.leaderboard.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.username?.toLowerCase().includes(term) ||
        p.currentRank?.toLowerCase().includes(term)
    );
  }, [data.leaderboard, search]);

  const topThree = useMemo(() => {
    return [
      data.leaderboard[1] || null, // 2nd place
      data.leaderboard[0] || null, // 1st place
      data.leaderboard[2] || null, // 3rd place
    ];
  }, [data.leaderboard]);

  return (
    <div className="modules-page module-detail">
      <PublicNav go={go} />
      <main>
        <BackButton back={back} />

        <div className="game-shell">
          <div className="game-breadcrumb">
            <button onClick={() => go('modules')}>DeepTrust Academy</button>
            <span className="game-breadcrumb-divider">/</span>
            <button onClick={() => go('games')}>Game Center</button>
            <span className="game-breadcrumb-divider">/</span>
            <span>Leaderboard</span>
          </div>

          <div className="leaderboard-title-block">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: '#000000', color: '#ffffff', border: '1px solid #000000',
                fontSize: '12px',
                fontWeight: 800,
                marginBottom: '12px',
              }}
            >
              <Trophy size={16} /> GLOBAL FORENSIC RANKINGS
            </div>
            <h1>GLOBAL FORENSIC LEADERBOARD</h1>
            <p>
              Compete with investigators across DeepTrust Academy. Earn EXP in Cyber Crime Investigation
              and Deepfake Detective to rise through the global ranks.
            </p>
          </div>

          {/* Time Filter Tabs & Refresh Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div className="filter-tabs" style={{ margin: 0 }}>
              <button
                className={`filter-tab-btn ${filter === 'all_time' ? 'active' : ''}`}
                onClick={() => setFilter('all_time')}
              >
                All Time
              </button>
              <button
                className={`filter-tab-btn ${filter === 'monthly' ? 'active' : ''}`}
                onClick={() => setFilter('monthly')}
              >
                Monthly
              </button>
              <button
                className={`filter-tab-btn ${filter === 'weekly' ? 'active' : ''}`}
                onClick={() => setFilter('weekly')}
              >
                Weekly
              </button>
            </div>

            <button
              onClick={() => fetchLeaderboard(true)}
              disabled={loading || refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1.5px solid #000000',
                background: '#ffffff',
                color: '#000000',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Updating Rankings...' : 'Refresh Leaderboard'}
            </button>
          </div>

          {/* Current User Standings Card */}
          {user && userRankInfo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '16px 22px',
                borderRadius: '16px',
                border: '2px solid #000000',
                background: '#ffffff',
                color: '#000000',
                marginBottom: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: '#000000',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '18px',
                    fontWeight: 900,
                  }}
                >
                  {userRankInfo.profilePicture ? (
                    <img
                      src={userRankInfo.profilePicture}
                      alt=""
                      style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                    />
                  ) : (
                    userRankInfo.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '16px', color: '#000000' }}>{userRankInfo.name}</strong>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        background: '#000000',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      YOU
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#666666', fontWeight: 600 }}>
                    Lvl {userRankInfo.level} · {userRankInfo.currentRank}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
                    {filter === 'all_time' ? 'All-Time Rank' : filter === 'monthly' ? 'Monthly Rank' : 'Weekly Rank'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                    {userRankInfo.rank === 1 ? '🥇 #1' : userRankInfo.rank === 2 ? '🥈 #2' : userRankInfo.rank === 3 ? '🥉 #3' : userRankInfo.rank ? `#${userRankInfo.rank}` : '--'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
                    EXP Balance
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                    {(userRankInfo.xp ?? 0).toLocaleString()} EXP
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700, textTransform: 'uppercase' }}>
                    Accuracy
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                    {userRankInfo.accuracy ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Podium (when all_time has at least 1 player) */}
          {!loading && data.leaderboard.length >= 1 && (
            <div className="podium-container">
              {/* 2nd Place */}
              {topThree[0] ? (
                <div className="podium-slot">
                  <div className="podium-avatar second">
                    {topThree[0].profilePicture ? (
                      <img
                        src={topThree[0].profilePicture}
                        alt=""
                        style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }}
                      />
                    ) : (
                      topThree[0].name?.charAt(0).toUpperCase() || '2'
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        background: '#ffffff', color: '#000000', border: '1px solid #000000',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        fontSize: '12px',
                        fontWeight: 900,
                        display: 'grid',
                        placeItems: 'center',
                        border: '2px solid #000000',
                      }}
                    >
                      2
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#000000' }}>
                    {topThree[0].name}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#000000' }}>
                    {topThree[0].xp.toLocaleString()} XP
                  </span>
                  <div className="podium-block second" style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800 }}>SILVER DETECTIVE</span>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{topThree[0].accuracy}% Acc</span>
                  </div>
                </div>
              ) : (
                <div className="podium-slot" />
              )}

              {/* 1st Place */}
              {topThree[1] && (
                <div className="podium-slot">
                  <div className="podium-avatar first">
                    <span
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        fontSize: '26px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                      }}
                    >
                      👑
                    </span>
                    {topThree[1].profilePicture ? (
                      <img
                        src={topThree[1].profilePicture}
                        alt=""
                        style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }}
                      />
                    ) : (
                      topThree[1].name?.charAt(0).toUpperCase() || '1'
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        background: '#000000', color: '#ffffff', border: '1px solid #ffffff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        fontSize: '14px',
                        fontWeight: 900,
                        display: 'grid',
                        placeItems: 'center',
                        border: '2px solid #000000',
                      }}
                    >
                      1
                    </span>
                  </div>
                  <strong style={{ fontSize: '16px', color: '#000000' }}>
                    {topThree[1].name}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#000000', fontWeight: 800 }}>
                    {topThree[1].xp.toLocaleString()} XP
                  </span>
                  <div className="podium-block first" style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900 }}>LEADER</span>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{topThree[1].accuracy}% Acc</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] ? (
                <div className="podium-slot">
                  <div className="podium-avatar third">
                    {topThree[2].profilePicture ? (
                      <img
                        src={topThree[2].profilePicture}
                        alt=""
                        style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }}
                      />
                    ) : (
                      topThree[2].name?.charAt(0).toUpperCase() || '3'
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        background: '#ffffff', color: '#000000', border: '1px solid #000000',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        fontSize: '12px',
                        fontWeight: 900,
                        display: 'grid',
                        placeItems: 'center',
                        border: '2px solid #000000',
                      }}
                    >
                      3
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#000000' }}>
                    {topThree[2].name}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#000000' }}>
                    {topThree[2].xp.toLocaleString()} XP
                  </span>
                  <div className="podium-block third" style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800 }}>BRONZE DETECTIVE</span>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{topThree[2].accuracy}% Acc</span>
                  </div>
                </div>
              ) : (
                <div className="podium-slot" />
              )}
            </div>
          )}

          {/* Search Bar & Play Button Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '1',
                maxWidth: '360px',
              }}
            >
              <Search
                size={18}
                color="#000000"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search detectives..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: '12px',
                  border: '1px solid #000000',
                  background: '#ffffff',
                  color: 'inherit',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button onClick={() => go('cyber-crime-investigation')}>
                <ShieldCheck size={16} /> Play Cyber Crime
              </Button>
              <Button onClick={() => go('deepfake-detective')}>
                <Gamepad2 size={16} /> Play Deepfake Detective
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="leaderboard-table-wrap">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#000000' }}>
                Loading global detective rankings...
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#000000' }}>
                No detectives found for this period. Be the first to earn XP!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Player</th>
                      <th>Level</th>
                      <th style={{ textAlign: 'right' }}>Total XP</th>
                      <th style={{ textAlign: 'right' }}>Accuracy</th>
                      <th style={{ textAlign: 'right' }}>Games Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => {
                      const isCurrent =
                        player.isCurrentUser ||
                        Boolean(user && (player.userId === user.id || player.userId === user._id || player.name === user.name));
                      return (
                      <tr
                        key={player.userId}
                        className={`leaderboard-row ${isCurrent ? 'current-user-row' : ''}`}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {player.rank === 1 ? (
                            <span style={{ fontSize: '16px' }}>🥇</span>
                          ) : player.rank === 2 ? (
                            <span style={{ fontSize: '16px' }}>🥈</span>
                          ) : player.rank === 3 ? (
                            <span style={{ fontSize: '16px' }}>🥉</span>
                          ) : (
                            `#${player.rank}`
                          )}
                        </td>

                        <td>
                          <div className="player-avatar-cell">
                            <div className="player-small-avatar">
                              {player.profilePicture ? (
                                <img
                                  src={player.profilePicture}
                                  alt=""
                                  style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }}
                                />
                              ) : (
                                player.name?.charAt(0).toUpperCase() || 'D'
                              )}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700 }}>{player.name}</span>
                                {isCurrent && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: '#000000', color: '#ffffff', border: '1px solid #000000',
                                      fontWeight: 800,
                                    }}
                                  >
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: '#000000' }}>
                                {player.currentRank}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            Lvl {player.level}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#000000' }}>
                          {player.xp.toLocaleString()} XP
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span
                            style={{
                              color: '#000000',
                            }}
                          >
                            {player.accuracy}%
                          </span>
                        </td>

                        <td style={{ textAlign: 'right', color: '#000000', fontWeight: 600 }}>
                          {player.gamesPlayed}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default LeaderboardPage;
