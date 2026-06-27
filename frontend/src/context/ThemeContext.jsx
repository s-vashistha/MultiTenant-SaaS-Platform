import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
  dark: {
    name: 'Dark',
    icon: '🌑',
    vars: {
      '--bg':        '#0a0d14',
      '--surface':   '#111520',
      '--surface2':  '#161c2d',
      '--border':    'rgba(255,255,255,0.07)',
      '--border2':   'rgba(255,255,255,0.12)',
      '--text':      '#e8eaf0',
      '--muted':     '#7a7f94',
      '--dim':       '#2a2f45',
      '--input-bg':  '#0d1117',
      '--scrollbar': '#2a2f45',
      '--select-bg': '#111520',
    },
  },
  light: {
    name: 'Light',
    icon: '☀️',
    vars: {
      '--bg':        '#f4f5f7',
      '--surface':   '#ffffff',
      '--surface2':  '#f0f1f5',
      '--border':    'rgba(0,0,0,0.08)',
      '--border2':   'rgba(0,0,0,0.14)',
      '--text':      '#111827',
      '--muted':     '#6b7280',
      '--dim':       '#d1d5db',
      '--input-bg':  '#f9fafb',
      '--scrollbar': '#d1d5db',
      '--select-bg': '#ffffff',
    },
  },
  midnight: {
    name: 'Midnight',
    icon: '🌌',
    vars: {
      '--bg':        '#05070f',
      '--surface':   '#090d1a',
      '--surface2':  '#0d1224',
      '--border':    'rgba(124,92,252,0.12)',
      '--border2':   'rgba(124,92,252,0.22)',
      '--text':      '#dde0f5',
      '--muted':     '#6b6f8a',
      '--dim':       '#1e2140',
      '--input-bg':  '#060910',
      '--scrollbar': '#1e2140',
      '--select-bg': '#090d1a',
    },
  },
  nord: {
    name: 'Nord',
    icon: '❄️',
    vars: {
      '--bg':        '#2e3440',
      '--surface':   '#3b4252',
      '--surface2':  '#434c5e',
      '--border':    'rgba(255,255,255,0.08)',
      '--border2':   'rgba(255,255,255,0.14)',
      '--text':      '#eceff4',
      '--muted':     '#9aa3b2',
      '--dim':       '#4c566a',
      '--input-bg':  '#2e3440',
      '--scrollbar': '#4c566a',
      '--select-bg': '#3b4252',
    },
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem('nexacore-theme') || 'dark'
  );

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const theme = THEMES[themeKey] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('nexacore-theme', themeKey);
  }, [themeKey]);

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);