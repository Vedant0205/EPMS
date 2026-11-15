import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendType = 'neutral',
}) => {
  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    down: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
    neutral: 'text-gray-600 bg-gray-50 dark:bg-slate-800 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{value}</p>
        {trend && (
          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${trendColors[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
          {icon}
        </div>
      )}
    </div>
  );
};
