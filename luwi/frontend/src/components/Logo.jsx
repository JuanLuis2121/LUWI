import { useId } from "react";

export default function Logo({ className = "" }) {
  const id = useId();
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 220 70" className="h-14 w-auto" role="img" aria-label="LUWI">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#12306e" />
            <stop offset="55%" stopColor="#2f6bff" />
            <stop offset="80%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#14c9a5" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="58"
          textAnchor="middle"
          fontSize="64"
          fontWeight="800"
          fill={`url(#${id}-g)`}
          fontFamily="DM Sans, sans-serif"
          letterSpacing="2"
        >
          LUWI
        </text>
      </svg>
      <p className="mt-1 flex items-center gap-2 text-[11px] font-medium text-luwi-navy">
        <span>Learn</span>
        <i className="h-1 w-1 rounded-full bg-luwi-blue" />
        <span>Upgrade</span>
        <i className="h-1 w-1 rounded-full bg-luwi-purple" />
        <span>Work</span>
        <i className="h-1 w-1 rounded-full bg-luwi-teal" />
        <span>Improve</span>
      </p>
    </div>
  );
}