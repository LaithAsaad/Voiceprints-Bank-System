import React from 'react';
import DashboardHome from '../Components/DashboardHome';
import adminImg from "../Assets/admin.jpg";

export default function AdminHome() {
    const actions = [
        { title: "Manage Users", path: "/dashboard/users", description: "You can add, edit, or delete users in the system. This ensures that only authorized personnel have access to the system." },
        { title: "Control System", path: "/dashboard/settings", description: "Manage the operational status of the system. Use the buttons to start or stop the system." },
        { title: "Upload Files", path: "/dashboard/upload", description: "Upload new audio files to the system. Ensure all files are correctly formatted before uploading." },
        { title: "Search Voice Files", path: "/dashboard/search", description: "Search for uploaded voice files and get the most similar voices." }
    ];

    return (
        <DashboardHome
            title="Hello, Admin"
            description="Welcome to your dashboard. Here’s what you can do."
            actions={actions}
            imageSrc={adminImg}
            imageAlt="Admin Dashboard"
        />
    );
};
