import React from 'react';
import { ShieldCheck, Award, CheckCircle2, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-[11px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${
        variants[variant] || variants.neutral
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className={`${iconSizes[size] || 'w-3.5 h-3.5'} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};

export const VerifiedBadge = ({ level = 'GOLD', size = 'md', compact = false }) => {
  const badgeConfig = {
    GOLD: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <Award className={size === 'sm' ? 'w-3.5 h-3.5 text-amber-600' : 'w-4 h-4 text-amber-600'} />,
      label: compact ? 'Gold' : 'Verified Gold (80%+)'
    },
    SILVER: {
      bg: 'bg-slate-100 border-slate-300 text-slate-700',
      icon: <ShieldCheck className={size === 'sm' ? 'w-3.5 h-3.5 text-slate-600' : 'w-4 h-4 text-slate-600'} />,
      label: compact ? 'Silver' : 'Verified Silver (65%+)'
    },
    BRONZE: {
      bg: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5 text-orange-600' : 'w-4 h-4 text-orange-600'} />,
      label: compact ? 'Bronze' : 'Verified Bronze (50%+)'
    },
    NONE: {
      bg: 'bg-slate-100 border-slate-200 text-slate-500',
      icon: <Clock className={size === 'sm' ? 'w-3.5 h-3.5 text-slate-400' : 'w-4 h-4 text-slate-400'} />,
      label: compact ? 'Claim' : 'Unverified Claim'
    }
  };

  const config = badgeConfig[level] || badgeConfig.NONE;
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${padding} whitespace-nowrap`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export const TierBadge = ({ tier = 4 }) => {
  const tierMap = {
    1: { label: 'Tier 1: Resume Claim', color: 'bg-slate-100 border-slate-200 text-slate-700' },
    2: { label: 'Tier 2: GitHub Verified', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    3: { label: 'Tier 3: Test Assessed', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    4: { label: 'Tier 4: AI Interview Verified', color: 'bg-amber-50 border-amber-200 text-amber-800' }
  };

  const current = tierMap[tier] || tierMap[1];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${current.color}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
};

export const QuizStatusBadge = ({ status = 'LAUNCHED', className = '' }) => {
  const norm = (status || '').toUpperCase();
  const styles = {
    LAUNCHED: 'bg-amber-50 border-amber-200 text-amber-700',
    ACTIVE: 'bg-blue-50 border-blue-200 text-blue-700',
    SHORTLISTED: 'bg-blue-50 border-blue-200 text-blue-700',
    FULFILLED: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    VERIFIED: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    COMPLETED: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    CONFIRMED: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    GOLD: 'bg-amber-50 border-amber-200 text-amber-700',
    SILVER: 'bg-slate-100 border-slate-200 text-slate-700',
    PENDING: 'bg-slate-100 border-slate-200 text-slate-600',
    IN_PROGRESS: 'bg-sky-50 border-sky-200 text-sky-700',
    FAILED: 'bg-rose-50 border-rose-200 text-rose-700',
  }[norm] || 'bg-slate-50 border-slate-200 text-slate-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border whitespace-nowrap ${styles} ${className}`}>
      {status}
    </span>
  );
};

export const AvatarStack = ({ items = ['B', 'J', 'J'], max = 3, bg = 'bg-[#FA6E43]' }) => {
  const visible = items.slice(0, max);
  const remaining = items.length - max;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {visible.map((item, idx) => (
        <div
          key={idx}
          className={`w-6 h-6 rounded-full ${bg} text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-2xs`}
        >
          {typeof item === 'string' ? item[0]?.toUpperCase() : item}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-2xs">
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Badge;
