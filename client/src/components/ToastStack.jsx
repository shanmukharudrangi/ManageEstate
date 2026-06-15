import Icon from './Icon';

export default function ToastStack({ toasts }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.tone || 'info'}`}>
          <div className="toast-icon">
            <Icon
              name={toast.tone === 'success' ? 'check' : toast.tone === 'danger' ? 'alert' : 'spark'}
              size={18}
            />
          </div>
          <div className="toast-copy">
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
