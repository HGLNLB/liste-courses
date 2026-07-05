type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  className?: string;
};

export function Checkbox({ checked, onChange, ariaLabel, className = "" }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked
          ? "border-[#007AFF] bg-[#007AFF]"
          : "border-[#C7C7CC] bg-white"
      } ${className}`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
