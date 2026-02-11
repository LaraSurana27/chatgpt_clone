import { useTheme } from '../contexts/ThemeContext';
import styles from '../pages/Auth.module.css'; // Reusing auth styles for button consistency or create new? 
// Better to simple inline styles or a small module, but since requirement says "Minimal", inline or a new file is good.
// Let's use inline styles for the SVG to keep it simple and self-contained, or add class in App.css / index.css?
// Users request: "Reuse existing components where possible. Do not add heavy libraries".
// I'll add the styles to Auth.module.css or create a new one. Auth.module.css is for Pages.
// I'll create a simple style object or CSS module for it? 
// Actually, `Auth.module.css` seems specific to Auth pages. I should probably add a specific class for the toggle in `Auth.module.css` or just use inline styles for the toggle specific positioning.
// The toggle is for "Login / Register pages". 
// I'll simply add the toggle component code here.

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        // Sun icon for dark mode (to switch to light)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon for light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
