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
  blue: 'bg-white text-blue-600 border-blue-200',
  green: 'bg-white text-green-600 border-green-200',
  orange: 'bg-white text-orange-600 border-orange-200',
  purple: 'bg-white text-purple-600 border-purple-200',
  red: 'bg-white text-red-600 border-red-200',
  indigo: 'bg-white text-indigo-600 border-indigo-200'
};

const dynamicColorClasses = {
  blue: 'bg-white text-blue-600 border-blue-300 ring-1 ring-blue-200/60',
  green: 'bg-white text-green-600 border-green-300 ring-1 ring-green-200/60',
  orange: 'bg-white text-orange-600 border-orange-300 ring-1 ring-orange-200/60',
  purple: 'bg-white text-purple-600 border-purple-300 ring-1 ring-purple-200/60',
  red: 'bg-white text-red-600 border-red-300 ring-1 ring-red-200/60',
  indigo: 'bg-white text-indigo-600 border-indigo-300 ring-1 ring-indigo-200/60'
};

const iconBgClasses = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
  purple: 'bg-purple-100',
  red: 'bg-red-100',
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
