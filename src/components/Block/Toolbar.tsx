'use client';

import React from 'react';
import {
    TablerEyeClosed, MaterialChecklistRtl, MdiDice5, MaterialLock,
    MaterialLockOpen, PhSelectionBold, PhSelectionDuotone, BxBxsShow
} from '@/components/ui/Icons';
import { useStateContext } from '@/context/StateContext';
import { useNotify } from '@/context/NotifyContext';

interface ToolbarProps {
    setWords: React.Dispatch<React.SetStateAction<Word[]>>;
}

export default function Toolbar({ setWords }: ToolbarProps) {
    const { state, setState } = useStateContext(); // 用於修改全域 state
    const { popNotify } = useNotify();

    const handleSelectAll = () => {
        const shouldSelectAll = state.selection !== 1;
        popNotify(shouldSelectAll ? 'All selected' : 'None selected');
        
        setState(s => ({ ...s, selection: shouldSelectAll ? 1 : -1 }));
        
        setWords(prev => prev.map(word => ({ ...word, selected: shouldSelectAll })));
    };

    const toggleAndNotify = (key: keyof typeof state, trueMsg: string, falseMsg: string) => {
        const newValue = !state[key];
        popNotify(newValue ? trueMsg : falseMsg);
        setState(s => ({ ...s, [key]: newValue }));
    };

    return (
        <div className='tool-icon-div flex justify-start xs:justify-center space-x-3 ml-2'>
            <button className='cursor-pointer w-10 h-10' onClick={() => toggleAndNotify('showE', 'Show English', 'Hide English')}>
                {state.showE ? <BxBxsShow className='text-2xl' /> : <TablerEyeClosed className='text-2xl' />}
            </button>
            <button className='cursor-pointer w-10 h-10' onClick={() => toggleAndNotify('showC', 'Show Chinese', 'Hide Chinese')}>
                {state.showC ? <BxBxsShow className='text-2xl' /> : <TablerEyeClosed className='text-2xl' />}
            </button>
            <button className='cursor-pointer w-10 h-10' onClick={() => toggleAndNotify('lock', 'Unlocked', 'Locked')}>
                {state.lock ? <MaterialLockOpen className='text-2xl' /> : <MaterialLock className='text-2xl' />}
            </button>
            <button className='cursor-pointer w-10 h-10' onClick={handleSelectAll}>
                {state.selection === 1 ? <PhSelectionBold className='text-2xl' /> : <PhSelectionDuotone className='text-2xl' />}
            </button>
            <button className='cursor-pointer w-10 h-10' onClick={() => toggleAndNotify('rand', 'Random mode', 'Normal mode')}>
                <MdiDice5 className={`text-2xl ${state.rand ? "text-green-700" : ""}`} />
            </button>
            <button className='cursor-pointer w-10 h-10' onClick={() => toggleAndNotify('onlyPlayUnDone', 'Only play undone', 'Play all selected')}>
                <MaterialChecklistRtl className={`text-2xl ${state.onlyPlayUnDone ? "text-green-700" : ""}`} />
            </button>
        </div>
    );
}