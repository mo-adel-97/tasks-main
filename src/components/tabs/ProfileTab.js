import React from "react";
import { Card, Typography, Grid, List, ListItem, ListItemText, Divider } from "@mui/material";
import { motion } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { Person, Work, Notifications } from "@mui/icons-material";
import { format } from "date-fns";

const COLOR_SCHEME = {
  primary: '#76ae97',
  text: '#2c3e50'
};

const ProfileTab = ({ user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        p: 4, 
        borderRadius: 4,
        background: "white",
        boxShadow: `0 8px 32px ${alpha(COLOR_SCHEME.primary, 0.08)}`,
        border: `1px solid ${alpha(COLOR_SCHEME.primary, 0.1)}`
      }}>
        <Typography variant="h5" sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: 'center' }}>
          <Person sx={{ mr: 1, color: COLOR_SCHEME.primary }} /> البيانات الشخصية
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Work sx={{ mr: 1, color: COLOR_SCHEME.primary }} /> المعلومات الأساسية
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="الاسم الكامل" 
                  secondary={user?.fullName || "غير محدد"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="المسمى الوظيفي" 
                  secondary={user?.jobTitle || "غير محدد"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="القسم" 
                  secondary={user?.department || "غير محدد"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="رقم الموظف" 
                  secondary={user?.employeeId || "غير محدد"} 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Notifications sx={{ mr: 1, color: COLOR_SCHEME.primary }} /> معلومات الاتصال
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="البريد الإلكتروني" 
                  secondary={user?.email || "غير محدد"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="رقم الهاتف" 
                  secondary={user?.phone || "غير محدد"} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="تاريخ التعيين" 
                  secondary={user?.hireDate ? format(new Date(user.hireDate), 'dd/MM/yyyy') : 'غير محدد'} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="الحالة" 
                  secondary={user?.status || "نشط"} 
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Card>
    </motion.div>
  );
};

export default ProfileTab;