"use client";

interface BiasScoreCardProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getBiasLevel(score: number): { label: string; color: string; bg: string; ring: string } {
  if (score >= 70) return { label: "고편향", color: "text-red-600", bg: "bg-red-50", ring: "ring-red-400" };
  if (score >= 40) return { label: "중편향", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-400" };
  return { label: "저편향", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-400" };
}

const sizeMap = {
  sm: { outer: 56, stroke: 5, fontSize: "text-xs", labelSize: "text-[10px]" },
  md: { outer: 88, stroke: 7, fontSize: "text-lg", labelSize: "text-xs" },
  lg: { outer: 128, stroke: 10, fontSize: "text-3xl", labelSize: "text-sm" },
};

export default function BiasScoreCard({ score, size = "md", showLabel = true }: BiasScoreCardProps) {
  const { label, color, bg, ring } = getBiasLevel(score);
  const { outer, stroke, fontSize, labelSize } = sizeMap[size];
  const radius = (outer - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 70 ? "#dc2626" : score >= 40 ? "#d97706" : "#059669";

  return (
    <div className={`inline-flex flex-col items-center gap-1 rounded-xl ${bg} px-3 py-2 ring-2 ${ring}`}>
      <svg width={outer} height={outer} className="-rotate-90">
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${outer / 2}px ${outer / 2}px`, fill: strokeColor, fontWeight: 700 }}
        >
          {score}%
        </text>
      </svg>
      {showLabel && (
        <span className={`${labelSize} font-semibold ${color}`}>{label}</span>
      )}
    </div>
  );
}
