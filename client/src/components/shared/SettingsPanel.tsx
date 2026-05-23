import { useState } from 'react';
import { useAppState, type ThemeName, type FontFamily, type FontSize } from '../../context/AppContext';

const THEMES: { id: ThemeName; label: string; colors: string[] }[] = [
  { id: 'forest',     label: 'Forest',   colors: ['#134e4a', '#10b981', '#0d9488'] },
  { id: 'aurora',     label: 'Aurora',   colors: ['#4c1d95', '#8b5cf6', '#d946ef'] },
  { id: 'sunset',     label: 'Sunset',   colors: ['#78350f', '#f97316', '#e11d48'] },
  { id: 'ocean',      label: 'Ocean',    colors: ['#1e3a5f', '#0ea5e9', '#06b6d4'] },
  { id: 'midnight',   label: 'Midnight', colors: ['#1e293b', '#6366f1', '#4f46e5'] },
  { id: 'moss',       label: 'Moss',     colors: ['#44403c', '#65a30d', '#4d7c0f'] },
];

const FONTS: { id: FontFamily; label: string; preview: string }[] = [
  { id: 'inter', label: 'Inter',       preview: 'The quick brown fox jumps over the lazy dog.' },
  { id: 'plex',  label: 'IBM Plex',    preview: 'The quick brown fox jumps over the lazy dog.' },
  { id: 'lora',  label: 'Lora',        preview: 'The quick brown fox jumps over the lazy dog.' },
  { id: 'geist', label: 'Geist',       preview: 'The quick brown fox jumps over the lazy dog.' },
];

const SIZES: { id: FontSize; label: string; sample: string }[] = [
  { id: 'sm', label: 'Small',  sample: '14px' },
  { id: 'md', label: 'Medium', sample: '16px' },
  { id: 'lg', label: 'Large',  sample: '18px' },
];

type Tab = 'appearance' | 'display' | 'about';

export function SettingsPanel() {
  const { state, dispatch } = useAppState();
  const { settings } = state;
  const [tab, setTab] = useState<Tab>('appearance');

  if (!state.settingsOpen) return null;

  const close = () => dispatch({ type: 'TOGGLE_SETTINGS' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={close}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700 px-6 pt-5 gap-6">
          {([
            ['appearance', 'Appearance'],
            ['display', 'Display'],
            ['about', 'About'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
          <button onClick={close} className="ml-auto pb-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === 'appearance' && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => dispatch({ type: 'SET_THEME', theme: t.id })}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        settings.theme === t.id
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex gap-1.5 mb-2">
                        <div className="w-3 h-8 rounded-sm" style={{ background: `linear-gradient(to bottom, ${t.colors[0]}, ${t.colors[0]}dd)` }} />
                        <div className="w-3 h-8 rounded-sm" style={{ background: `linear-gradient(to bottom, ${t.colors[1]}, ${t.colors[2]})` }} />
                      </div>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Font</h3>
                <div className="space-y-2">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => dispatch({ type: 'SET_FONT_FAMILY', fontFamily: f.id })}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        settings.fontFamily === f.id
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{f.label}</div>
                      <div
                        className="text-sm text-zinc-700 dark:text-zinc-200"
                        style={{ fontFamily: f.id === 'inter' ? 'Inter' : f.id === 'plex' ? 'IBM Plex Sans' : f.id === 'lora' ? 'Lora' : 'Geist Sans' }}
                      >
                        {f.preview}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Font Size</h3>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => dispatch({ type: 'SET_FONT_SIZE', fontSize: s.id })}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                        settings.fontSize === s.id
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{s.label}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{s.sample}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'display' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Dark mode</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Use dark color scheme for the main content area</div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SET_DARK_MODE', value: !settings.darkMode })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.darkMode ? 'bg-[var(--accent)]' : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    settings.darkMode ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Expand thinking by default</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Auto-expand thinking blocks when loading a session</div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SET_EXPAND_THINKING', value: !settings.expandThinkingByDefault })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.expandThinkingByDefault ? 'bg-[var(--accent)]' : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    settings.expandThinkingByDefault ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Expand tool calls by default</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Auto-expand tool call JSON when loading a session</div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'SET_EXPAND_TOOL_CALLS', value: !settings.expandToolCallsByDefault })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    settings.expandToolCallsByDefault ? 'bg-[var(--accent)]' : 'bg-zinc-300 dark:bg-zinc-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    settings.expandToolCallsByDefault ? 'translate-x-4.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {tab === 'about' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[var(--empty-icon-from)] to-[var(--empty-icon-to)] flex items-center justify-center shadow-lg" style={{ boxShadow: `0 4px 12px var(--empty-icon-shadow)` }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">Claude Code History Viewer</h3>
              <p className="text-sm text-zinc-400">Version 0.1.0</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Browse your Claude Code conversation history. Reads ~/.claude/history.jsonl and renders conversations as a rich chat interface.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
          <button
            onClick={close}
            className="px-5 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ background: `linear-gradient(to right, var(--reader-from), var(--reader-to))` }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
