import React, { useState } from 'react';
import './multiFileUploader.css';
import Cookies from 'universal-cookie';
import UploadPhoto from '../Assets/upload.jpg';
import Header from '../Components/Header';
import Navbar from '../Components/Navbar';
import { baseURL, RECORD, uploadFILES } from '../API/Api';

const cookies = new Cookies();
export default function MultiFileUploader() {
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('initial');

    const handleFileChange = (e) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(file =>
                file.name.endsWith('.wav')
            );
            setFiles(selectedFiles);
            setStatus('initial');
        }
    };

    const handleUpload = async () => {
        if (files.length > 0) {
            setStatus('uploading');
            const accessToken = cookies.get('accessToken');
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });

            try {
                const response = await fetch(`${baseURL}/${RECORD}/${uploadFILES}`, {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    },
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    setStatus('success');
                } else {
                    throw new Error('Network response was not ok.');
                }
            } catch (error) {
                setStatus('fail');
            }
        } else {
            setStatus('fail');
            alert('Please select files.');
        }
    };

    return (
        <>
            < Header />
            < Navbar />
            <div className='row-container upload-container'>
                <div className="uploader-page-container">
                    <label htmlFor="file-input" className="upload-label">
                        <img src={UploadPhoto} alt="Upload" className="upload-image" />
                    </label>
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".wav"
                        onChange={handleFileChange}
                        className="upload-file-input"
                    />
                    <div className="file-details">
                        <p>{files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}</p>
                        <ul>
                            {files.slice(0, 5).map((file, index) => (
                                <li key={index}>{file.name}</li>
                            ))}
                            {files.length > 5 && (
                                <li>And {files.length - 5} more...</li>
                            )}
                        </ul>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleUpload();
                        }}
                        className="upload-form"
                    >
                        <button type="submit" className="upload-button">
                            Upload Files
                        </button>
                    </form>

                    <Result status={status} />
                </div>
            </div>
        </>
    );
};

const Result = ({ status }) => {
    if (status === 'success') {
        return <p className="upload-result success">✅ Files uploaded successfully!</p>;
    } else if (status === 'fail') {
        return <p className="upload-result fail">❌ File upload failed!</p>;
    } else if (status === 'uploading') {
        return <p className="upload-result uploading">⏳ Uploading files...</p>;
    } else {
        return null;
    }
};
