import { useParams } from 'react-router-dom';
import Form from '../Components/Forms';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { baseURL, getUSER, USERS } from '../API/Api';

export default function EditUser() {
    const { id } = useParams();
    const [user, setUser] = useState({ user_name: '', is_admin: false });

    useEffect(() => {
        axios.get(`${baseURL}/${USERS}/${getUSER}/${id}`)
            .then(response => {
                setUser(response.data);
            })
            .catch(error => alert("Error fetching user:", error));
    }, [id]);

    return (
        <Form
            title="Edit User"
            endPoint={`update/${id}`}
            button="Update User"
            user_name={user.user_name}
            is_admin={user.is_admin}
            created_at={user.created_at}
            navigate="/dashboard/users"
        />
    );
}
