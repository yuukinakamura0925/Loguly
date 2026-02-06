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
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
          ${checked ? "bg-blue-600" : "bg-slate-600"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </div>
  );
}
