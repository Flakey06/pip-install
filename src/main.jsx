//file use: entry point, applies theme, waits for firebase auth state
import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme } from './hooks/useTheme.js'
import { auth } from './firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

applyTheme(localStorage.getItem("pip-theme") || "violet");

function Root() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authReady) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "white"
    }}>
      <div className="loader" />
    </div>
  );

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
