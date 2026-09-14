import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const DEMO_USERS = {
  student: {
    email: 'leooo@gmail.com',
    password: 'password123',
    role: 'student',
    name: 'leo',
    college: 'JNU jaipur college',
    degree: 'B.Tech Computer Science'
  },
  industry: {
    email: 'priya.mehta@novatech.io',
    password: 'password123',
    role: 'industry',
    name: 'Priya Mehta',
    company: 'NovaTech Solutions'
  },
  academician: {
    email: 'sverma@iitdelhi.ac.in',
    password: 'password123',
    role: 'academician',
    name: 'Dr. S. K. Verma',
    institution: 'ABES Engineering College'
  },
  academia: {
    email: 'sverma@iitdelhi.ac.in',
    password: 'password123',
    role: 'academician',
    name: 'Dr. S. K. Verma',
    institution: 'ABES Engineering College'
  },
  institution: {
    email: 'dean@abes.ac.in',
    password: 'password123',
    role: 'institution',
    name: 'Prof. Rajesh K. Bansal',
    institutionName: 'ABES Engineering College'
  }
};

const getInitialNotifications = () => {
  return [];
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('skillproof_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState(() => {
    return getInitialNotifications();
  });

  // Dynamic Real Database Notifications Loader
  const loadRealNotifications = async (user) => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const storageKey = `skillproof_read_notifs_${user.email}`;
      const readNotifIds = new Set(
        JSON.parse(localStorage.getItem(storageKey) || '[]')
      );

      // 1. Fetch persistent notifications from backend database
      const dbNotifs = await apiService.getNotifications().catch(() => []);
      const realNotifs = [];

      if (Array.isArray(dbNotifs)) {
        dbNotifs.forEach(n => {
          const isRead = n.read || readNotifIds.has(n.id) || readNotifIds.has(String(n.id));
          realNotifs.push({
            id: n.id,
            title: n.title,
            message: n.message,
            time: 'Recent',
            type: n.type || 'job',
            link: n.link,
            jobId: n.jobId,
            applicationId: n.applicationId,
            company: n.company,
            jobTitle: n.jobTitle,
            candidateName: n.candidateName,
            status: n.status,
            read: isRead
          });
        });
      }

      // 2. Candidate-specific custom notifications fallback if any
      const customNotifsKey = `skillproof_real_notifs_${user.email}`;
      const customNotifs = JSON.parse(localStorage.getItem(customNotifsKey) || '[]');
      customNotifs.forEach(cn => {
        if (cn && cn.id && !realNotifs.some(n => n.id === cn.id || (n.applicationId && n.applicationId === cn.applicationId && n.status === cn.status))) {
          realNotifs.push({
            ...cn,
            read: readNotifIds.has(cn.id)
          });
        }
      });

      // 3. For student, also check student applications
      if (user.role === 'student') {
        const apps = await apiService.getMyApplications().catch(() => []);
        if (Array.isArray(apps)) {
          apps.forEach(app => {
            if (app.status === 'SHORTLISTED') {
              const notifId = `shortlist_${app.applicationId || app.jobId}`;
              if (!realNotifs.some(n => n.id === notifId || (n.applicationId && n.applicationId === app.applicationId && n.status === 'Shortlisted'))) {
                realNotifs.push({
                  id: notifId,
                  title: `Shortlisted by ${app.company || 'NovaTech Solutions'}!`,
                  message: `Congratulations! You have been shortlisted for ${app.jobTitle || 'Opportunity'} at ${app.company || 'NovaTech Solutions'}. Click to view details.`,
                  time: 'Recent',
                  type: 'job',
                  link: `/student/jobs?jobId=${app.jobId}`,
                  jobId: app.jobId,
                  applicationId: app.applicationId,
                  company: app.company || 'NovaTech Solutions',
                  jobTitle: app.jobTitle,
                  status: 'Shortlisted',
                  read: readNotifIds.has(notifId)
                });
              }
            }
          });
        }
      }

      setNotifications(realNotifs);
    } catch (err) {
      console.warn('[AuthContext] Could not load notifications:', err.message);
    }
  };

  // Listen for cross-component application updates
  useEffect(() => {
    const handleUpdate = () => {
      const activeUser = currentUser || JSON.parse(localStorage.getItem('skillproof_user') || 'null');
      if (activeUser) {
        loadRealNotifications(activeUser);
      }
    };
    window.addEventListener('skillproof_application_updated', handleUpdate);
    return () => window.removeEventListener('skillproof_application_updated', handleUpdate);
  }, [currentUser]);

  // Load authenticated session on mount
  useEffect(() => {
    const token = localStorage.getItem('skillproof_token');
    const savedUser = localStorage.getItem('skillproof_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.role === 'student') {
          loadRealNotifications(u);
        }
      } catch (e) {
        console.warn('[AuthContext] Error parsing saved user on mount:', e);
      }
    }
    if (token) {
      apiService.getMe()
        .then((userData) => {
          if (userData && userData.email) {
            const roleKey = userData.role ? userData.role.replace('ROLE_', '').toLowerCase() : 'student';
            const enriched = {
              id: userData.id,
              userId: userData.id,
              email: userData.email,
              name: userData.fullName,
              username: userData.username,
              role: roleKey,
              college: userData.college || '',
              degree: userData.degree || '',
              company: userData.companyName,
              institution: userData.institutionName,
              avatar: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              token
            };
            setCurrentUser(enriched);
            localStorage.setItem('skillproof_user', JSON.stringify(enriched));
            if (roleKey === 'student') {
              localStorage.setItem('skillproof_student_token', token);
              localStorage.setItem('skillproof_student_user', JSON.stringify(enriched));
            }
            loadRealNotifications(enriched);
          }
        })
        .catch(() => {
          // Token invalid or expired
          localStorage.removeItem('skillproof_token');
          localStorage.removeItem('skillproof_user');
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrRoleKey, password = 'password123', explicitRole = null) => {
    let email = emailOrRoleKey;
    let pwd = password;
    let role = explicitRole;

    // Support quick-fill role keys
    if (DEMO_USERS[emailOrRoleKey]) {
      email = DEMO_USERS[emailOrRoleKey].email;
      pwd = DEMO_USERS[emailOrRoleKey].password;
      role = DEMO_USERS[emailOrRoleKey].role;
    }

    try {
      const res = await apiService.login(email, pwd, role);
      if (res && res.token) {
        localStorage.setItem('skillproof_token', res.token);
        const roleKey = res.role ? res.role.replace('ROLE_', '').toLowerCase() : (role || 'student');
        const userObj = {
          id: res.userId,
          userId: res.userId,
          profileId: res.profileId,
          email: email,
          name: res.fullName || res.username || 'SkillProof User',
          username: res.username,
          role: roleKey,
          token: res.token,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        };
        setCurrentUser(userObj);
        localStorage.setItem('skillproof_user', JSON.stringify(userObj));
        if (roleKey === 'student') {
          localStorage.setItem('skillproof_student_token', res.token);
          localStorage.setItem('skillproof_student_user', JSON.stringify(userObj));
        } else if (roleKey === 'industry') {
          localStorage.setItem('skillproof_industry_token', res.token);
          localStorage.setItem('skillproof_industry_user', JSON.stringify(userObj));
        }
        await loadRealNotifications(userObj);
        return userObj;
      }
    } catch (err) {
      console.error('[AuthContext] Login error:', err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await apiService.register(userData);
      if (res && res.token) {
        localStorage.setItem('skillproof_token', res.token);
        const roleKey = res.role ? res.role.replace('ROLE_', '').toLowerCase() : (userData.role || 'student');
        const userObj = {
          id: res.userId,
          userId: res.userId,
          profileId: res.profileId,
          email: userData.email,
          name: res.fullName || userData.fullName,
          username: res.username,
          role: roleKey,
          token: res.token,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        };
        setCurrentUser(userObj);
        localStorage.setItem('skillproof_user', JSON.stringify(userObj));
        if (roleKey === 'student') {
          localStorage.setItem('skillproof_student_token', res.token);
          localStorage.setItem('skillproof_student_user', JSON.stringify(userObj));
        } else if (roleKey === 'industry') {
          localStorage.setItem('skillproof_industry_token', res.token);
          localStorage.setItem('skillproof_industry_user', JSON.stringify(userObj));
        }
        await loadRealNotifications(userObj);
        return userObj;
      }
    } catch (err) {
      console.error('[AuthContext] Register error:', err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('skillproof_token');
    localStorage.removeItem('skillproof_user');
    localStorage.removeItem('skillproof_student_token');
    localStorage.removeItem('skillproof_student_user');
    localStorage.removeItem('skillproof_industry_token');
    localStorage.removeItem('skillproof_industry_user');
    setCurrentUser(null);
    setNotifications([]);
  };

  const switchRole = async (roleKey) => {
    try {
      if (roleKey === 'student') {
        const savedToken = localStorage.getItem('skillproof_student_token');
        const savedUser = localStorage.getItem('skillproof_student_user');
        if (savedToken && savedUser) {
          try {
            const userObj = JSON.parse(savedUser);
            if (userObj && userObj.role === 'student') {
              localStorage.setItem('skillproof_token', savedToken);
              localStorage.setItem('skillproof_user', savedUser);
              setCurrentUser(userObj);
              await loadRealNotifications(userObj);
              return userObj;
            }
          } catch (e) {
            console.warn('[AuthContext] Error restoring student session:', e);
          }
        }
      } else if (roleKey === 'industry') {
        const savedToken = localStorage.getItem('skillproof_industry_token');
        const savedUser = localStorage.getItem('skillproof_industry_user');
        if (savedToken && savedUser) {
          try {
            const userObj = JSON.parse(savedUser);
            if (userObj && userObj.role === 'industry') {
              localStorage.setItem('skillproof_token', savedToken);
              localStorage.setItem('skillproof_user', savedUser);
              setCurrentUser(userObj);
              await loadRealNotifications(userObj);
              return userObj;
            }
          } catch (e) {
            console.warn('[AuthContext] Error restoring industry session:', e);
          }
        }
      }

      if (DEMO_USERS[roleKey]) {
        return await login(roleKey);
      }
    } catch (err) {
      console.error('[AuthContext] switchRole error:', err);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    apiService.markNotificationAsRead(id).catch(() => {});
    const activeEmail = currentUser?.email || (JSON.parse(localStorage.getItem('skillproof_user') || '{}')).email;
    if (activeEmail) {
      try {
        const key = `skillproof_read_notifs_${activeEmail}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(id)) {
          existing.push(id);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (e) {
        console.warn('[AuthContext] Error persisting read notification:', e);
      }
    }
  };

  const refreshNotifications = () => {
    const activeUser = currentUser || JSON.parse(localStorage.getItem('skillproof_user') || 'null');
    if (activeUser) {
      loadRealNotifications(activeUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      register,
      logout,
      switchRole,
      notifications,
      markNotificationAsRead,
      refreshNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
