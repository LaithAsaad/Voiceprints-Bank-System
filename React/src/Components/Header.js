import React from 'react'
import "./Navbar.css"
import Cookies from 'universal-cookie'
import { useNavigate } from 'react-router-dom';

const cookies = new Cookies();
export default function Header() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        cookies.remove('refreshToken');
        cookies.remove('accessToken');
        cookies.remove('isAdmin');
        navigate("/login")

    }
    return (
        <header>
            <button type='submit' className='logout-button' onClick={handleLogout}>Logout</button>
        </header>
    )
}
