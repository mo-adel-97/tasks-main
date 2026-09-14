import { HEADER_NAVIGATION } from '../config/sidebarNavigation';
import { SIDEBAR_DESKTOP_QUERY, getSidebarOffset } from '../config/sidebarLayout';
import React from "react";
import { useMediaQuery } from "@mui/material";
import { NavLink } from "react-router-dom";

const Header = ({ user, branch, onLogout }) => {
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_QUERY, { noSsr: true });
  return (
    <header className="main-header" style={{ ...headerStyles, marginRight: getSidebarOffset('standard', isDesktop) }}>
      {/* الجانب الأيسر - الشعار والمعلومات */}
      <div style={leftSectionStyles}>
        <div style={logoStyles}>
          <span style={logoIconStyles}>📊</span>
          <strong style={logoTextStyles}>نظام الاختبارات</strong>
        </div>
        
        {branch && (
          <div style={branchBadgeStyles}>
            <span style={branchIconStyles}>📍</span>
            <span style={branchTextStyles}>{branch.name}</span>
          </div>
        )}
      </div>

      {/* الجانب الأيمن - التنقل والمستخدم */}
      <div style={rightSectionStyles}>
        {/* قائمة التنقل */}
        <nav style={navStyles}>
          {HEADER_NAVIGATION.map((item) => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => isActive ? { ...navLinkStyles, ...navLinkActiveStyles } : navLinkStyles}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* معلومات المستخدم */}
        <div style={userInfoStyles}>
          <div style={userAvatarStyles}>
            <span style={avatarIconStyles}>👤</span>
          </div>
          <span style={userNameStyles}>{user.fullName}</span>
        </div>
      </div>
    </header>
  );
};

// === التنسيقات ===
const headerStyles = {
  flexWrap: 'wrap',
  gap: '16px',
  minWidth: 0,
  direction: 'rtl',
  display: 'flex',
  textAlign: 'start',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #80b49e 0%, #80b49e 100%)',
  borderBottom: '1px solid #e5e7eb',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
};

const leftSectionStyles = {
  flexWrap: 'wrap',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const logoStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const logoIconStyles = {
  fontSize: '24px',
};

const logoTextStyles = {
  fontSize: '20px',
  color: 'white',
  fontWeight: 'bold',
};

const branchBadgeStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255, 255, 255, 0.2)',
  padding: '6px 12px',
  borderRadius: '20px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

const branchIconStyles = {
  fontSize: '14px',
};

const branchTextStyles = {
  fontSize: '14px',
  color: 'white',
  fontWeight: '500',
};

const rightSectionStyles = {
  flexWrap: 'wrap',
  minWidth: 0,
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const navStyles = {
  flexWrap: 'wrap',
  minWidth: 0,
  display: 'flex',
  gap: '8px',
  background: 'rgba(255, 255, 255, 0.1)',
  padding: '6px',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
};

const navLinkStyles = {
  padding: '8px 16px',
  borderRadius: '8px',
  textDecoration: 'none',
  color: 'white',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const navLinkActiveStyles = {
  background: 'rgba(255, 255, 255, 0.2)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const userInfoStyles = {
  minWidth: 0,
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'rgba(255, 255, 255, 0.1)',
  padding: '8px 16px',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
};

const userAvatarStyles = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarIconStyles = {
  fontSize: '16px',
};

const userNameStyles = {
  overflowWrap: 'anywhere',
  color: 'white',
  fontSize: '14px',
  fontWeight: '500',
};

const logoutButtonStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  background: 'rgba(239, 68, 68, 0.9)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.3s ease',
};

const logoutIconStyles = {
  fontSize: '14px',
};

// تأثيرات hover
navLinkStyles[':hover'] = {
  background: 'rgba(255, 255, 255, 0.15)',
};

logoutButtonStyles[':hover'] = {
  background: 'rgba(239, 68, 68, 1)',
  transform: 'translateY(-1px)',
};

export default Header;
