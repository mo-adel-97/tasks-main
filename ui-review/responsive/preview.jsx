import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../../src/theme';
import NavigationShell from '../../src/components/NavigationShell';
import HrLeavesPage from '../../src/pages/HrLeavesPage';
import HrEmployeesPage from '../../src/pages/HrEmployeesPage';
import AdmissionRequestsReport from '../../src/pages/AdmissionRequestsReport';
import BranchesDashboard from '../../src/components/BranchesDashboard';
import RefundRequestDialog from '../../src/components/RefundRequestDialog';
import '../../src/index.css';

const employee={employeeGuid:'fixture',employeeCode:416,fullName:'موظف اختبار باسم عربي طويل',nationalId:'1234567890',mobile:'0501234567',branchGuid:'branch',branchName:'فرع الدمام حي الزهور',departmentName:'الإشراف العام',jobTitle:'مشرف إداري',isActive:true};
localStorage.setItem('user',JSON.stringify({guid:'fixture',fullName:'مستخدم تجريبي',userName:'fixture'}));
localStorage.setItem('token','fixture');
window.fetch=async (input,init={})=>{
  if(init.method && init.method!=='GET') throw new Error('Visual fixture does not permit writes');
  const url=String(input);let result={data:[],employees:[employee],leaveTypes:[],branches:[{guid:'branch',name:'فرع الدمام'}]};
  if(url.includes('BranchBocketMoney')) result=[{brEName:'فرع الدمام حي الزهور مدينة الأعمال',students_Case1:123,students_Case2:45,daen_Case1:34567,daen_Case2:8765}];
  if(url.includes('/hr/employees?')||url.endsWith('/hr/employees')) result={data:[employee]};
  if(url.includes('admission-requests-report'))result={data:{rows:[{Code:123,StudentName:'طالب اختبار باسم عربي طويل',NationalId:'1234567890',StudentTel:'0501234567',FullName:'موظف التسجيل',ORDERSTAUT:'جديد',BatchName:'دفعة التدريب',SalesNotes:'ملاحظات لاختبار العرض'}]}};
  if(url.includes('screen-access'))result={allowed:true};
  return {ok:true,status:200,json:async()=>result,text:async()=>JSON.stringify(result)};
};
const view=new URLSearchParams(location.search).get('page')||'leaves';
const pages={leaves:<HrLeavesPage/>,employees:<HrEmployeesPage/>,admissions:<AdmissionRequestsReport/>,branches:<NavigationShell><BranchesDashboard/></NavigationShell>,refund:<RefundRequestDialog open student={{studentName:'طالب اختبار',nationalId:'1234567890',studentTel:'0501234567'}} apiBaseUrl="/api" onClose={()=>{}}/>};
createRoot(document.getElementById('root')).render(<MemoryRouter><ThemeProvider theme={theme}><CssBaseline/>{pages[view]}</ThemeProvider></MemoryRouter>);
