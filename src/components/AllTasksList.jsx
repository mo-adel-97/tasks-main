import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Chip, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import Sidebar from './SidebarAdmin';

// API URLs for fetching tasks
const TASK_ROUTES_API = "https://api3.sstli.com/api/NewTasks/routes/all";
const DELETE_ROUTE_API = (id) => `https://api3.sstli.com/api/NewTasks/routes/delete?id=${id}`;
const PUPLIC_TASKS_API = "https://api3.sstli.com/api/PuplicTask/GetPuplicTasksByQuery";
const DELETE_PUBLIC_TASK_API = (id) => `https://api3.sstli.com/api/PuplicTask/DeletePuplicTask/${id}`;

export default function AllTaskRoutesList() {
  const [tasks, setTasks] = useState([]);
  const [publicTasks, setPublicTasks] = useState([]); // State for storing public tasks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State for storing error messages

  // Fetching all task routes
  const fetchData = async () => {
    try {
      const res = await axios.get(TASK_ROUTES_API);
      setTasks(res.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError('Error fetching tasks routes.');
    }
  };

  // Fetching public tasks
  const fetchPublicTasks = async () => {
    try {
      const res = await axios.get(PUPLIC_TASKS_API);
      setPublicTasks(res.data || []);
    } catch (error) {
      setError('Error fetching public tasks.');
      console.error("Error fetching public tasks:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPublicTasks();
  }, []);

  // Function to handle delete for task routes
  const handleDeleteRoute = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المهمة وكل المرفقات؟")) return;
    try {
      await axios.delete(DELETE_ROUTE_API(id));
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      setError('Error deleting task route.');
      console.error("Error deleting task route:", error);
    }
  };

  // Function to handle delete for public tasks
  const handleDeletePublicTask = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المهمة؟")) return;
    try {
        await axios.delete(DELETE_PUBLIC_TASK_API(id));
        setPublicTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
        setError('Error deleting public task: ' + (error.response ? error.response.data.details : error.message));
        console.log("Error deleting public task:", error);
    }
};


  // Function to add 3 hours to createdAt
  const adjustCreatedTime = (createdAt) => {
    const timeAdjustment = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const created = new Date(createdAt);
    created.setTime(created.getTime() + timeAdjustment);
    return created.toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  return (
    <>
      <Sidebar />
      <Box sx={{ flex: 1, p: 3, ml: '280px' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>📋 كل المهام الموزعة</Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper} sx={{ mb: 5 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                  <TableCell>اسم المهمة</TableCell>
                  <TableCell>المرسل</TableCell>
                  <TableCell>القسم المختص</TableCell>
                  <TableCell>الجهة المنفذة</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>تاريخ الإنشاء</TableCell>
                  <TableCell>عدد المستلمين</TableCell>
                  <TableCell>عدد المرفقات</TableCell>
                  <TableCell align="center">إجراء</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.taskName}</TableCell>
                    <TableCell>{task.senderName}</TableCell>
                    <TableCell>{task.departName}</TableCell>
                    <TableCell>{task.doneDepartName}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{adjustCreatedTime(task.createdAt)}</TableCell>
                    <TableCell>{task.receivers?.length || 0}</TableCell>
                    <TableCell>{task.attachments?.length || 0}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="حذف المهمة والمرفقات">
                        <IconButton onClick={() => handleDeleteRoute(task.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="h5" sx={{ mb: 3 }}>📋 المهام العامة</Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                  <TableCell>اسم المهمة</TableCell>
                  <TableCell>الوصف</TableCell>
                  <TableCell>المرسل</TableCell>
                  <TableCell>المستلمين</TableCell>
                  <TableCell>تاريخ الإنشاء</TableCell>
                  <TableCell>إجراء</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {publicTasks.map(task => {
                  const assignedBy = JSON.parse(task.assignedBy.replace(/\\/g, '') || '{}');
                  const assignedByName = assignedBy.fullName || "غير معروف";
                  const assignedTo = JSON.parse(task.assignedTo.replace(/\\/g, '') || '[]');
                  const assignedToNames = assignedTo.map(user => user.fullName).join(", ");

                  return (
                    <TableRow key={task.id}>
                      <TableCell>{task.taskName}</TableCell>
                      <TableCell>{task.taskDescription || "لا يوجد"}</TableCell>
                      <TableCell>{assignedByName}</TableCell>
                      <TableCell>{assignedToNames}</TableCell>
                      <TableCell>{adjustCreatedTime(task.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="حذف المهمة">
                          <IconButton onClick={() => handleDeletePublicTask(task.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {error && (
          <Box sx={{ mt: 3, color: 'red' }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}
