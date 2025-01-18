import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../AdminDashboard/controlUser.css';
import { baseURL, USERS } from '../API/Api';

export default function Form(props) {
    const [formData, setFormData] = useState({
        user_name: props.user_name || '',
        password: '',
        is_admin: props.is_admin || false,
        created_at: props.created_at || null
    });
    const [error, setError] = useState(null);
    const [accept, setAccept] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setFormData(prevData => ({
            ...prevData,
            user_name: props.user_name || '',
            is_admin: props.is_admin || false,
            ...(props.created_at && { created_at: props.created_at })
        }));
    }, [props.user_name, props.is_admin, props.created_at]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (e) => {
        setFormData(prevData => ({
            ...prevData,
            is_admin: e.target.checked,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAccept(true);

        // Basic validation
        if (formData.user_name === '' || formData.password.length < 8) {
            return;
        }

        try {
            // Prepare the data to be sent
            const dataToSend = {
                user_name: formData.user_name,
                password: formData.password,
                is_admin: formData.is_admin,
                ...(formData.created_at && { created_at: formData.created_at })
            };

            const response = await axios.post(
                `${baseURL}/${USERS}/${props.endPoint}`,
                dataToSend
            );

            if (response.status === 200 || response.status === 201) {
                navigate(props.navigate || '/dashboard/users');
            }
        } catch (error) {
            setError("Failed to submit the form.");
        }
    };

    return (
        <div className="edit-user-page">
            <div className="edit-wrapper">
                <div className="edit-form-box">
                    <form onSubmit={handleSubmit}>
                        <h1>{props.title}</h1>
                        {error && <p className="error-message">{error}</p>}
                        <div className="edit-input-box">
                            <label htmlFor="user_name">User Name:</label>
                            <input
                                type="text"
                                id="user_name"
                                name="user_name"
                                placeholder="User Name.."
                                value={formData.user_name}
                                onChange={handleInputChange}
                                required
                                className="edit-input-field"
                            />
                            {formData.user_name === '' && accept && <p className="error-message">User Name is Required</p>}
                        </div>
                        <div className="edit-input-box">
                            <label htmlFor="password">Password:</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Password.."
                                value={formData.password}
                                onChange={handleInputChange}
                                className="edit-input-field"
                            />
                            {formData.password.length < 5 && accept && <p className="error-message">Password should be at least 5 characters</p>}
                        </div>
                        <div className="edit-input-box">
                            <input
                                type="checkbox"
                                id="is_admin"
                                name="is_admin"
                                checked={formData.is_admin}
                                onChange={handleCheckboxChange}
                                className="edit-checkbox"
                            />
                            <label htmlFor="is_admin" className="edit-checkbox-label">Is Admin</label>
                        </div>
                        <button type="submit" className="edit-button">{props.button}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}