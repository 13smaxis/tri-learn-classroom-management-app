import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo';
  dynamic?: boolean;
}

const colorClasses = {
  blue: 'bg-white text-sky-700 border-sky-200',
  green: 'bg-white text-emerald-700 border-emerald-200',
  orange: 'bg-white text-amber-700 border-amber-200',
  purple: 'bg-white text-slate-700 border-slate-200',
  red: 'bg-white text-rose-700 border-rose-200',
  indigo: 'bg-white text-indigo-700 border-indigo-200'
};

const dynamicColorClasses = {
  blue: 'bg-white text-sky-700 border-sky-300 ring-1 ring-sky-200/70',
  green: 'bg-white text-emerald-700 border-emerald-300 ring-1 ring-emerald-200/70',
  orange: 'bg-white text-amber-700 border-amber-300 ring-1 ring-amber-200/70',
  purple: 'bg-white text-slate-700 border-slate-300 ring-1 ring-slate-200/70',
  red: 'bg-white text-rose-700 border-rose-300 ring-1 ring-rose-200/70',
  indigo: 'bg-white text-indigo-700 border-indigo-300 ring-1 ring-indigo-200/70'
};

const iconBgClasses = {
  blue: 'bg-sky-100',
  green: 'bg-emerald-100',
  orange: 'bg-amber-100',
  purple: 'bg-slate-100',
  red: 'bg-rose-100',
  indigo: 'bg-indigo-100'
};

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue',
  dynamic = true
}) => {
  const numericValue =
    typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''));
  const hasValue = Number.isFinite(numericValue) && numericValue > 0;
  const cardToneClass = dynamic && hasValue ? dynamicColorClasses[color] : colorClasses[color];

  return (
    <div className={`rounded-xl p-4 text-center border shadow-sm transition-all ${cardToneClass}`}>
      <div className="flex flex-col items-center justify-center gap-2">
        <div className={`rounded-lg p-2 ${iconBgClasses[color]}`}>
          {icon}
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-700 font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-600">{subtitle}</p>
        )}
        {trend && (
          <div className={`mt-1 inline-flex items-center text-xs ${trend.isPositive ? 'text-green-700' : 'text-red-700'}`}>
            <svg
              className={`h-3.5 w-3.5 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{Math.abs(trend.value)}% from last term</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
