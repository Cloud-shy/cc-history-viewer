import { useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { MainPanel } from './MainPanel';
import { SettingsPanel } from '../shared/SettingsPanel';

export function Shell() {
  const { state } = useAppState();
  const { settings } = state;

  useEffect(() => {
    const html = document.documentElement;
    // Theme class
    html.className = html.className.replace(/theme-\w+/g, '');
    html.classList.add(`theme-${settings.theme}`);
    // Font class
    html.className = html.className.replace(/font-\w+/g, '');
    html.classList.add(`font-${settings.fontFamily}`);
    // Font size
    html.setAttribute('data-font-size', settings.fontSize);
    // Dark mode
    html.classList.toggle('dark', settings.darkMode);
  }, [settings.theme, settings.fontFamily, settings.fontSize, settings.darkMode]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}>
      <Sidebar />
      <MainPanel />
      <SettingsPanel />
    </div>
  );
}
