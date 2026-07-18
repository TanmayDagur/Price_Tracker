'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      className="btn btn--ghost"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{ padding: '0.4rem 0.8rem', fontSize: '1.2rem' }}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
