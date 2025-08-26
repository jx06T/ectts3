'use client';

import React, { useEffect, useRef } from "react";
import RouterBar from "@/components/Block/RouterBar";
import OtHeader from "@/components/Block/OtHeader";

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
            <RouterBar />
            <div className=" w-full pt-1.5">
                <OtHeader />
                {children}
            </div>
        </div>
    );
}

export default SharedWordLayout;