import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">🏠</span>
        <span className="nav-text">Beranda</span>
      </NavLink>
      <NavLink to="/lessons" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">📚</span>
        <span className="nav-text">Pelajaran</span>
      </NavLink>
      <NavLink to="/assignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">📝</span>
        <span className="nav-text">Tugas</span>
      </NavLink>
      <NavLink to="/score-recap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">📊</span>
        <span className="nav-text">Rekap</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;