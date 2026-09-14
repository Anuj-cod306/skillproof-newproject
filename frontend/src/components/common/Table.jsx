import React from 'react';

export const Table = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-[#DCE3EC] bg-white shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '' }) => {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return (
    <tbody className={`divide-y divide-slate-100 text-slate-800 ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', isHoverable = true, ...props }) => {
  return (
    <tr
      className={`transition-colors ${isHoverable ? 'hover:bg-slate-50/80' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className = '', ...props }) => {
  return (
    <th className={`px-4 sm:px-5 py-3.5 text-xs font-semibold text-slate-600 ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={`px-4 sm:px-5 py-3.5 text-xs sm:text-sm text-slate-700 ${className}`} {...props}>
      {children}
    </td>
  );
};

export default Table;
