
import React from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun size={18} />,
  dark: <Moon size={18} />,
  system: <Monitor size={18} />,
};

const themeOrder: Theme[] = ['light', 'dark', 'system'];

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
      aria-label={`Mudar tema, atual: ${theme}`}
    >
      {themeIcons[theme]}
    </button>
  );
};

export default ThemeToggle;
