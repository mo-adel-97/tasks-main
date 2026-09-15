import React from 'react';
import { useMediaQuery } from '@mui/material';
import { SIDEBAR_DESKTOP_QUERY, SIDEBAR_WIDTH } from '../../src/config/sidebarLayout';
export default function SidebarFixture(){const desktop=useMediaQuery(SIDEBAR_DESKTOP_QUERY);return desktop?<aside style={{position:'fixed',insetInlineStart:0,top:0,bottom:0,width:SIDEBAR_WIDTH,background:'#034d31',color:'white',padding:12,boxSizing:'border-box'}}>قائمة التنقل — عينة عرض</aside>:null;}
