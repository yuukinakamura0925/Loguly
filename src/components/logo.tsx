import { CirclePlayIcon } from "@/components/icons";

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
      <div className={`${styles.icon} bg-da-blue-900 rounded-2xl flex items-center justify-center`}>
        <CirclePlayIcon className={`${styles.svg} text-white`} strokeWidth={2} />
      </div>
      {showText && (
        <span className={`${styles.text} font-bold text-white tracking-tight`}>Loguly</span>
      )}
    </div>
  );
}
