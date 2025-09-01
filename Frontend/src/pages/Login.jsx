


// login.jsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/style.css";

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password,
      }, { withCredentials: true });

      setMessage(res.data.message || "Login successful ✅");


      navigate("/home");

     


    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed ❌");
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Welcome Back 👋</h2>
        <p className="form-subtitle">
          Login to continue your amazing journey
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Gmail</label>
          </div>

          <div className="input-group password-group">
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>
            <span
              className="toggle-pass"
              onClick={() => setShowPass(!showPass)}
              aria-hidden
            >
              {showPass ? (
                // eye icon (visible)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 .001-10.001A5 5 0 0 1 12 17z" />
                </svg>
              ) : (
                // eye-off icon (hidden)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M2 2l20 20-1.4 1.4L16.6 19C14.9 19.7 13 20 12 20c-7 0-11-7-11-7 1.5-2.4 4-4.4 7-5.4L3.4 3.4 2 2zM12 6c1 0 2 .3 2.9.8L9.2 12.5C8.7 11.6 8 11 7 11 6 11 4.6 11.6 3 12.9 4.6 14.2 6 15 7 15c1 0 1.7-.6 2.2-1.5L15.2 9.1C14 8.4 13 8 12 8c-1 0-2 .3-2.9.8L12 6z" />
                </svg>
              )}
            </span>
          </div>

          <button type="submit" className="btn primary">Login</button>
        </form>

        {message && <p style={{ marginTop: "10px", color: "cyan" }}>{message}</p>}

        <p className="switch-text">
          Don’t have an account? <Link to="/register">Register now</Link>
        </p>
      </div>
    </div>
  );
}
