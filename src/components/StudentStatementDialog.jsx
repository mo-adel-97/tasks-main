import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Table, TableHead, TableRow, TableCell, 
  TableBody, CircularProgress, Typography, 
  TableContainer, Paper 
} from '@mui/material';
import axios from 'axios';

export default function StudentStatementDialog({ open, onClose, accountGuid }) {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && accountGuid) {
      fetchStatements();
    }
  }, [open, accountGuid]);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api4.sstli.com/api/reception-office/student-statement/${accountGuid}`);
      setStatements(response.data);
    } catch (error) {
      console.error('Error fetching statement', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle style={adaptiveInlineStyle({ textAlign: 'center', fontWeight: 'bold', color: '#1976d2' })}>
        📑 كشف الحساب
      </DialogTitle>

      <DialogContent style={{ direction: 'rtl' }}>
        {loading ? (
          <CircularProgress style={{ display: 'block', margin: '20px auto' }} />
        ) : statements.length === 0 ? (
          <Typography align="center" mt={2}>لا توجد بيانات كشف حساب.</Typography>
        ) : (
          <TableContainer sx={uiLayout.tableContainerSx} component={Paper} style={{ marginTop: 10 }}>
            <Table>
              <TableHead>
                <TableRow style={adaptiveInlineStyle({ backgroundColor: '#f1f1f1' })}>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>📅 التاريخ</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>📄 نوع المستند</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>🔢 رقم المستند</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>➕ مدين</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>➖ دائن</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>💰 الرصيد</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo"}}>📝 ملاحظات</TableCell>
                  <TableCell align="center" style={{ fontWeight: 'bold',fontFamily:"cairo" }}>🏢 مركز تكلفة</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {statements.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell align="center">{item.dayDate ? item.dayDate.split('T')[0] : '-'}</TableCell>
                    <TableCell align="center">{item.name}</TableCell>
                    <TableCell align="center">{item.actionCode}</TableCell>
                    <TableCell align="center">{item.maden}</TableCell>
                    <TableCell align="center">{item.daen}</TableCell>
                    <TableCell align="center">{item.balance}</TableCell>
                    
                    {/* ✅ هنا ملاحظات بعرض ثابت وطول متغير */}
                    <TableCell 
                      align="center"
                      style={{ 
                        maxWidth: "200px", 
                        wordWrap: "break-word", 
                        whiteSpace: "normal",
                        textAlign: "center"
                      }}
                    >
                      {item.notes || '-'}
                    </TableCell>

                    <TableCell align="center">{item.centerName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.dialogActionsSx}>
        <Button sx={uiLayout.buttonSx} onClick={onClose} color="secondary">إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}
