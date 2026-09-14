import React from 'react';

export const Card = ({
  children,
  className = '',
  interactive = false,
  variant = 'default',
  onClick,
  ...props
}) => {
  const variantStyles = {
    default: 'border border-[#E2E8F0] bg-white text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)]',
    inset: 'border border-[#E2E8F0] bg-[#F8FAFC] text-slate-900',
    flat: 'border border-[#E2E8F0] bg-white text-slate-900',
    dark: 'border border-slate-800 bg-slate-900 text-white shadow-[0_4px_20px_rgba(15,23,42,0.12)]',
  }[variant] || 'border border-[#E2E8F0] bg-white text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.04)]';

  const interactiveStyles = interactive
    ? 'hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(37,99,235,0.06)] hover:-translate-y-0.5 cursor-pointer transition-all duration-200'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-200 ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-base font-semibold text-slate-900 tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl sm:rounded-b-3xl ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
