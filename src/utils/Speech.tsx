'use client';
import { useState, useCallback, useEffect } from 'react';

// --- Types Definition ---

type VoiceSettings = {
    speakerE?: string;
    speakerC?: string;
};

// 新增的朗讀選項 Type
export type SpeakOptions = {
    rate?: number;
    pitch?: number;
};

type VoiceChangeListener = () => void;


// --- Speech Service (Singleton) ---

class SpeechService {
    private static instance: SpeechService;
    public readonly synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private speakerE: string = "";
    private speakerC: string = "";
    private initialized: boolean = false;
    private voiceChangeListeners: VoiceChangeListener[] = [];

    // 統一管理 LocalStorage 的鍵名
    private static readonly STORAGE_KEY = 'ectts-voice-settings';

    private constructor() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.synth = window.speechSynthesis;
        } else {
            // 在 SSR 或不支援的環境下提供一個 mock 物件，避免錯誤
            this.synth = {} as SpeechSynthesis;
            console.warn('SpeechSynthesis API is not available.');
        }
    }

    public static getInstance(): SpeechService {
        if (!SpeechService.instance) {
            SpeechService.instance = new SpeechService();
        }
        return SpeechService.instance;
    }

    public initialize() {
        if (this.initialized || typeof window === 'undefined' || !window.speechSynthesis) {
            return;
        }

        const loadVoices = () => {
            const newVoices = this.synth.getVoices();
            if (newVoices.length === 0) return; // 如果語音尚未載入，則稍後再試

            this.voices = newVoices;

            // 1. 設置預設語音（如果尚未設定）
            this.setDefaultSpeakers();
            
            // 2. 從 localStorage 載入用戶儲存的設定（會覆蓋預設值）
            this.loadSavedSettings();

            // 3. 通知監聽器更新 UI
            this.notifyListeners();
        };

        // 立即嘗試載入，並設定監聽器以應對非同步載入
        loadVoices();
        this.synth.onvoiceschanged = loadVoices;

        window.addEventListener('beforeunload', () => {
            this.synth.cancel();
        });

        this.initialized = true;
    }
    
    // 改良的預設語音選擇邏輯，增加了後備選項
    private setDefaultSpeakers() {
        if (this.speakerE === "" && this.voices.length > 0) {
            const preferredVoices = [
                "Microsoft Emma Online (Natural) - English (United States)",
                "Samantha",
                "Fred",
            ];
            let foundVoice = this.voices.find(v => preferredVoices.includes(v.name));
            if (!foundVoice) {
                // 後備邏輯：尋找第一個可用的 en-US 語音
                foundVoice = this.voices.find(v => v.lang === 'en-US');
            }
            this.speakerE = foundVoice ? foundVoice.name : this.voices[0].name;
        }

        if (this.speakerC === "" && this.voices.length > 0) {
            const preferredVoices = [
                "Microsoft Hanhan - Chinese (Traditional, Taiwan)",
                "美嘉", "美佳", "Mei-Jia"
            ];
            let foundVoice = this.voices.find(v => preferredVoices.includes(v.name));
            if (!foundVoice) {
                // 後備邏輯：尋找第一個可用的 zh-TW 語音
                foundVoice = this.voices.find(v => v.lang === 'zh-TW');
            }
            this.speakerC = foundVoice ? foundVoice.name : this.voices[0].name;
        }
    }

    // 統一的儲存方法
    private saveSettings() {
        try {
            const settings: VoiceSettings = {
                speakerE: this.speakerE,
                speakerC: this.speakerC,
            };
            localStorage.setItem(SpeechService.STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving voice settings to localStorage:', error);
        }
    }

    // 統一的讀取方法
    private loadSavedSettings() {
        const savedSettings = localStorage.getItem(SpeechService.STORAGE_KEY);
        if (savedSettings) {
            try {
                const settings: VoiceSettings = JSON.parse(savedSettings);
                // 確保儲存的語音依然存在於可用列表中
                if (settings.speakerE && this.voices.some(v => v.name === settings.speakerE)) {
                    this.speakerE = settings.speakerE;
                }
                if (settings.speakerC && this.voices.some(v => v.name === settings.speakerC)) {
                    this.speakerC = settings.speakerC;
                }
            } catch (error) {
                console.error('Error parsing voice settings from localStorage:', error);
            }
        }
    }

    public setSpeakerE(speakerName: string): boolean {
        if (!this.voices.some(voice => voice.name === speakerName)) {
            console.warn('Invalid voice name for English speaker:', speakerName);
            return false;
        }
        this.speakerE = speakerName;
        this.saveSettings();
        this.notifyListeners();
        return true;
    }

    public setSpeakerC(speakerName: string): boolean {
        if (!this.voices.some(voice => voice.name === speakerName)) {
            console.warn('Invalid voice name for Chinese speaker:', speakerName);
            return false;
        }
        this.speakerC = speakerName;
        this.saveSettings();
        this.notifyListeners();
        return true;
    }

    // 私有的核心朗讀方法，避免程式碼重複
    private _speak(text: string, voiceName: string, options?: SpeakOptions) {
        if (!voiceName) {
            console.warn("Cannot speak without a selected voice.");
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voices.find(v => v.name === voiceName) || this.voices[0];
        
        // 應用額外參數
        if (options?.rate) utterance.rate = options.rate;
        if (options?.pitch) utterance.pitch = options.pitch;
        
        this.synth.speak(utterance);
    }

    // 公開的朗讀方法，現在接受 options
    public speakE(text: string, options?: SpeakOptions) {
        this._speak(text, this.speakerE, options);
    }

    public speakC(text: string, options?: SpeakOptions) {
        this._speak(text, this.speakerC, options);
    }

    // --- Listeners and Getters ---
    public addVoiceChangeListener(listener: VoiceChangeListener) { this.voiceChangeListeners.push(listener); }
    public removeVoiceChangeListener(listener: VoiceChangeListener) { this.voiceChangeListeners = this.voiceChangeListeners.filter(l => l !== listener); }
    private notifyListeners() { this.voiceChangeListeners.forEach(listener => listener()); }
    public getVoices() { return this.voices; }
    public getSpeakerE() { return this.speakerE; }
    public getSpeakerC() { return this.speakerC; }
    public static getSynth(): SpeechSynthesis { return SpeechService.getInstance().synth; }
}


// --- React Hook ---

export function useSpeech() {
    // 確保只在客戶端執行 getInstance
    const [speechService] = useState(() => SpeechService.getInstance());
    
    const [voicesList, setVoicesList] = useState<SpeechSynthesisVoice[]>([]);
    const [currentSpeakerE, setCurrentSpeakerE] = useState(speechService.getSpeakerE());
    const [currentSpeakerC, setCurrentSpeakerC] = useState(speechService.getSpeakerC());

    useEffect(() => {
        const handleVoiceChange = () => {
            setCurrentSpeakerE(speechService.getSpeakerE());
            setCurrentSpeakerC(speechService.getSpeakerC());
            setVoicesList([...speechService.getVoices()]); // 複製陣列觸發更新
        };

        speechService.addVoiceChangeListener(handleVoiceChange);
        speechService.initialize();

        // 初始載入時也手動觸發一次，確保狀態同步
        handleVoiceChange(); 

        return () => {
            speechService.removeVoiceChangeListener(handleVoiceChange);
        };
    }, [speechService]); // 依賴 speechService 實例

    const updateSpeakerE = useCallback((newSpeaker: string) => {
        return speechService.setSpeakerE(newSpeaker);
    }, [speechService]);

    const updateSpeakerC = useCallback((newSpeaker: string) => {
        return speechService.setSpeakerC(newSpeaker);
    }, [speechService]);

    const createUtterance = useCallback((text: string, rate: number, voiceName: string): SpeechSynthesisUtterance | null => {
        if (voicesList.length === 0) return null;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        const selectedVoice = voicesList.find(v => v.name === voiceName);
        
        utterance.voice = selectedVoice || voicesList[0];
        
        return utterance;
    }, [voicesList]);

    return {
        synth: speechService.synth,
        voices: voicesList,
        speakerE: currentSpeakerE,
        speakerC: currentSpeakerC,
        // 更新後的 speak 方法
        speakE: useCallback((text: string, options?: SpeakOptions) => speechService.speakE(text, options), [speechService]),
        speakC: useCallback((text: string, options?: SpeakOptions) => speechService.speakC(text, options), [speechService]),
        setSpeakerE: updateSpeakerE,
        setSpeakerC: updateSpeakerC,
        createUtterance: createUtterance,
    };
}

export default useSpeech;