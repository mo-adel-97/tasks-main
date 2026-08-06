import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import HomeTab from './HomeTab';
import TasksTab from './TasksTab';
import EmployeeOfTheMonthBanner from '../components/EmployeeOfTheMonthBanner';
import UpdateDialog from '../components/UpdateDialog';

const SIDEBAR_WIDTH = 240;
const UPDATE_URL = 'https://filesregsiteration.sstli.com/erp/check_update.php';

export default function Dashboard() {

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  useEffect(() => {
    fetch(UPDATE_URL)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.has_new) {

          const key = `update_seen_${data.latest.zip_name}_${data.latest.uploaded_at}`;
          const alreadySeen = localStorage.getItem(key);

          if (!alreadySeen) {
            setUpdateData(data.latest);
            setShowUpdateDialog(true);
          }
        }
      })
      .catch(err => {
        console.error('Update check failed:', err);
      });
  }, []);

  const handleCloseUpdate = () => {
    if (updateData) {
      const key = `update_seen_${updateData.zip_name}_${updateData.uploaded_at}`;
      localStorage.setItem(key, 'true');
    }
    setShowUpdateDialog(false);
  };

  const handleDownloadUpdate = () => {
    if (updateData) {
      const key = `update_seen_${updateData.zip_name}_${updateData.uploaded_at}`;
      localStorage.setItem(key, 'true');
      window.open(updateData.download_url, '_blank');
    }
    setShowUpdateDialog(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%)',
      fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
      position: 'relative',
    }}>

      <EmployeeOfTheMonthBanner />

      <UpdateDialog
        open={showUpdateDialog}
        update={updateData}
        onClose={handleCloseUpdate}
        onDownload={handleDownloadUpdate}
      />

      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: `${SIDEBAR_WIDTH}px`,
          width: `calc(100vw - 250px)`,
          pl: 6,
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Routes>
          <Route path="" element={<HomeTab />} />
          <Route path="tasks" element={<TasksTab />} />
        </Routes>
      </Box>
    </Box>
  );
}
