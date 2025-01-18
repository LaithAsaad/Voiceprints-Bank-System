import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./search.css"
import Cookies from 'universal-cookie';
import * as TbIcons from "react-icons/tb";
import Header from '../Components/Header';
import Navbar from '../Components/Navbar';
import { AUDIO, baseURL, RECORD, SEARCH } from '../API/Api';

const cookies = new Cookies();

export default function Search() {
    const [data, setData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [filesPerPage] = useState(3);
    const navigate = useNavigate();

    const access_token = cookies.get("accessToken");

    useEffect(() => {
        fetch(`${baseURL}/${RECORD}/${SEARCH}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(newData => setData(newData))
            .catch(error => alert('Error fetching data:', error));
    }, []);

    // Pagination logic
    const indexOfLastFile = currentPage * filesPerPage;
    const indexOfFirstFile = indexOfLastFile - filesPerPage;
    const currentFiles = Object.keys(data).slice(indexOfFirstFile, indexOfLastFile);

    const totalPages = Math.ceil(Object.keys(data).length / filesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleDetailClick = (key) => {
        const fileData = data[key];
        // Navigate 
        navigate('/res', { state: { res: fileData } });
    };


    return (
        <>
            <Header />
            <Navbar />
            <div className='row-container'>
                <div className='main-container'>

                    <div className="results-container">
                        <h1 className='results-title'>Search Results</h1>
                        <div className="results-list">
                            {currentFiles.map((key) => (

                                <div key={key} className="result-item">

                                    <span className="res-name">{key.replace('.wav', '')}</span>
                                    <audio className='audio-player audio' controls>
                                        <source src={`${AUDIO}/${key}`} type="audio/wav" />
                                        Your browser does not support the audio element.
                                    </audio>
                                    <TbIcons.TbListDetails
                                        className="detail-icon"
                                        onClick={() => handleDetailClick(key)}
                                    />

                                </div>
                            ))}

                            <div className="pagination">
                                {[...Array(totalPages).keys()].map((index) => (
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
                </div>
            </div>
        </>
    );
}