'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MdiGithub, SolarSiderbarBold } from '@/components/ui/Icons'; // 請確保您的 Icons 路徑正確

/**
 * Sidebar 中的導航項目組件
 */
function NavItem({ label, path, isActive }: { label:string; path:string; isActive:boolean }) {
    return (
        <div className={`cursor-pointer rounded-md ${isActive ? "bg-blue-100/40" : "bg-blue-100"} hover:bg-blue-50 relative h-10 text-base flex items-center my-[2px]`}>
            <Link href={path} className='h-full p-2 overflow-x-hidden w-full flex items-center'>
                {label}
            </Link>
        </div>
    );
}


/**
 * 主要的側邊導航欄組件
 */
export default function RouterBar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // 定義所有頁面連結
    const allPages: { label: string; path: string }[] = [
        { label: 'Home', path: '/' },
        { label: 'Words Sets', path: '/set' },
        { label: 'Profile', path: '/profile' },
        { label: 'General Settings', path: '/general-settings' },
        { label: 'Sets Management', path: '/sets-management' },
        { label: 'Guidance', path: '/guidance' },
        { label: 'Privacy', path: '/privacy' },
        { label: 'Contact Us', path: '/contact' },
    ];

    // 處理點擊側邊欄外部時關閉側邊欄的邏輯
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // 判斷連結是否為當前活動頁面的函數
    const getIsActive = (pagePath: string): boolean => {
        // 對於根路徑，需要完全匹配
        if (pagePath === '/') {
            return pathname === '/';
        }
        // 對於其他路徑，只要開頭匹配即可 (例如 /set 會匹配 /set/123)
        return pathname.startsWith(pagePath);
    };

    return (
        <div ref={sidebarRef} className='sidebar h-full flex z-50'>
            {/* 可展開/收合的側邊欄主體 */}
            <div className={`bg-blue-50 ${isSidebarOpen ? " w-[16.5rem] px-2 p-1" : "min-w-0 w-0 px-0"} fixed xs:static h-full flex flex-col rounded-md transition-all duration-300 ease-in-out shadow-xl`}>
                <div className=' h-8 flex mt-1 items-center justify-between'>
                    <SolarSiderbarBold className=' cursor-pointer text-3xl' onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                </div>

                <hr className=' my-1'></hr>

                {/* 導航項目列表 */}
                <div className={`flex-auto ${isSidebarOpen ? "overflow-y-auto" : "overflow-y-hidden"}`}>
                    {allPages.map((page) =>
                        <NavItem
                            key={page.path}
                            label={page.label}
                            path={page.path}
                            isActive={getIsActive(page.path)}
                        />
                    )}
                </div>

                {/* 頁腳資訊，僅在側邊欄展開時顯示 */}
                {isSidebarOpen && (
                    <div className=' z-30 mt-1 h-10 p-1 flex items-center'>
                        <a href='https://github.com/jx06T/ectts_2.0' target='_blank' rel="noopener noreferrer">
                            <MdiGithub className=' text-3xl' />
                        </a>
                        <span className='ml-2 text-xs text-slate-300'>2.2.5 - jx06T</span>
                    </div>
                )}
            </div>

            {/* 側邊欄收合時顯示的按鈕 */}
            <div className={`bg-transparent absolute flex flex-col justify-between transition-opacity ${isSidebarOpen ? " opacity-0 pointer-events-none" : " opacity-100 w-11 pl-2 p-1 "}`}>
                <div className=' h-8 flex mt-1 items-center'>
                    <SolarSiderbarBold className=' text-3xl cursor-pointer' onClick={() => setIsSidebarOpen(true)} />
                </div>
            </div>
        </div>
    );
}