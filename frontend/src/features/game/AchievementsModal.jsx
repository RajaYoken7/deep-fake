import { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  ScanSearch,
  Eye,
  ShieldCheck,
  Zap,
  BrainCircuit,
  Flame,
  Crown,
} from 'lucide-react';
import { getAchievements } from './services/gameApi';

const ICON_MAP = {
  ScanSearch,
  Eye,
  ShieldCheck,
  Zap,
  BrainCircuit,
  Award,
  Flame,
  Crown,
};

export function AchievementsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function loadAchievements() {
      try {
        setLoading(true);
        const data = await getAchievements();
        if (active) {
          setAchievements(data.achievements || []);
          setTotalUnlocked(data.totalUnlocked || 0);
        }
      } catch (err) {
        console.error('Failed to load achievements:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAchievements();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #000000',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: 'none',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#000000',
            padding: '4px',
          }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: '#000000', border: '1px solid #000000',
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Academy Achievements</h2>
            <p style={{ margin: '4px 0 0', color: '#000000', fontSize: '13px' }}>
              Unlocked {totalUnlocked} of {achievements.length} forensic badges
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '8px',
            background: '#ffffff', border: '1px solid #000000',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${achievements.length > 0 ? (totalUnlocked / achievements.length) * 100 : 0}%`,
              background: '#000000',
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#000000' }}>
            Loading achievements...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {achievements.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || Award;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: '#000000',
                    background: item.isUnlocked ? '#000000' : '#ffffff',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    opacity: item.isUnlocked ? 1 : 0.65,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#ffffff', color: '#000000', border: '1px solid #000000',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.isUnlocked ? <IconComponent size={22} /> : <Lock size={20} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: 800,
                          color: item.isUnlocked ? '#ffffff' : '#000000',
                        }}
                      >
                        {item.name}
                      </h4>
                      {item.isUnlocked && (
                        <CheckCircle2 size={16} stroke={item.isUnlocked ? "#ffffff" : "#000000"} style={{ flexShrink: 0 }} />
                      )}
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '12px',
                        color: '#000000',
                        lineHeight: '1.4',
                      }}
                    >
                      {item.description}
                    </p>
                    {item.isUnlocked && item.unlockedAt && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          fontSize: '10px',
                          color: '#000000',
                          fontWeight: 600,
                        }}
                      >
                        Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AchievementsModal;
