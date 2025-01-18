import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as FaIcons from "react-icons/fa";
import './landing.css';
import gsap from 'gsap';

export default function Landing() {
    const overlayPath = useRef(null);
    const navigate = useNavigate();
    const paths = {
        step1: {
            unfilled: 'M 0 0 h 0 c 0 50 0 50 0 100 H 0 V 0 Z',
            inBetween: 'M 0 0 h 43 c -60 55 140 65 0 100 H 0 V 0 Z',
            filled: 'M 0 0 h 100 c 0 50 0 50 0 100 H 0 V 0 Z',
        },
        step2: {
            filled: 'M 100 0 H 0 c 0 50 0 50 0 100 h 100 V 50 Z',
            inBetween: 'M 100 0 H 50 c 28 43 4 81 0 100 h 50 V 0 Z',
            unfilled: 'M 100 0 H 100 c 0 50 0 50 0 100 h 0 V 0 Z',
        }
    };

    useEffect(() => {
        if (overlayPath.current) {
            const pageSwitchTimeline = gsap.timeline({
                paused: true,
                onComplete: () => {
                    navigate('/login');
                }
            })
                .set(overlayPath.current, {
                    attr: { d: paths.step1.unfilled }
                })
                .to(overlayPath.current, {
                    duration: 0.8,
                    ease: 'power3.in',
                    attr: { d: paths.step1.inBetween }
                })
                .to(overlayPath.current, {
                    duration: 0.2,
                    ease: 'power1',
                    attr: { d: paths.step1.filled }
                })
                .set(overlayPath.current, {
                    attr: { d: paths.step2.filled }
                })
                .to(overlayPath.current, {
                    duration: 0.2,
                    ease: 'sine.in',
                    attr: { d: paths.step2.inBetween }
                })
                .to(overlayPath.current, {
                    duration: 1,
                    ease: 'power4',
                    attr: { d: paths.step2.unfilled }
                });

            overlayPath.current.pageSwitchTimeline = pageSwitchTimeline;
        }
    }, [navigate]);

    const reveal = () => {
        if (overlayPath.current?.pageSwitchTimeline) {
            overlayPath.current.pageSwitchTimeline.play(0);
        }
    };

    return (
        <div className='landing-wrapper'>
            <main>
                <div className="view view--1">
                    <div className='landing-container'>
                        <p className='landing-p'>Welcome to</p>
                        <div class="text">Voiceprints Bank</div>
                        <p className='landing-p'>System</p>
                        <button className="landing-button" aria-label="Open other view" onClick={reveal}>
                            GetStarted
                            <FaIcons.FaArrowRight />
                        </button>
                    </div>
                    <svg className="overlay" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path ref={overlayPath} className="overlay__path" vectorEffect="non-scaling-stroke" d="M -100 0 H 0 V 100 H -100 Z" />
                    </svg>
                </div>
            </main>
        </div>
    );
}
