import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SkillProofProvider } from './context/SkillProofContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <SkillProofProvider>
          <App />
        </SkillProofProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
