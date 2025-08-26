'use client';

import React, { useEffect, useRef } from "react";
import Sidebar from "@/components/Block/Sidebar";

function SharedWordLayout({ children }: { children: React.ReactNode }) {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (rootRef.current) {
                rootRef.current.style.height = `${window.innerHeight}px`;
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div ref={rootRef} className="word-layout flex">
            <Sidebar />
            {children}
        </div>
    );
}

export default SharedWordLayout;