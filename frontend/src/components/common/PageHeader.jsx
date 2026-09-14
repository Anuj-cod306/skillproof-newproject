import React from 'react';
import { Link } from 'react-router-dom';

export const PageHeader = ({
  title,
  subtitle,
  description,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) => {
  const desc = subtitle || description;

  return (
    <div className={`mb-6 pb-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      <div>
        {breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            {breadcrumbs.map((crumb, idx) => {
              const label = typeof crumb === 'string' ? crumb : crumb?.label || '';
              const href = typeof crumb === 'object' ? crumb?.href : null;
              const isLast = idx === breadcrumbs.length - 1;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  {href && !isLast ? (
                    <a href={href} className="text-slate-500 hover:text-slate-900 transition-colors">
                      {label}
                    </a>
                  ) : (
                    <span className={isLast ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                      {label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {desc && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-3xl">
            {desc}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
