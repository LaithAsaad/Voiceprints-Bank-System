import React, { useEffect, useState } from 'react';
import './folderSelector.css';
import Header from '../Components/Header';
import Navbar from '../Components/Navbar';
import folderimg from '../Assets/folder.jpg';
import axios from 'axios';
import { baseURL, FOLDERS, INIT, RECORD, runTHREADS, SETTINGS, stopTHREADS } from '../API/Api';

export default function FolderSelector() {
    const [folderPath1, setFolderPath1] = useState('');
    const [folderPath2, setFolderPath2] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [folders, setFolders] = useState([]);
    const [activeFolderSetter, setActiveFolderSetter] = useState(null);
    const [topK, setTopK] = useState(10);
    const [similarity, setSimilarity] = useState(false);
    const [reindexingMethod, setReindexingMethod] = useState('time');
    const [reindexingValue, setReindexingValue] = useState(30);
    const [maxRecords, setMaxRecords] = useState(20);
    const [buttonText, setButtonText] = useState('Start');
    const [buttonColor, setButtonColor] = useState('#0056b3');
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${baseURL}/${RECORD}/${SETTINGS}`);
                if (response.status === 200) {
                    const settings = response.data;
                    setFolderPath1(settings.files_folder);
                    setFolderPath2(settings.search_folder);
                    setTopK(settings.top_k);
                    setSimilarity(settings.is_similarity);
                    setReindexingMethod(settings.reindex_method);
                    setReindexingValue(settings.reindex_value);
                    setMaxRecords(settings.maximum_number);
                    updateButtonState(settings.files_folder, settings.search_folder);
                    setButtonText('Stop');
                    setButtonColor('gray');
                    setIsRunning(true);
                }
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    alert("Failed to load settings from server.");
                }
            }
        };

        fetchSettings();
    }, []);

    const fetchFolders = async () => {
        try {
            const response = await fetch(`${baseURL}/${RECORD}/${FOLDERS}`);
            const data = await response.json();
            setFolders(data.folders);
        } catch (error) {
            alert("Failed to fetch folders", error);
        }
    };


    const updateButtonState = (path1, path2) => {
        setButtonDisabled(path1 === '' || path2 === '');
    };

    useEffect(() => {
        updateButtonState(folderPath1, folderPath2);
    }, [folderPath1, folderPath2]);


    const handleFolderClick = (setFolderPath) => {
        setActiveFolderSetter(() => setFolderPath);
        fetchFolders();
        setShowPopup(true);
    };

    const handleFolderSelect = (folderName) => {
        if (activeFolderSetter) {
            activeFolderSetter(folderName);
        }
        setShowPopup(false);
    };

    const initializeServer = async () => {
        try {
            const response = await axios.post(`${baseURL}/${RECORD}/${INIT}`, {
                folder_name: folderPath1,
                search_folder_name: folderPath2,
                top_k: topK,
                is_similarity: similarity,
                reindexing_method: reindexingMethod,
                reindexing_value: reindexingValue,
                maximum_number: maxRecords

            });
            if (response.status === 201) {

                try {
                    const res = await axios.post(`${baseURL}/${RECORD}/${runTHREADS}`);
                    if (res.status === 200) {
                        setButtonText('Stop');
                        setButtonColor('gray');
                        setIsRunning(true);
                    }
                }
                catch (err) {
                    alert("Failed to initialize server.........");
                }
            }
        } catch (error) {
            alert("Failed to initialize server");
        }
    };

    const stopServer = async () => {
        try {
            const response = await axios.post(`${baseURL}/${RECORD}/${stopTHREADS}`);
            if (response.status === 200) {
                setButtonText('Start');
                setButtonColor('#0056b3');
                setIsRunning(false);
            }
        } catch (error) {
            alert("Failed to stop server");
        }
    };

    const handleButtonClick = () => {
        if (isRunning) {
            stopServer();
        } else {
            initializeServer();
        }
    };


    return (
        <>
            <Header />
            <Navbar />
            <div className="row-container init-container">
                <div className='first-row'>
                    <div className="select-section">
                        <div className="select-section-title">Select WAV'S Folder</div>
                        <div className='align-row'>
                            <img src={folderimg} alt="Folder 1 Icon" className="select-folder-icon" onClick={() => handleFolderClick(setFolderPath1)} />
                            <span className="selectFolderPath">{folderPath1}</span>
                        </div>
                    </div>

                    <div className="select-section">
                        <div className="select-section-title">Select Search Folder</div>
                        <div className='align-row'>
                            <img src={folderimg} alt="Folder 2 Icon" className="select-folder-icon" onClick={() => handleFolderClick(setFolderPath2)} />
                            <span className="selectFolderPath">{folderPath2}</span>
                        </div>
                    </div>
                    <div className="select-section">
                        <div className="select-input-group">

                            <label className="select-section-title">Enter the number of top results to retrieve</label>
                            <div className='align'>
                                <input
                                    type="number"
                                    value={topK}
                                    onChange={(e) => setTopK(e.target.value)}
                                    className="select-input"
                                />
                            </div>
                            <div className="description">The number of results for each search request</div>
                        </div>
                    </div>
                </div>
                <div className='first-row'>
                    <div className="select-section">
                        <div className="select-section-title">Reindexing Settings</div>

                        <div className="select-input-group">
                            <label className="select-label">Select the method used for reindexing</label>
                            <div className='align'>
                                <select
                                    value={reindexingMethod}
                                    onChange={(e) => setReindexingMethod(e.target.value)}
                                    className="select"
                                >
                                    <option value="time">Time</option>
                                    <option value="file_count">File Count</option>
                                </select>
                            </div>

                        </div>

                        <div className="select-input-group">
                            <label className="select-label">Specify the value for the reindexing method selected above</label>
                            <div className='align'>
                                <input
                                    type="number"
                                    placeholder="Enter reindexing value"
                                    value={reindexingValue}
                                    onChange={(e) => setReindexingValue(e.target.value)}
                                    className="select-input"
                                />
                            </div>
                            <div className="description">Example: 30 minutes for time, 1000 files for file count</div>
                        </div>

                    </div>
                    <div className="select-section">
                        <div className="select-section-title">System Details</div>
                        <div className="select-input-group">
                            <label className="select-label">Click to run the system:</label>
                            <div className='align'>
                                <button className='start-button' style={{ backgroundColor: buttonColor }} disabled={buttonDisabled} onClick={handleButtonClick}>
                                    {buttonText}
                                </button>
                            </div>
                            <div className="description">Three threads will start immediately:
                                <div className='more-description'>First : proccess the files and save it's details in database</div>
                                <div className='more-description'>Second : search about files in database</div>
                                <div className='more-description'>Third : reindex and clustering for better results</div>

                            </div>
                        </div>
                    </div>
                    <div className="select-section">
                        <div className="select-section-title">Similarity Settings</div>
                        <div className="select-input-group">
                            <label className="select-label">Similarity Function:</label>
                            <div className='align'>
                                <select
                                    value={similarity}
                                    onChange={(e) => setSimilarity(e.target.value)}
                                    className="select"
                                >
                                    <option value={true}>Cosine Similarity</option>
                                    <option value={false}>Euclidean Distance</option>
                                </select>
                            </div>

                        </div>
                        <div className="select-input-group">
                            <label className="select-label">Maximum number of vectors for each person</label>
                            <div className='align'>
                                <input
                                    type="number"
                                    placeholder="Enter maximum value"
                                    value={maxRecords}
                                    onChange={(e) => setMaxRecords(e.target.value)}
                                    className="select-input"
                                />
                            </div>
                            <div className="description">Other person vectors will be deleted</div>
                        </div>
                    </div>
                </div>
            </div>
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>Select a Folder</h3>
                        <ul className="folder-list">
                            {folders.map((folder, index) => (
                                <li key={index} onClick={() => handleFolderSelect(folder)}>
                                    {folder}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setShowPopup(false)} className="close-button">Close</button>
                    </div>
                </div>
            )}
        </>
    );
}
