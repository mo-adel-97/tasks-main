import { adaptiveInlineStyle } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  SimCard as SimCardIcon,
  Smartphone as SmartphoneIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';

const HR_API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const EmployeeDataDialog = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    branchId: '',
    branchName: '',
    jobTitle: '',
    phones: [
      {
        serial: '',
        sims: 1,
        simNumbers: [''],
        type: ''
      }
    ]
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // الوظائف تأتي من HR_JobTitle مع الحفاظ على LegacyJobCode القديم.
  // الوظيفة LegacyJobCode = 12 محفوظة في قاعدة البيانات ولكن لا تظهر للاختيار.
  const [jobTitles, setJobTitles] = useState([]);
  const [jobTitlesLoading, setJobTitlesLoading] = useState(false);

  // دالة للتحقق من صحة رقم الجوال السعودي
  const validateSaudiPhoneNumber = (phoneNumber) => {
    const saudiPhoneRegex = /^(05)(5|0|3|6|4|9|1|8|7|2)([0-9]{7})$/;
    return saudiPhoneRegex.test(phoneNumber);
  };

  // دالة للتحقق من صحة السيريال نمبر
  const validateSerialNumber = (serial) => {
    // السيريال نمبر يجب أن يكون بين 6 و 20 حرف/رقم
    // ويمكن أن يحتوي على أحرف وأرقام فقط
    const serialRegex = /^[a-zA-Z0-9]{6,20}$/;
    return serialRegex.test(serial);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData(prev => ({
        ...prev,
        employeeId: user.guid,
        fullName: user.fullName || ''
      }));
    }

    fetchBranches();
    fetchJobTitles();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('https://api1.sstli.com/api/branches/all', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const branchesData = await response.json();
        setBranches(branchesData);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('حدث خطأ في جلب بيانات الفروع');
    }
  };

  const fetchJobTitles = async () => {
    setJobTitlesLoading(true);

    try {
      const response = await fetch(
        `${HR_API_BASE_URL}/api/hr/job-titles/lookups`,
        { cache: 'no-store' }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || 'حدث خطأ في جلب الوظائف والمسميات الوظيفية'
        );
      }

      const rows = Array.isArray(result?.data) ? result.data : [];

      // هذه الشاشة ترسل اسم الوظيفة للنظام القديم،
      // لذلك نحتفظ بنفس الـ payload القديم ونغير مصدر القائمة فقط.
      setJobTitles(
        rows
          .filter(
            (job) =>
              job?.isActive === true &&
              job?.showInUserSelection === true &&
              Number.isInteger(Number(job?.legacyJobCode))
          )
          .sort(
            (a, b) =>
              Number(a.legacyJobCode) - Number(b.legacyJobCode)
          )
      );
    } catch (fetchError) {
      console.error('Error fetching HR job titles:', fetchError);
      setError(
        fetchError?.message ||
          'حدث خطأ في جلب الوظائف والمسميات الوظيفية'
      );
      setJobTitles([]);
    } finally {
      setJobTitlesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBranchChange = (e) => {
    const selectedBranchId = e.target.value;
    const selectedBranch = branches.find(branch => branch.guid === selectedBranchId);
    
    setFormData(prev => ({
      ...prev,
      branchId: selectedBranchId,
      branchName: selectedBranch ? selectedBranch.name : ''
    }));
  };

  const handlePhoneChange = (index, field, value) => {
    const updatedPhones = [...formData.phones];
    
    if (field === 'sims') {
      const currentSims = updatedPhones[index].sims;
      const newSims = parseInt(value);
      
      if (newSims > currentSims) {
        const newSimNumbers = [...updatedPhones[index].simNumbers];
        for (let i = currentSims; i < newSims; i++) {
          newSimNumbers.push('');
        }
        updatedPhones[index].simNumbers = newSimNumbers;
      } else if (newSims < currentSims) {
        updatedPhones[index].simNumbers = updatedPhones[index].simNumbers.slice(0, newSims);
      }
      
      updatedPhones[index][field] = newSims;
    } else {
      updatedPhones[index][field] = value;
    }
    
    setFormData(prev => ({
      ...prev,
      phones: updatedPhones
    }));
  };

  const handleSimNumberChange = (phoneIndex, simIndex, value) => {
    // السماح فقط بالأرقام
    const numbersOnly = value.replace(/[^0-9]/g, '');
    
    const updatedPhones = [...formData.phones];
    updatedPhones[phoneIndex].simNumbers[simIndex] = numbersOnly;
    setFormData(prev => ({
      ...prev,
      phones: updatedPhones
    }));
  };

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [
        ...prev.phones,
        { 
          serial: '', 
          sims: 1, 
          simNumbers: [''], 
          type: '' 
        }
      ]
    }));
  };

  const removePhone = (index) => {
    if (formData.phones.length > 1) {
      const updatedPhones = formData.phones.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        phones: updatedPhones
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // التحقق من الحقول الأساسية
      if (!formData.fullName || !formData.branchId || !formData.jobTitle) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
      }

      // التحقق من بيانات الجوالات
      for (const phone of formData.phones) {
        if (!phone.serial || !phone.type) {
          throw new Error('يرجى ملء جميع بيانات الجوالات');
        }

        // التحقق من صحة السيريال نمبر
        if (!validateSerialNumber(phone.serial)) {
          throw new Error('السيريال نمبر غير صالح. يجب أن يكون بين 6 و 20 حرف/رقم');
        }

        // التحقق من أرقام الشرائح
        for (const simNumber of phone.simNumbers) {
          if (!simNumber.trim()) {
            throw new Error('يرجى ملء جميع أرقام الشرائح');
          }

          // التحقق من صحة رقم الجوال السعودي
          if (!validateSaudiPhoneNumber(simNumber)) {
            throw new Error(`رقم الجوال ${simNumber} غير صالح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام`);
          }
        }
      }

      // إعداد البيانات للإرسال
      const submitData = {
        action: 'save',
        employeeId: formData.employeeId,
        fullName: formData.fullName,
        jobTitle: formData.jobTitle,
        branchId: formData.branchId,
        branchName: formData.branchName,
        phones: formData.phones.map(phone => ({
          serial: phone.serial,
          sims: phone.sims,
          simNumbers: phone.simNumbers,
          type: phone.type
        }))
      };

      const response = await fetch('https://filesregsiteration.sstli.com/erp/EmployeeDataDialog.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.success) {
        if (typeof onSuccess === 'function') {
          onSuccess();
        } else {
          console.log('Data saved successfully');
          window.location.reload();
        }
      } else {
        throw new Error(result.message || 'حدث خطأ في حفظ البيانات');
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog sx={uiLayout.dialogLayoutSx} 
      open={true} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          color: '#1e293b',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <BadgeIcon sx={{ fontSize: 35, color: 'white' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              بيانات إلزامية
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          {/* معلومات الموظف */}
          <Card sx={{ 
            mb: 4, 
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <PersonIcon sx={{ fontSize: 28, color: '#0ea5e9' }} />
                <Typography variant="h6" fontWeight="bold" color="#1e293b">
                  المعلومات الشخصية
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Chip 
                    label={`هذه البيانات الزامية يرجى ملئ البيانات الخاصه بك ثم استمر في استخدام النظام`}
                    sx={{ 
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      color: '#0369a1',
                      fontSize: '0.9rem',
                      padding: 1,
                      height: 'auto',
                      border: '1px solid #bae6fd',
                      '& .MuiChip-label': { padding: '6px 12px' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField InputLabelProps={{ shrink: true }}
                    fullWidth
                    name="fullName"
                    label="الاسم الكامل *"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="أدخل الاسم الكامل"
                    sx={uiLayout.withUiSx({
                      '& .MuiInputLabel-root': { 
                        color: '#475569',
                        fontWeight: '600'
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { 
                          borderColor: '#cbd5e1',
                          borderWidth: 1
                        },
                        '&:hover fieldset': { 
                          borderColor: '#0ea5e9',
                        },
                        '&.Mui-focused fieldset': { 
                          borderColor: '#0ea5e9',
                          borderWidth: 2
                        },
                        color: '#1e293b',
                        background: 'white',
                        borderRadius: 1
                      }
                    }, uiLayout.formFieldSx)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth required>
                    <InputLabel sx={{ 
                      color: '#475569',
                      fontWeight: '600'
                    }}>
                      الوظيفة *
                    </InputLabel>
                    <Select
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      label="الوظيفة *"
                      sx={{
                        color: '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#cbd5e1',
                          borderWidth: 1
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#0ea5e9',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#0ea5e9',
                          borderWidth: 2
                        },
                        background: 'white',
                        borderRadius: 1
                      }}
                    >
                      <MenuItem value="">
                        <em style={adaptiveInlineStyle({ color: '#64748b' })}>اختر الوظيفة</em>
                      </MenuItem>
                      {jobTitlesLoading && (
                        <MenuItem value="" disabled>
                          جاري تحميل الوظائف...
                        </MenuItem>
                      )}

                      {!jobTitlesLoading &&
                        jobTitles.map((job) => (
                          <MenuItem
                            key={job.jobTitleGuid || job.legacyJobCode}
                            value={job.jobTitleName}
                          >
                            {job.jobTitleName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth required>
                    <InputLabel sx={{ 
                      color: '#475569',
                      fontWeight: '600'
                    }}>
                      الفرع *
                    </InputLabel>
                    <Select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleBranchChange}
                      label="الفرع *"
                      sx={{
                        color: '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#cbd5e1',
                          borderWidth: 1
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#0ea5e9',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#0ea5e9',
                          borderWidth: 2
                        },
                        background: 'white',
                        borderRadius: 1
                      }}
                    >
                      <MenuItem value="">
                        <em style={adaptiveInlineStyle({ color: '#64748b' })}>اختر الفرع</em>
                      </MenuItem>
                      {branches.map(branch => (
                        <MenuItem key={branch.guid} value={branch.guid}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* بيانات الجوالات */}
          <Card sx={{ 
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <PhoneIcon sx={{ fontSize: 28, color: '#0ea5e9' }} />
                  <Typography variant="h6" fontWeight="bold" color="#1e293b">
                    بيانات الجوالات
                  </Typography>
                </Box>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addPhone}
                  variant="outlined"
                  color="primary"
                  size="medium"
                  sx={uiLayout.withUiSx({ 
                    color: '#0ea5e9', 
                    borderColor: '#0ea5e9',
                    borderWidth: 1,
                    borderRadius: 1,
                    fontWeight: '600',
                    '&:hover': {
                      borderColor: '#0284c7',
                      backgroundColor: '#f0f9ff',
                    }
                  }, uiLayout.buttonSx)}
                >
                  إضافة جوال
                </Button>
              </Box>

              {formData.phones.map((phone, index) => (
                <Card key={index} variant="outlined" sx={{ 
                  mb: 2, 
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', fontWeight: '600' }}>
                        <SmartphoneIcon fontSize="small" color="action" />
                        جوال #{index + 1}
                      </Typography>
                      {formData.phones.length > 1 && (
                        <IconButton
                          onClick={() => removePhone(index)}
                          sx={{ 
                            color: '#ef4444',
                            '&:hover': {
                              backgroundColor: '#fef2f2'
                            }
                          }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField InputLabelProps={{ shrink: true }}
                          fullWidth
                          label="السيريال نمبر *"
                          value={phone.serial}
                          onChange={(e) => handlePhoneChange(index, 'serial', e.target.value)}
                          placeholder="أدخل السيريال نمبر"
                          required
                          error={phone.serial && !validateSerialNumber(phone.serial)}
                          helperText={phone.serial && !validateSerialNumber(phone.serial) ? 
                            "يجب أن يكون بين 6 و 20 حرف/رقم" : ""}
                          sx={uiLayout.withUiSx({
                            '& .MuiInputLabel-root': { 
                              color: '#475569',
                              fontWeight: '600'
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { 
                                borderColor: '#cbd5e1',
                                borderWidth: 1
                              },
                              '&:hover fieldset': { 
                                borderColor: '#0ea5e9',
                              },
                              '&.Mui-focused fieldset': { 
                                borderColor: '#0ea5e9',
                                borderWidth: 2
                              },
                              color: '#1e293b',
                              background: 'white',
                              borderRadius: 1
                            }
                          }, uiLayout.formFieldSx)}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControl sx={uiLayout.formFieldSx} fullWidth required>
                          <InputLabel sx={{ 
                            color: '#475569',
                            fontWeight: '600'
                          }}>
                            عدد الشرائح *
                          </InputLabel>
                          <Select
                            value={phone.sims}
                            onChange={(e) => handlePhoneChange(index, 'sims', parseInt(e.target.value))}
                            label="عدد الشرائح *"
                            sx={{
                              color: '#1e293b',
                              '& .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#cbd5e1',
                                borderWidth: 1
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#0ea5e9',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#0ea5e9',
                                borderWidth: 2
                              },
                              background: 'white',
                              borderRadius: 1
                            }}
                          >
                            <MenuItem value={1}>1 شريحة</MenuItem>
                            <MenuItem value={2}>2 شريحة</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField InputLabelProps={{ shrink: true }}
                          fullWidth
                          label="نوع الجوال *"
                          value={phone.type}
                          onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                          placeholder="مثال: Samsung, iPhone, etc."
                          required
                          sx={uiLayout.withUiSx({
                            '& .MuiInputLabel-root': { 
                              color: '#475569',
                              fontWeight: '600'
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { 
                                borderColor: '#cbd5e1',
                                borderWidth: 1
                              },
                              '&:hover fieldset': { 
                                borderColor: '#0ea5e9',
                              },
                              '&.Mui-focused fieldset': { 
                                borderColor: '#0ea5e9',
                                borderWidth: 2
                              },
                              color: '#1e293b',
                              background: 'white',
                              borderRadius: 1
                            }
                          }, uiLayout.formFieldSx)}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </Grid>

                      {/* أرقام الشرائح */}
                      {phone.simNumbers.map((simNumber, simIndex) => (
                        <Grid item xs={12} key={simIndex}>
                          <TextField InputLabelProps={{ shrink: true }}
                            fullWidth
                            label={`رقم الشريحة ${simIndex + 1} *`}
                            value={simNumber}
                            onChange={(e) => handleSimNumberChange(index, simIndex, e.target.value)}
                            placeholder="05xxxxxxxx"
                            required
                            inputProps={{dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" },
                              maxLength: 10
                            }}
                            error={simNumber && !validateSaudiPhoneNumber(simNumber)}
                            helperText={simNumber && !validateSaudiPhoneNumber(simNumber) ? 
                              "يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" : ""}
                            sx={uiLayout.withUiSx({
                              '& .MuiInputLabel-root': { 
                                color: '#475569',
                                fontWeight: '600'
                              },
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': { 
                                  borderColor: '#cbd5e1',
                                  borderWidth: 1
                                },
                                '&:hover fieldset': { 
                                  borderColor: '#0ea5e9',
                                },
                                '&.Mui-focused fieldset': { 
                                  borderColor: '#0ea5e9',
                                  borderWidth: 2
                                },
                                color: '#1e293b',
                                background: 'white',
                                borderRadius: 1
                              }
                            }, uiLayout.formFieldSx)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" sx={{ 
              mt: 3, 
              borderRadius: 1,
              fontWeight: '600'
            }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <Divider sx={{ bgcolor: '#e2e8f0' }} />

      <DialogActions sx={uiLayout.withUiSx({ 
        p: 3, 
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0'
      }, uiLayout.dialogActionsSx)}>
        <Button
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <SaveIcon />}
          sx={uiLayout.withUiSx({
            minWidth: 250,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 2,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
            },
            '&:disabled': {
              background: '#94a3b8',
              transform: 'none'
            }
          }, uiLayout.buttonSx)}
        >
          {loading ? 'جاري حفظ البيانات...' : 'تسليم البيانات والمتابعة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDataDialog;