import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { User } from './UserContext';

export default function ProtectedRoute({ isAdminRoute }) {
    const { auth } = useContext(User);

    if (!auth.accessToken) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" />;
    }

    if (isAdminRoute && !auth.isAdmin) {
        // Redirect to dashboard if not admin
        return <Navigate to="/dashboard/user" />;
    }

    if (!isAdminRoute && auth.isAdmin) {
        // Redirect to admin dashboard if admin tries to access user dashboard
        return <Navigate to="/dashboard" />;
    }

    // Render the route if authenticated and authorized
    return <Outlet />;
}