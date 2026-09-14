import React from 'react';
import Sidebar from './Sidebar';

// Compatibility entry point; rendering and configuration live in Sidebar.
export default function SidebarAdmin(props) {
  return <Sidebar {...props} variant="admin" />;
}
