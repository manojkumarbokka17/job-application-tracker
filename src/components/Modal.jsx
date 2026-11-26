import { useEffect, useRef } from 'react';

// Accessible modal built on the native <dialog> element (Esc closes it, focus is trapped).
export default function Modal({ open, title, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()} // click on backdrop
      aria-labelledby="modal-title"
    >
      <div className="modal__header">
        <h2 id="modal-title">{title}</h2>
        <button type="button" className="btn btn--ghost" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
