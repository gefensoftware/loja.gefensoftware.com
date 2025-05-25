import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '../store/auth';

const PrivateRoute = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;