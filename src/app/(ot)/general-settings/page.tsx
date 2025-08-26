'use client';

import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import breaks from 'remark-breaks';

// --- 自訂組件與 Hook ---
import CustomSelect from '@/components/ui/Select';
import { useSpeech } from '@/utils/Speech'; // 匯入您提供的 useSpeech Hook

// --- 圖示 ---
// 假設您的圖示庫中有這個組件
import { MingcuteVolumeLine } from '@/components/ui/Icons';

export default function General() {
  // 從您的 useSpeech Hook 中獲取所有需要的狀態和功能
  const {
    voices,
    speakerE,
    speakerC,
    speakE,
    speakC,
    setSpeakerE,
    setSpeakerC
  } = useSpeech();

  // 使用 useMemo 來過濾和映射語音選項，避免在每次渲染時都重新計算
  const englishVoiceOptions = useMemo(() => {
    // 優先顯示英文語音，如果沒有則顯示所有
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    return (enVoices.length > 0 ? enVoices : voices)
      .map(e => ({ value: e.name, label: `${e.name} (${e.lang})` }));
  }, [voices]);

  const chineseVoiceOptions = useMemo(() => {
    // 優先顯示中文語音，如果沒有則顯示所有
    const zhVoices = voices.filter(v => v.lang.startsWith('zh'));
    return (zhVoices.length > 0 ? zhVoices : voices)
      .map(e => ({ value: e.name, label: `${e.name} (${e.lang})` }));
  }, [voices]);

  // --- **關鍵修改 1: onChange 處理函數的簽名** ---
  // CustomSelect 的 onChange 回調直接傳遞 string 類型的值，而不是 option 物件
  const handleEToneSelect = useCallback((value: string) => {
    if (value) {
      setSpeakerE(value);
    }
  }, [setSpeakerE]);

  const handleCToneSelect = useCallback((value: string) => {
    if (value) {
      setSpeakerC(value);
    }
  }, [setSpeakerC]);

  return (
    <div className='home h-full w-full space-y-3 overflow-y-auto px-4 sm:px-16'>
      <h1 className=' mt-3 w-full text-center text-2xl'>General Settings</h1>
      <hr className=' black w-full' />
      <div className=''>
        <h1 className=' w-full text-xl'>{"<Tone Settings>"}</h1>
        <h2 className=' mt-1 text-lg'>English
          <button
            className=' ml-2 align-text-bottom'
            onClick={() => speakE("The quick brown fox jumps over the lazy dog")}
            disabled={!speakerE} // 如果沒有選中 speaker，則禁用按鈕
          >
            <MingcuteVolumeLine className={`text-2xl ${!speakerE ? 'text-gray-400' : ''}`} />
          </button>
        </h2>
        {/* 
                  因為 CustomSelect 內部會清空輸入框，
                  所以我們不在 h3 中顯示 speakerE，而是直接將其用作 placeholder。
                  這樣既能顯示當前值，又不影響搜索功能。
                */}
        <CustomSelect
          options={englishVoiceOptions}
          // --- **關鍵修改 2: 使用 placeholder 顯示當前值** ---
          placeholder={speakerE || "Select an English voice..."}
          onChange={handleEToneSelect}
          // initialValue 保持為空，因為 placeholder 已經負責顯示
          initialValue=""
          maxH={200}
        />

        <h2 className=' mt-3 text-lg'>Chinese
          <button
            className=' ml-2 align-text-bottom'
            onClick={() => speakC("快速的棕色狐狸跳過了懶狗")}
            disabled={!speakerC}
          >
            <MingcuteVolumeLine className={`text-2xl ${!speakerC ? 'text-gray-400' : ''}`} />
          </button>
        </h2>
        <CustomSelect
          options={chineseVoiceOptions}
          placeholder={speakerC || "Select a Chinese voice..."}
          onChange={handleCToneSelect}
          initialValue=""
          maxH={200}
        />
      </div>

      <div className=' md'>

        <ReactMarkdown remarkPlugins={[breaks]} >
          {`
## 3.0 版預計功能
- 朗讀順序
- 匯出匯入格式
`
          }
        </ReactMarkdown>
      </div>
    </div>
  );
}