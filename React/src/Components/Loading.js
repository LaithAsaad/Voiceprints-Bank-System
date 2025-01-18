import React from 'react'
import "./loading.css"
export default function Loading() {
    return (
        <div className='center'>
            <div className='ring'></div>
            <span className='loading-span'>loading...</span>
        </div>
    )
}