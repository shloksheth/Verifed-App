import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, LoaderCircle, X } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  className = "",
  busy,
  ...props
}) {
  return (
    <button
      className={`button ${variant} ${className}`}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy && <LoaderCircle size={17} className="spin" />}
      {children}
    </button>
  );
}

export function PageTitle({ eyebrow, title, description, action, back }) {
  return (
    <header className="page-title">
      {back && (
        <button className="back-link" onClick={back}>
          <ArrowLeft size={16} /> Back
        </button>
      )}
      <div className="title-row">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function SectionTitle({ title, action, onClick }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && (
        <button className="text-button" onClick={onClick}>
          {action}
          <ArrowUpRight size={16} />
        </button>
      )}
    </div>
  );
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon size={28} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function ToggleChips({ options, value = [], onChange, label }) {
  return (
    <div className="chip-group" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`select-chip ${value.includes(option) ? "selected" : ""}`}
          aria-pressed={value.includes(option)}
          onClick={() =>
            onChange(
              value.includes(option)
                ? value.filter((item) => item !== option)
                : [...value, option],
            )
          }
        >
          {value.includes(option) && <Check size={14} />} {option}
        </button>
      ))}
    </div>
  );
}

const statusLabels = {
  submitted: "Awaiting kitchen",
  responded: "Kitchen responded",
  clarification: "Question from kitchen",
  declined: "Unable to accommodate",
  review_required: "Changed · review required",
  acknowledged: "Response acknowledged",
  completed: "Completed",
  cancelled: "Cancelled",
};
export function Status({ status }) {
  return (
    <span
      className={`status ${status === "review_required" || status === "clarification" ? "amber" : status === "declined" || status === "cancelled" ? "muted" : "green"}`}
    >
      <i />
      {statusLabels[status] || status}
    </span>
  );
}

export function ErrorMessage({ error }) {
  return error ? (
    <p role="alert" className="error-message">
      {error}
    </p>
  ) : null;
}

export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(work, after) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await work();
      after?.(result);
      return result;
    } catch (failure) {
      setError(failure.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run, setError };
}

export function Dialog({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = oldOverflow;
      previous?.focus?.();
    };
  }, []);
  function onKeyDown(event) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab") return;
    const elements = ref.current.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
    );
    const first = elements[0],
      last = elements[elements.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === ref.current)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`dialog ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-heading">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function FoodArt({ dish, large = false }) {
  return (
    <div
      className={`food-art ${large ? "large" : ""} food-${(dish.name?.length || 0) % 4}`}
      aria-hidden="true"
    >
      <span>{dish.emoji || "🍽️"}</span>
      <i />
      <b />
    </div>
  );
}

export function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}
