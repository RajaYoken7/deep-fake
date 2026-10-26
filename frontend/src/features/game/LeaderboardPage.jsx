import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Button, GlassCard } from '../../components/UI';
import { BackButton, PublicNav } from '../../pages/Modules';
import { getLeaderboard } from './services/gameApi';
import './game.css';

export function LeaderboardPage({ go, back }) {
  const [filter, setFilter] = useState('all_time'); // 'all_time' | 'monthly' | 'weekly'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ leaderboard: [], currentUserRanking: null });

  useEffect(() => {
    let active = true;
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const result = await getLeaderboard(filter, 100);
        if (active) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      active = false;
    };
  }, [filter]);

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
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '12px',
                fontWeight: 800,
                marginBottom: '12px',
              }}
            >
              <Trophy size={16} /> GLOBAL FORENSIC RANKINGS
            </div>
            <h1>GLOBAL DETECTIVE LEADERBOARD</h1>
            <p>
              Compete with detectives around the world and prove your ability to identify AI-generated
              images.
            </p>
          </div>

          {/* Time Filter Tabs */}
          <div className="filter-tabs">
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
                        background: '#64748b',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        fontSize: '12px',
                        fontWeight: 900,
                        display: 'grid',
                        placeItems: 'center',
                        border: '2px solid #fff',
                      }}
                    >
                      2
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: 'var(--foreground, #0f172a)' }}>
                    {topThree[0].name}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted, #64748b)' }}>
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
                        background: '#ca8a04',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        fontSize: '14px',
                        fontWeight: 900,
                        display: 'grid',
                        placeItems: 'center',
                        border: '2px solid #fff',
                      }}
                    >
                      1
                    </span>
                  </div>
                  <strong style={{ fontSize: '16px', color: 'var(--foreground, #0f172a)' }}>
                    {topThree[1].name}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 800 }}>
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
                        background: '#b45309',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        fontSize: '12px',
                        fontWeight: 900,
                        display: 'grid',
                        placeItems: 'center',
                        border: '2px solid #fff',
                      }}
                    >
                      3
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: 'var(--foreground, #0f172a)' }}>
                    {topThree[2].name}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted, #64748b)' }}>
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
                color="var(--muted, #64748b)"
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
                  border: '1px solid var(--line, #e2e8f0)',
                  background: 'var(--card-bg, #ffffff)',
                  color: 'inherit',
                  fontSize: '13px',
                }}
              />
            </div>

            <Button onClick={() => go('deepfake-detective')}>
              <Gamepad2 size={16} /> Play Deepfake Detective
            </Button>
          </div>

          {/* Table Container */}
          <div className="leaderboard-table-wrap">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted, #64748b)' }}>
                Loading global detective rankings...
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted, #64748b)' }}>
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
                    {filteredPlayers.map((player) => (
                      <tr
                        key={player.userId}
                        className={`leaderboard-row ${player.isCurrentUser ? 'current-user-row' : ''}`}
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
                                {player.isCurrentUser && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: '#0284c7',
                                      color: '#ffffff',
                                      fontWeight: 800,
                                    }}
                                  >
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--muted, #64748b)' }}>
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
                              background: '#f1f5f9',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            Lvl {player.level}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--cyan, #0284c7)' }}>
                          {player.xp.toLocaleString()} XP
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span
                            style={{
                              color: player.accuracy >= 70 ? '#16a34a' : player.accuracy >= 50 ? '#d97706' : '#64748b',
                            }}
                          >
                            {player.accuracy}%
                          </span>
                        </td>

                        <td style={{ textAlign: 'right', color: 'var(--muted, #64748b)', fontWeight: 600 }}>
                          {player.gamesPlayed}
                        </td>
                      </tr>
                    ))}
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
