import React from 'react';
import DashboardHome from '../Components/DashboardHome';
import userImg from "../Assets/user.jpg";

export default function UserHome() {
    const actions = [
        { title: "Upload Files", path: "/dashboard/user/upload", description: "Upload new audio files to the system. Ensure all files are correctly formatted before uploading." },
        { title: "Search Voice Files", path: "/dashboard/user/search", description: "Search for uploaded voice files and get the most similar voices." }
    ];

    return (
        <DashboardHome
            title="Hello, Expert"
            description="Welcome to your dashboard. Here’s what you can do."
            actions={actions}
            imageSrc={userImg}
            imageAlt="User"
        />
    );
};
