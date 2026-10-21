import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher({ className = '' }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div
      className={`theme-switcher ${className}`}
      role="radiogroup"
      aria-label="Theme selection"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        borderRadius: '12px',
        background: 'var(--surface2)',
        border: '1px solid var(--line)',
        gap: '2px',
      }}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} theme`}
            title={`${label} mode`}
            onClick={() => setTheme(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              border: 'none',
              background: isActive ? 'var(--surface)' : 'transparent',
              color: isActive ? 'var(--cyan)' : 'var(--muted)',
              boxShadow: isActive ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

export default ThemeSwitcher;
