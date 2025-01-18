import React, { useContext, useState } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { jwtDecode } from 'jwt-decode';
import { FaUser, FaLock } from "react-icons/fa";
import './login.css';
import { useNavigate } from 'react-router-dom';
import { User } from "../Management/UserContext";
import { baseURL, LOGIN } from '../API/Api';
const cookies = new Cookies();
export default function Login() {
    const [usernameValue, setUsernameValue] = useState('');
    const [passwordValue, setPasswordValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const userNow = useContext(User);
    const navigate = useNavigate();

    async function handleSubmit(e) {

        e.preventDefault("");

        if (usernameValue.length < 4) {
            setErrorMessage('Username must be at least 4 characters long.');
            return;
        }
        if (passwordValue.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        const loginData = new URLSearchParams();
        loginData.append('username', usernameValue);
        loginData.append('password', passwordValue);
        try {
            const response = await axios.post(`${baseURL}/${LOGIN}`, loginData);
            if (response.status === 200) {
                const { access_token, refresh_token, token_type } = response.data;

                // Decode the JWT to get the user info
                const decodedToken = jwtDecode(access_token);
                const is_admin = decodedToken.is_admin;

                // Store the tokens
                cookies.remove("refreshToken")
                cookies.set('refreshToken', refresh_token);
                cookies.remove("accessToken")
                cookies.set('accessToken', access_token);
                cookies.set("isAdmin", is_admin)
                userNow.setAuth({ accessToken: access_token, refreshToken: refresh_token, isAdmin: is_admin });

                if (is_admin) {
                    navigate("/dashboard/home");
                } else {
                    navigate("/dashboard/user/home");
                }
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            setErrorMessage('Login failed. Please check your username and password.');
        }
    };

    return (
        <div className='login-page'>
            <div className="wrapper">
                <div className="form-box login">
                    <form onSubmit={handleSubmit}>
                        <h1>Welcome Back</h1>
                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                        <div className='input-box'>

                            <input
                                type="text"

                                id='user'
                                className="input-field"
                                required
                                value={usernameValue}
                                onChange={(e) =>
                                    setUsernameValue(e.target.value)
                                }
                            />
                            <label htmlFor="user" className={`label ${usernameValue !== '' ? ' active' : ''}`}>Username</label>
                            <FaUser className='icon' />
                        </div>
                        <div className='input-box'>

                            <input
                                type="password"

                                id='password'
                                className="input-field"
                                required
                                value={passwordValue}
                                onChange={(e) => setPasswordValue(e.target.value)}
                            />
                            <label htmlFor="password" className={`label ${passwordValue !== '' ? ' active' : ''}`}>Password</label>
                            <FaLock className='icon' />
                        </div>

                        <button type="submit">Login</button>
                    </form>

                </div>
            </div>
        </div>
    );
};
