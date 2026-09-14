import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Award, Briefcase, ChevronRight, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NotificationDropdown = () => {
  const { notifications, markNotificationAsRead, refreshNotifications } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'passport': return <Award className="w-3.5 h-3.5 text-amber-400" />;
      case 'job': return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    } else if (notif.type === 'job' || notif.jobId) {
      navigate(`/student/jobs${notif.jobId ? `?jobId=${notif.jobId}` : ''}`);
    } else if (notif.type === 'passport') {
      navigate('/student/passport');
    } else {
      navigate('/student/dashboard');
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationAsRead(n.id);
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next && refreshNotifications) {
            refreshNotifications();
          }
        }}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-slate-900 rounded-full ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#DCE3EC] bg-white shadow-2xl z-50 overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No notifications yet</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                    !notif.read ? 'bg-slate-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0 transition-colors">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-900 truncate transition-colors">{notif.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.status === 'Shortlisted' && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Shortlisted
                        </span>
                        {notif.company && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {notif.company}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/60">
            <span className="text-[10px] text-slate-500 font-medium">Live Skill & Application Alerts</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
