import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border bg-surface text-foreground placeholder:text-foreground-subtle text-sm transition-colors py-2.5 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              leftIcon ? "pl-10" : "pl-3"
            } ${
              error
                ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                : "border-border hover:border-foreground-subtle"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {helper && !error && <p className="text-xs text-foreground-subtle">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps {
  label?: string;
  error?: string;
  helper?: string;
  id?: string;
  rows?: number;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Textarea({
  label,
  error,
  helper,
  id,
  rows = 4,
  className = "",
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full rounded-xl border bg-surface text-foreground placeholder:text-foreground-subtle text-sm transition-colors px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none ${
          error
            ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
            : "border-border hover:border-foreground-subtle"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {helper && !error && <p className="text-xs text-foreground-subtle">{helper}</p>}
    </div>
  );
}
