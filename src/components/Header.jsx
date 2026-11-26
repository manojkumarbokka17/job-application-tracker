import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Header() {
  const [theme, setTheme] = useLocalStorage('jat.theme', 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink to="/" className="logo">
          <span aria-hidden="true">📋</span> Job Tracker
        </NavLink>
        <nav aria-label="Main">
          <NavLink to="/" end className="nav-link">Board</NavLink>
          <NavLink to="/stats" className="nav-link">Stats</NavLink>
        </nav>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
