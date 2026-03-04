interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  name?: string;
}

export function Switch({ checked, onChange, label, name }: SwitchProps) {
  return (
    <div className="flex items-center gap-3">
      {name && <input type="hidden" name={name} value={checked ? "true" : "false"} />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? "bg-da-blue-900 hover:bg-da-blue-1100" : "bg-da-gray-300 dark:bg-slate-600"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
    </div>
  );
}
