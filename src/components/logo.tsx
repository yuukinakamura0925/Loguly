interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeStyles = {
  sm: { icon: "w-8 h-8", svg: "w-4 h-4", text: "text-lg" },
  md: { icon: "w-10 h-10", svg: "w-5 h-5", text: "text-xl" },
  lg: { icon: "w-16 h-16", svg: "w-8 h-8", text: "text-3xl" },
};

export function Logo({ size = "md", showText = true }: LogoProps) {
  const styles = sizeStyles[size];

  return (
    <div className="flex items-center gap-3">
      <div className={`${styles.icon} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25`}>
        <svg className={`${styles.svg} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {showText && (
        <span className={`${styles.text} font-bold text-white tracking-tight`}>Loguly</span>
      )}
    </div>
  );
}
