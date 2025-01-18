import React from 'react';
import './dashboardHome.css';
import Header from '../Components/Header';
import Navbar from '../Components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function DashboardHome({ title, description, actions, imageSrc, imageAlt }) {
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <Navbar />
            <div className='row-container'>
                <div className="admin-dashboard">
                    <div className="admin-header">
                        <div className="admin-greeting">
                            <h1>{title}</h1>
                            <p>{description}</p>
                        </div>
                    </div>

                    <section className="admin-functions">
                        <h2>Your Dashboard Capabilities</h2>
                        <div className="function-list">
                            {actions.map((action, index) => (
                                <div
                                    key={index}
                                    className="function-item"
                                    onClick={() => navigate(action.path)}
                                >
                                    <h3>{action.title}</h3>
                                    <p>{action.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <div className="admin-image">
                    <img src={imageSrc} alt={imageAlt} />
                </div>
            </div>
        </>
    );
};