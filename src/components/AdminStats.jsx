import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Grid, TextField, Autocomplete, Paper
} from '@mui/material';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const TASKS_API = "https://api3.sstli.com/api/TasksWithSubs/All";
const USERS_API = "https://api1.sstli.com/api/userinfo";

export default function AdminStats() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [taskRes, userRes] = await Promise.all([
        axios.get(TASKS_API),
        axios.get(USERS_API)
      ]);
      setTasks(taskRes.data);
      setUsers(userRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const userFilteredTasks = selectedUser
    ? tasks.filter(t =>
        t.senderGuid === selectedUser.guid ||
        t.subTasks.some(sub => sub.userReceiverGuids?.includes(selectedUser.guid))
      )
    : tasks;

  const statusCount = {};
  const monthStats = {};

  userFilteredTasks.forEach(task => {
    task.subTasks.forEach(sub => {
      statusCount[sub.status] = (statusCount[sub.status] || 0) + 1;
      const date = new Date(task.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthStats[key] = (monthStats[key] || 0) + 1;
    });
  });

  const statusChart = {
    labels: Object.keys(statusCount),
    datasets: [{
      label: 'عدد المهام',
      data: Object.values(statusCount),
      backgroundColor: ['#4ade80', '#facc15', '#f87171', '#60a5fa']
    }]
  };

  const monthChart = {
    labels: Object.keys(monthStats),
    datasets: [{
      label: 'عدد المهام بالشهر',
      data: Object.values(monthStats),
      fill: false,
      borderColor: '#3b82f6',
      tension: 0.3
    }]
  };

  if (loading) {
    return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <NavigationShell variant="admin" ><>
      
      <Box sx={{
        flex: 1,
        p: 4,
        bgcolor: '#f9fafb',
        minHeight: '100vh',
        ...navigationContentSx
      }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>
          📊 احصائيات المهام 
        </Typography>

        <Paper elevation={2} sx={{ p: 3, mb: 4, backgroundColor: '#fff' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8} style={{width:"300px"}}>
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={(option) => option.fullName || option.userName || ''}
                value={selectedUser}
                onChange={(e, newVal) => setSelectedUser(newVal)}
                inputValue={searchInput}
                onInputChange={(e, newInput) => setSearchInput(newInput)}
                renderInput={(params) => <TextField {...params} label=" تصفية بالمستخدمين " variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography sx={{ fontSize: '1.1rem', color: '#374151' }}>
                عدد المهام: <strong>{userFilteredTasks.reduce((acc, t) => acc + t.subTasks.length, 0)}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>حــــالات المهـــــام</Typography>
            <Bar data={statusChart} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1 }}> التـــقدير الشهـــري للحــالات </Typography>
            <Line data={monthChart} />
          </Grid>
        </Grid>
      </Box>
    </></NavigationShell>
  );
}
