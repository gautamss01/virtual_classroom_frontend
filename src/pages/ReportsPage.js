import React from 'react';
import { useParams } from 'react-router-dom';
import ReportPage from '../components/ReportPage';

const ReportsPage = () => {
  const { roomId } = useParams();
  
  return <ReportPage />;
};

export default ReportsPage; 