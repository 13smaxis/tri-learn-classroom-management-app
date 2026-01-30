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
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  green: 'bg-green-50 text-green-600 border-green-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
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
  color = 'blue' 
}) => {
  return (
    <div className={`rounded-xl border p-5 transition-all hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <svg 
                className={`h-4 w-4 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} 
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
        <div className={`rounded-lg p-3 ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
