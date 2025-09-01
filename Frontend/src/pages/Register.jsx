
// Register.jsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/style.css";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    terms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.terms) {
      return setMessage("⚠️ Please accept Terms & Conditions.");
    }

    try {
      const res = await axios.post("https://chatgpt-full-stack.onrender.com/api/auth/register", {
        fullName: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        email: formData.email,
        password: formData.password,
      },{
         withCredentials: true 
      });

  setMessage("✅ " + res.data.message);
  navigate("/home"); 
    } catch (err) {
      console.error(err);
      setMessage("❌ " + (err.response?.data?.error || "Something went wrong"));
    }
  };

  const passwordStrength = () => {
    if (formData.password.length > 8) return "strong";
    if (formData.password.length > 4) return "medium";
    if (formData.password.length > 0) return "weak";
    return "";
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Create Account</h2>
        <p className="form-subtitle">
          Join us and experience the next-level Chat With Mitra AI
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <label>First Name</label>
          </div>
          <div className="input-group">
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <label>Last Name</label>
          </div>
          <div className="input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label>Gmail</label>
          </div>
          <div className="input-group password-group">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>Password</label>
            <span
              className="toggle-pass"
              onClick={() => setShowPass(!showPass)}
              aria-hidden
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 .001-10.001A5 5 0 0 1 12 17z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M2 2l20 20M10.58 10.59A3.99 3.99 0 0 0 12 14a4 4 0 0 0 4-4c0-.74-.22-1.43-.59-2.02L10.59 10.6z"/></svg>
              )}
            </span>
            <div className={`strength ${passwordStrength()}`}></div>
          </div>
          <div className="terms">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              required
            />
            <label htmlFor="terms">
              I agree to the <a href="#">Terms & Conditions</a>
            </label>
          </div>
          <button type="submit" className="btn primary">
            Register
          </button>
        </form>
        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
        <p className="switch-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

