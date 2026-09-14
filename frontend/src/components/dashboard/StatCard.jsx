import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-50 border border-blue-200/80 text-blue-600',
  color = 'text-blue-600'
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_4px_24px_rgba(15,23,42,0.05)] flex items-center gap-4 transition-all duration-200 hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(37,99,235,0.06)]">
      {Icon && (
        <div className={`w-12 h-12 rounded-xl ${iconBg} ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight leading-none">{value}</div>
        <div className="text-xs font-bold text-slate-700 mt-1.5 truncate">{title}</div>
        {subtitle && <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatCard;
