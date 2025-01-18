import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as FaIcons from "react-icons/fa"
import './search.css';
import { User } from '../Management/UserContext';
import { AUDIO } from '../API/Api';

export default function SearchDetails() {
    const { auth } = useContext(User);
    const location = useLocation();
    const navigate = useNavigate();
    const { res } = location.state || {};
    const [currentPage, setCurrentPage] = useState(1);
    const audioRefs = useRef({});
    const resultsPerPage = 5;

    useEffect(() => {
        // Pause all audio when the page changes
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }, [currentPage]);
    const res_data = res?.file_names || [];
    const similarity_data = res?.result?.map(arr => arr[1]) || [];

    const indexOfLastResult = currentPage * resultsPerPage;
    const indexOfFirstResult = indexOfLastResult - resultsPerPage;
    const currentResults = res_data.slice(indexOfFirstResult, indexOfLastResult);
    const currentSimilarities = similarity_data.slice(indexOfFirstResult, indexOfLastResult);

    const totalPages = Math.ceil(res_data.length / resultsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <header className='res-header'>
                <FaIcons.FaArrowAltCircleLeft className="res-back" onClick={() => {
                    if (auth.isAdmin) {
                        navigate('/dashboard/search')
                    }
                    else { navigate('/dashboard/user/search') }
                }}></FaIcons.FaArrowAltCircleLeft>
            </header>
            <div className='row-container'>
                <div className='res-container'>
                    <div className="results-container">
                        <h3 className="results-title">Results for {res.file_name.replace('.wav', '')} file</h3>
                        {currentResults.length > 0 ? (
                            <div className="results-list">
                                {currentResults.map((result, index) => {
                                    const fileNameWithoutExtension = result.split('/').pop().replace('.wav', '');
                                    const similarity = currentSimilarities[index];
                                    return (
                                        <div key={index} className="result-item">
                                            <p className="res-name">{fileNameWithoutExtension}</p>
                                            <audio
                                                className="audio-player"
                                                controls
                                                ref={el => { audioRefs.current[`result-${index}`] = el; }}
                                                key={`result-${index}-${result}`}
                                            >
                                                <source src={`${AUDIO}/${result.split('/').pop()}`} type="audio/wav" />
                                                Your browser does not support the audio element.
                                            </audio>
                                            <p className="similarity">{similarity.toFixed(2)} %</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="no-results">No results found.</p>
                        )}
                    </div>
                    {totalPages > 1 && (
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
                    )}
                </div>
            </div>
        </>
    );
}
