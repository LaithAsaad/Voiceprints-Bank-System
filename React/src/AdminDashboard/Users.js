import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { FaPenSquare, FaPlus, FaTrash } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { User } from "../Management/UserContext";
import { baseURL, USERS, getUSERS, DELETE } from "../API/Api"
import Cookies from "universal-cookie";
import Swal from 'sweetalert2';

const cookies = new Cookies();

export default function Users() {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    const context = useContext(User);
    const accessToken = cookies.get('accessToken');
    const token = accessToken;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${baseURL}/${USERS}/${getUSERS}`, {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUsers(response.data);
            } catch (error) {
                alert("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, [users, token]);

    const deleteUser = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(`${baseURL}/${USERS}/${DELETE}/${id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (res.status === 200) {
                        setUsers(users.filter(user => user.id !== id));
                        setCurrentPage(1);
                        Swal.fire(
                            'Deleted!',
                            'The user has been deleted.',
                            'success'
                        );
                    }
                } catch (error) {
                    Swal.fire(
                        'Error!',
                        'There was a problem deleting the user.',
                        'error'
                    );
                }
            }
        });
    };

    // Pagination Logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(users.length / usersPerPage);

    return (
        <div className="table-container">
            <div className="table-wrapper">
                <div className="user-header">
                    <h1>Users</h1>
                    <Link to="add" className="add-user-button">
                        <FaPlus className="add-icon" /> Add New User
                    </Link>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>User Name</th>
                            <th>Is Admin</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map((user, index) => (
                            <tr key={user.id}>
                                <td>{index + 1 + indexOfFirstUser}</td>
                                <td>{user.user_name}</td>
                                <td>{user.is_admin ? 'Yes' : 'No'}</td>
                                <td>
                                    <Link to={`${user.id}`}>
                                        <FaPenSquare className="icon edit-icon" />
                                    </Link>
                                    <FaTrash
                                        onClick={() => deleteUser(user.id)}
                                        className="icon delete-icon"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
