import React, { useState, useEffect } from 'react';
import Chats from '../pages/Chats';
import GroupChat from '../components/GroupChat';
import { 
    Box, 
    Tabs, 
    Tab, 
    Divider, 
    Typography,
    styled 
} from '@mui/material';
import Sidebar from '../components/Sidebar';

// تعريف الألوان الجديدة
const colorPalette = {
  primary: '#80b49e',
  primaryLight: '#a8c9bb',
  primaryDark: '#5a8f7a',
  primaryLighter: '#e1efe9',
  textDark: '#2d4a3e',
  textLight: '#5a7a6a',
  background: '#f8fbf9',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

const StyledTabs = styled(Tabs)({
  minHeight: '48px',
  marginLeft: '280px',
  '& .MuiTabs-indicator': {
    backgroundColor: colorPalette.primary,
  },
});

const StyledTab = styled(Tab)({
  minHeight: '48px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: colorPalette.textLight,
  '&.Mui-selected': {
    color: colorPalette.primary,
    fontWeight: 700,
  },
});

const ChatContainer = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const ChatSystem = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        // Fetch users
        const usersResponse = await fetch('https://api1.sstli.com/api/userinfo');
        const usersData = await usersResponse.json();
        setUsers(usersData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

if (loading) {
  return (
    <>
      <Sidebar/>
      <Box sx={{ 
        marginLeft: '280px', // نفس الـ margin بتاع المحتوى الرئيسي
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: colorPalette.background 
      }}>
        <Typography sx={{ color: colorPalette.textDark }}>جاري التحميل...</Typography>
      </Box>
    </>
  );
}

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colorPalette.background }}>
      {/* Horizontal Tabs at the top */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', boxShadow: 2 }}>
        <StyledTabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="chat tabs"
        >
          <StyledTab 
            value="individual" 
            label="المحادثات الفردية" 
          />
          <StyledTab 
            value="group" 
            label="المحادثات الجماعية" 
          />
        </StyledTabs>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side - Navigation */}
        <Box 
          sx={{
            width: 240,
            borderRight: '1px solid #e0e0e0',
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
          }}
        >

          {/* Tab Content */}
          <Box flex={1} overflow="auto">
            {activeTab === 'individual' ? (
              <Chats 
                users={users}
                currentUser={currentUser}
                onSelectUser={setSelectedUser}
                selectedUser={selectedUser}
              />
            ) : (
              <GroupChat 
              users={users}
              currentUser={currentUser}
                onSelectGroup={setSelectedGroup}
                selectedGroup={selectedGroup}
              />
            )}
          </Box>
        </Box>

        {/* Right Side - Chat Area */}
        <ChatContainer>
          {activeTab === 'individual' ? (
            <Chats 
              onBack={() => setSelectedUser(null)}
            />
          ) : (
            <GroupChat 
              users={users}
              currentUser={currentUser}
              onBack={() => setSelectedGroup(null)}
            />
          )}
        </ChatContainer>
      </Box>
    </Box>
  );
};

export default ChatSystem;