import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Classroom from '../components/Classroom';

const ClassroomPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role');

    if (!storedUserId || !storedRole) {
      navigate('/');
      return;
    }

    setUserId(storedUserId);
    setRole(storedRole);
  }, [navigate]);

  if (!userId || !role) {
    return <div>Loading...</div>;
  }

  return <Classroom userId={userId} role={role} />;
};

export default ClassroomPage; 