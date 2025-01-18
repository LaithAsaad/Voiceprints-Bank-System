import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import { User } from './UserContext';
import { Outlet, Navigate } from 'react-router-dom';
import Loading from '../Components/Loading';

const cookies = new Cookies();

export default function PersistLogin() {
    const { auth, setAuth } = useContext(User);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            const accessToken = cookies.get('accessToken');
            const refreshToken = cookies.get('refreshToken');
            const isAdmin = cookies.get('isAdmin');

            if (accessToken && refreshToken) {
                setAuth({
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    isAdmin: Boolean(isAdmin)
                });
            }

            setLoading(false);
        };

        initializeAuth();
    }, [setAuth]);

    if (loading) {
        return <Loading />;
    }

    return auth.accessToken ? <Outlet /> : <Navigate to="/login" />;
}
