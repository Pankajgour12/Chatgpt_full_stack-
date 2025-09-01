import { BrowserRouter,Routes, Route } from 'react-router-dom'

import React from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Landing from './pages/Landing.jsx'
import axios from 'axios';
import { Navigate } from 'react-router-dom';

const AppRoutes = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/home" element={ <ProtectedHome /> } />
          <Route path="/register" element={<Register/>} />
          <Route path="/login" element={<Login/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default AppRoutes

function ProtectedHome(){
  // Simple client-side guard: try fetching /api/auth/me; if ok show Home else redirect to landing
  const [ok, setOk] = React.useState(null);
  React.useEffect(()=>{
    let mounted = true;
    axios.get('http://localhost:3000/api/auth/me', { withCredentials: true }).then(()=>{ if(mounted) setOk(true) }).catch(()=>{ if(mounted) setOk(false) });
    return ()=> mounted = false;
  },[]);
  if (ok === null) return <div style={{minHeight:200}}/>; // small loading placeholder
  return ok ? <Home/> : <Navigate to="/" replace />;
}
