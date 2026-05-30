import { useAppState } from '../../context/AppContext';

export function ToastContainer() {
  const { state, dispatch } = useAppState();

  if (state.toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto px-4 py-3 border text-xs font-medium flex items-center gap-2.5 animate-[slideUp_0.2s_ease-out]"
          style={{
            backgroundColor: toast.type === 'error' ? 'var(--toast-error-bg)' : 'var(--toast-success-bg)',
            borderColor: toast.type === 'error' ? 'var(--toast-error-border)' : 'var(--toast-success-border)',
            color: toast.type === 'error' ? 'var(--toast-error-text)' : 'var(--toast-success-text)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="uppercase tracking-wider">{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'DISMISS_TOAST', id: toast.id })}
            className="ml-2 opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
