import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import './MitraAILanding.css';
import '../Styles/landing.css';

const MitraAILanding = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    setIsLoaded(true);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignUp = () => {
    console.log('Sign Up clicked');
  // navigate to register page
  if (navigate) navigate('/register'); else window.location.href = '/register';
  };

  const handleLogin = () => {
    console.log('Login clicked');
  if (navigate) navigate('/login'); else window.location.href = '/login';
  };

  const socialLinks = [
    {
      name: 'Twitter',
      url: 'https://x.com/Pankajgour404',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/pankajgour404',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.5-2.7 5.1-2.7 5.5 0 6.5 3.6 6.5 8.3V24h-5V16.7c0-1.7 0-3.9-2.4-3.9-2.4 0-2.8 1.9-2.8 3.8V24h-5V8z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/pankaj_vimla_gour/',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.056 1.8.247 2.22.412.55.21.94.463 1.35.874.41.41.664.8.874 1.35.165.42.356 1.05.412 2.22.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.247 1.8-.412 2.22-.21.55-.463.94-.874 1.35-.41.41-.8.664-1.35.874-.42.165-1.05.356-2.22.412-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.8-.247-2.22-.412-.55-.21-.94-.463-1.35-.874-.41-.41-.664-.8-.874-1.35-.165-.42-.356-1.05-.412-2.22C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.056-1.17.247-1.8.412-2.22.21-.55.463-.94.874-1.35.41-.41.8-.664 1.35-.874.42-.165 1.05-.356 2.22-.412C8.416 2.212 8.8 2.2 12 2.2zm0 3.1A6.7 6.7 0 1 0 18.7 12 6.7 6.7 0 0 0 12 5.3zm0 11A4.3 4.3 0 1 1 16.3 12 4.3 4.3 0 0 1 12 16.3zM18.4 5.6a1.56 1.56 0 1 1-1.56-1.56A1.56 1.56 0 0 1 18.4 5.6z" />
        </svg>
      )
    },
    {
      name: 'GitHub',
      url: 'https://github.com/Pankajgour12',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.45.11-3.02 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.57.23 2.73.11 3.02.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.41-5.28 5.69.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56C20.71 21.38 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`landing-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Dynamic Background */}
      <div className="background-layer">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
        <div 
          className="mouse-tracker"
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`
          }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">
             
              <img src="../logo.png" alt="" />
            </div>
            <span className="logo-text">Mitra AI</span>
          </div>
          
          <div className="nav-links">
           
            <button className="btn btn-primary"onClick={handleSignUp}><span>Sign Up </span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button>
            <button className="btn btn-primary"onClick={handleLogin}><span>log in</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button>
            <a href="https://www.instagram.com/pankaj_vimla_gour/" className="btn btn-primary">About Me</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l1.5 4.5L18 8l-3 2.5L15.5 15 12 12.8 8.5 15 9 10.5 6 8l4.5-1.5L12 2z"/></svg>
              </span>
              <span>Introducing Mitra AI </span>
            </div>
            
            <h1 className="hero-title">
              The Future of
              <br />
              <span className="gradient-text">Artificial Intelligence</span>
            </h1>
            
            <p className="hero-subtitle">
              Experience breakthrough AI technology that understands, learns, and evolves with you. 
              Transform your workflow with intelligent automation and insights.
            </p>
            
            <div className="button-group">
              <button className="btn btn-primary" onClick={handleSignUp}>
                <span>Sign Up Free</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              
              <button className="btn btn-secondary" onClick={handleLogin}>
                <span>Log In</span>
              </button>
            </div>
            
            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span>Enterprise Security</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span>Lightning Fast</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🌍</span>
                <span>Global Scale</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="features-preview">
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="../logo.png" alt="" />
                {/* <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a9 9 0 0 0-9 9c0 4.97 3.97 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9zm0 2a7 7 0 0 1 7 7c0 3.86-3.14 7-7 7s-7-3.14-7-7a7 7 0 0 1 7-7z"/></svg> */}
              </div>
              <h3>Smart AI</h3>
              <p>Advanced machine learning</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
              </div>
              <h3>Fast Processing</h3>
              <p>Real-time responses</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 1a4 4 0 0 0-4 4v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V5a4 4 0 0 0-4-4zM9 8V5a3 3 0 0 1 6 0v3H9z"/></svg>
              </div>
              <h3>Secure</h3>
              <p>End-to-end encryption</p>
            </div>
          </div>
        </section>
      </main>

      {/* Social Media Links */}
          <div className="social-links">
            {socialLinks.map((social, index) => (
              <a 
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`social-link social-${social.name.toLowerCase()}`}
                title={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
          <p className="footer-text">
            © 2025 Mitra AI. All rights reserved.
          </p>
          <br />
          <p className="footer-text">Made by Pankaj Gour ❤️</p>
          <br />
        </div>
      </footer>
    </div>
  );
};

export default MitraAILanding;