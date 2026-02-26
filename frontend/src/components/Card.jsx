export default function Card({ children, className = "", gradient = false, glow = "" }) {
  return (
    <div
      className={`
        rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm
        ${gradient ? "bg-gradient-to-br" : ""}
        ${glow ? `shadow-lg ${glow}` : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
