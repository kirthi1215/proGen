import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Copy, Share2, Save, Loader2, Image as ImageIcon, Type, Code, Settings, X, Star, Mic, MicOff, Volume2, MessageCircle, Bookmark, Download, Plus, Filter, Palette, BookOpen, Zap, Check, Trash2, Sparkles } from 'lucide-react';

const ActionButton = ({ icon: Icon, label, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-3 rounded-xl border transition-all duration-200 ${
            disabled
                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed border-gray-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-transparent hover:border-white/20'
        }`}
        title={label}
    >
        <Icon size={18} />
    </button>
);

const Generator = () => {
    const [input, setInput] = useState('');
    // Input language (for recognition, prompt generation, and TTS)
    const [inputLanguage, setInputLanguage] = useState(() => localStorage.getItem('progenai_input_language') || 'en');
    const [model, setModel] = useState('image');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [result, setResult] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [rating, setRating] = useState(0);
    const [generatedCode, setGeneratedCode] = useState('');
    const [refinementQuestions, setRefinementQuestions] = useState([]);
    const [refinementAnswers, setRefinementAnswers] = useState({});
    const [isRefining, setIsRefining] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);
    const recognitionRef = React.useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    // Text-to-speech voices
    const [voices, setVoices] = useState([]);
    const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [showSavedPrompts, setShowSavedPrompts] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState([]);
    const [promptType, setPromptType] = useState('detailed'); // 'simple', 'detailed', 'technical'
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showChat, setShowChat] = useState(true); // Chat history visible by default
    const finalTranscriptRef = React.useRef('');
    const sessionBaseInputRef = React.useRef('');
    const currentAudioRef = React.useRef(null);

    useEffect(() => {
        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            try {
                // Cleanup existing recognition instance before creating a new one
                try {
                    const existing = recognitionRef.current || recognition;
                    if (existing) {
                        // remove handlers and stop
                        existing.onstart = null;
                        existing.onresult = null;
                        existing.onend = null;
                        existing.onerror = null;
                        if (typeof existing.abort === 'function') existing.abort();
                        if (typeof existing.stop === 'function') existing.stop();
                    }
                } catch (cleanupErr) {
                    console.warn('Error cleaning old recognition instance:', cleanupErr);
                }
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognitionInstance = new SpeechRecognition();

                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = true; // allow interim transcripts for better UX
                // set recognition language from inputLanguage (map short codes to locale)
                const langMap = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
                recognitionInstance.lang = langMap[inputLanguage] || 'en-US';

                recognitionInstance.onstart = () => {
                    console.log('Speech recognition started');
                    setIsListening(true);
                };

                recognitionInstance.onresult = (event) => {
                    // Process results including interim results and accumulate confirmed final transcript.
                    // Using refs here avoids missing data due to React state closure timing.
                    console.log('Speech recognition result:', event);
                    let interim = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const r = event.results[i];
                        const transcript = r[0] && r[0].transcript ? r[0].transcript : '';
                        if (r.isFinal) {
                            if (transcript && transcript.trim()) {
                                setInput(prev => prev + (prev ? ' ' : '') + transcript.trim());
                            }
                        } else {
                            interim += transcript;
                        }
                    }
                    setInterimTranscript(interim);
                };

                recognitionInstance.onend = () => {
                    console.log('Speech recognition ended');
                    // When a session ends ensure listening UI is cleared and interim is reset.
                    setIsListening(false);
                    setInterimTranscript('');
                    // leave finalTranscriptRef as-is because final results were already appended to the input
                };

                recognitionInstance.onnomatch = (event) => {
                    console.warn('Speech recognition no match:', event);
                    // notify user only lightly
                    // No need to disturb with alerts here
                };

                recognitionInstance.onerror = (event) => {
                    console.error('Speech recognition error:', event.error, event);
                    setIsListening(false);

                    let errorMessage = 'Speech recognition error occurred.';
                    let isNetworkError = false;

                    switch (event.error) {
                        case 'no-speech':
                            errorMessage = 'No speech was detected. Please try speaking again.';
                            break;
                        case 'audio-capture':
                            errorMessage = 'Audio capture failed. Please check your microphone and try again.';
                            break;
                        case 'not-allowed':
                            errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings and try again.';
                            break;
                        case 'network':
                            errorMessage = 'Network error occurred. Speech recognition requires internet connection. Please check your connection and try again.';
                            isNetworkError = true;
                            break;
                        case 'service-not-allowed':
                            errorMessage = 'Speech recognition service not allowed. This may be due to browser restrictions or network policies.';
                            isNetworkError = true;
                            break;
                        case 'aborted':
                            errorMessage = 'Speech recognition was aborted. Please try again.';
                            break;
                        case 'language-not-supported':
                            errorMessage = 'The selected language is not supported for speech recognition.';
                            break;
                        default:
                            errorMessage = `Speech recognition error: ${event.error}. Please try again or use text input instead.`;
                    }

                    // Show user-friendly alert
                    // Show user-friendly message but avoid spamming alerts
                    console.warn(errorMessage);
                    // For permission or network issues show an alert once
                    if (['not-allowed', 'service-not-allowed', 'network'].includes(event.error)) {
                        alert(errorMessage);
                    }

                    // Log additional network troubleshooting info
                    if (isNetworkError) {
                        console.warn('Network-related speech recognition error. Possible causes:');
                        console.warn('- Firewall blocking speech recognition service');
                        console.warn('- Corporate network policies or proxy settings');
                        console.warn('- Browser security restrictions');
                        console.warn('- Google speech services temporarily unavailable');
                        console.warn('- VPN or network filtering');

                        // Try to test connectivity to Google's speech service
                        fetch('https://www.google.com/speech-api/v1/recognize?xjerr=1', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({}),
                            mode: 'no-cors'
                        }).then(() => {
                            console.log('Google speech service appears reachable');
                        }).catch((fetchError) => {
                            console.error('Cannot reach Google speech service:', fetchError);
                        });
                        // Try a gentle reinit to recover from temporary network errors
                        setTimeout(() => {
                            try {
                                console.log('Attempting to reinitialize recognition after network error');
                                reinitializeRecognition();
                            } catch (e) {
                                console.warn('Reinit after network error failed', e);
                            }
                        }, 1200);
                    }
                };

                setRecognition(recognitionInstance);
                recognitionRef.current = recognitionInstance;
            } catch (error) {
                console.error('Failed to initialize speech recognition:', error);
                alert('Speech recognition is not supported in this browser or there was an initialization error.');
            }
        } else {
            console.warn('Speech recognition not supported in this browser');
        }

        // Initialize speech synthesis voices and load them into state
        const loadVoices = () => {
            if (!('speechSynthesis' in window)) return;
            const v = speechSynthesis.getVoices() || [];
            if (v.length) {
                setVoices(v);
                // Choose a sensible default voice (first English one, otherwise first)
                const idx = v.findIndex(voice => voice.lang && voice.lang.startsWith('en'));
                setSelectedVoiceIdx(idx >= 0 ? idx : 0);
            }
        };

        if ('speechSynthesis' in window) {
            loadVoices();
            // some browsers populate voices asynchronously - listen for change
            speechSynthesis.onvoiceschanged = () => {
                loadVoices();
                console.log('Speech synthesis voices changed/loaded');
            };
        }

        // Network status monitoring
        const handleOnline = () => {
            console.log('Network connection restored');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('Network connection lost');
            setIsOnline(false);
            // Stop listening if network is lost
            if (isListening) {
                stopListening();
            }
        };

        // Keyboard shortcut for voice input (Ctrl+Shift+V)
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                if (!isListening && recognitionRef.current && isOnline) {
                    startListening();
                } else if (isListening) {
                    stopListening();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            // Cleanup
            if (recognitionRef.current && isListening) {
                try { recognitionRef.current.stop(); } catch (e) { console.warn('cleanup stop failed', e); }
            }
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isListening]);

    const reinitializeRecognition = () => {
        console.log('Reinitializing speech recognition...');
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognitionInstance = new SpeechRecognition();

                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = true; // enable interim results
                const langMap = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
                recognitionInstance.lang = langMap[inputLanguage] || 'en-US';
                recognitionInstance.maxAlternatives = 1;

                recognitionInstance.onstart = () => {
                    console.log('Speech recognition started');
                    setIsListening(true);
                };

                recognitionInstance.onresult = (event) => {
                    // same robust result handling for reinitialized instances
                    console.log('Speech recognition result (reinit):', event);
                    let interim = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const r = event.results[i];
                        const transcript = (r[0] && r[0].transcript) ? r[0].transcript : '';
                        if (r.isFinal) {
                            finalTranscriptRef.current = (finalTranscriptRef.current ? finalTranscriptRef.current + ' ' : '') + transcript.trim();
                            setInput(() => (sessionBaseInputRef.current ? sessionBaseInputRef.current + ' ' : '') + finalTranscriptRef.current);
                        } else {
                            interim += transcript;
                        }
                    }
                    setInterimTranscript(interim);
                };

                recognitionInstance.onend = () => {
                    console.log('Speech recognition ended');
                    setIsListening(false);
                    setInterimTranscript('');
                };

                recognitionInstance.onerror = (event) => {
                    console.error('Speech recognition error:', event.error, event);
                    setIsListening(false);

                    let errorMessage = 'Speech recognition error occurred.';
                    let isNetworkError = false;

                    switch (event.error) {
                        case 'no-speech':
                            errorMessage = 'No speech was detected. Please try speaking again.';
                            break;
                        case 'audio-capture':
                            errorMessage = 'Audio capture failed. Please check your microphone and try again.';
                            break;
                        case 'not-allowed':
                            errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings and try again.';
                            break;
                        case 'network':
                            errorMessage = 'Network error occurred. Speech recognition requires internet connection. Please check your connection and try again.';
                            isNetworkError = true;
                            break;
                        case 'service-not-allowed':
                            errorMessage = 'Speech recognition service not allowed. This may be due to browser restrictions or network policies.';
                            isNetworkError = true;
                            break;
                        case 'aborted':
                            errorMessage = 'Speech recognition was aborted. Please try again.';
                            break;
                        case 'language-not-supported':
                            errorMessage = 'The selected language is not supported for speech recognition.';
                            break;
                        default:
                            errorMessage = `Speech recognition error: ${event.error}. Please try again or use text input instead.`;
                    }

                    alert(errorMessage);

                    if (isNetworkError) {
                        console.warn('Network-related speech recognition error. Possible causes:');
                        console.warn('- Firewall blocking speech recognition service');
                        console.warn('- Corporate network policies or proxy settings');
                        console.warn('- Browser security restrictions');
                        console.warn('- Google speech services temporarily unavailable');
                        console.warn('- VPN or network filtering');

                        fetch('https://www.google.com/speech-api/v1/recognize?xjerr=1', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({}),
                            mode: 'no-cors'
                        }).then(() => {
                            console.log('Google speech service appears reachable');
                        }).catch((fetchError) => {
                            console.error('Cannot reach Google speech service:', fetchError);
                        });
                    }
                };

                setRecognition(recognitionInstance);
                recognitionRef.current = recognitionInstance;
                console.log('Speech recognition reinitialized successfully');
            } catch (error) {
                console.error('Failed to reinitialize speech recognition:', error);
                alert('Speech recognition is not supported in this browser or there was an initialization error.');
            }
        }
    };

    const startListening = async () => {
        // Check if running on HTTPS (required for speech recognition in production)
        // Allow localhost for development
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && location.hostname !== '0.0.0.0') {
            alert('Speech recognition requires HTTPS. Please access the app via https:// or localhost.');
            return;
        }

        // Check network connectivity
        if (!isOnline) {
            alert('You appear to be offline. Speech recognition requires an internet connection to work.');
            return;
        }

        if (!recognitionRef.current) {
            console.log('Recognition not initialized, attempting to reinitialize...');
            reinitializeRecognition();
            // Wait a bit for initialization
            setTimeout(() => {
                if (recognitionRef.current) {
                    startListening();
                } else {
                    alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
                }
            }, 100);
            return;
        }

        if (isListening) {
            stopListening();
            return;
        }

        try {
            console.log('Requesting microphone permission...');
            // Request microphone permission with timeout
            const permissionPromise = navigator.mediaDevices.getUserMedia({ audio: true });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Microphone permission timeout')), 10000)
            );

            await Promise.race([permissionPromise, timeoutPromise]);
            console.log('Microphone permission granted');

            // Start recognition
                // Prepare a fresh session: remember current input and reset final transcripts
                sessionBaseInputRef.current = input || '';
                finalTranscriptRef.current = '';
            console.log('Starting speech recognition...');
            try {
                const r = recognitionRef.current;
                if (!r) throw new Error('Recognition unavailable');
                r.start();
            } catch (startErr) {
                console.warn('recognition.start() failed, trying to recover...', startErr);
                try {
                    // attempt to stop/abort and restart
                    const r = recognitionRef.current;
                    if (r && typeof r.abort === 'function') r.abort();
                    if (r && typeof r.stop === 'function') r.stop();
                } catch (cleanupErr) {
                    console.warn('Failed to cleanup recognition before restart', cleanupErr);
                }

                // brief pause and retry start
                await new Promise(resolve => setTimeout(resolve, 150));
                try {
                    const r = recognitionRef.current;
                    if (!r) throw new Error('Recognition unavailable');
                    r.start();
                } catch (err2) {
                    console.error('Failed to start recognition on retry', err2);
                    // Try reinitializing fully
                    reinitializeRecognition();
                    // small delay then try starting again if available
                    setTimeout(() => {
                            try {
                                if (recognitionRef.current) recognitionRef.current.start();
                        } catch (finalErr) {
                            console.error('Final recognition start attempt failed', finalErr);
                            alert('Failed to start voice recognition. Check microphone permissions and try again.');
                        }
                    }, 300);
                }
            }
        } catch (error) {
            console.error('Microphone permission or recognition error:', error);
            setIsListening(false);

            if (error.name === 'NotAllowedError') {
                alert('Microphone access denied. Please allow microphone permissions in your browser settings and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('No microphone found. Please check your audio devices and try again.');
            } else if (error.name === 'NotSupportedError') {
                alert('Microphone access is not supported in this browser or context.');
            } else if (error.message.includes('timeout')) {
                alert('Microphone permission request timed out. Please try again.');
            } else {
                alert(`Microphone error: ${error.message}. Please check your microphone settings and try again.`);
            }
        }
    };

    // Stop / abort the current recognition instance
    const stopListening = () => {
        const r = recognitionRef.current;
        if (!r) return;
        try {
            if (typeof r.abort === 'function') r.abort();
        } catch (e) { console.warn('recognition.abort error', e); }
        try {
            if (typeof r.stop === 'function') r.stop();
        } catch (e) { console.warn('recognition.stop error', e); }
        // Commit any final transcript into the input if it wasn't already
        if (finalTranscriptRef.current && finalTranscriptRef.current.trim()) {
            setInput(() => (sessionBaseInputRef.current ? sessionBaseInputRef.current + ' ' : '') + finalTranscriptRef.current);
        }
        setIsListening(false);
    };

    const testSpeechConnectivity = async () => {
        try {
            console.log('Testing speech recognition connectivity...');

            // Test basic connectivity to Google
            const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
            console.log('Basic Google connectivity: OK');

            // Try to initialize speech recognition briefly
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const TestRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const testInstance = new TestRecognition();
                testInstance.continuous = false;
                testInstance.interimResults = false;
                const langMap = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
                testInstance.lang = langMap[inputLanguage] || 'en-US';

                // Set a short timeout
                const timeout = setTimeout(() => {
                    testInstance.abort();
                    console.log('Speech recognition test: Timeout (may be blocked by network)');
                }, 3000);

                testInstance.onstart = () => {
                    console.log('Speech recognition test: Started successfully');
                    clearTimeout(timeout);
                    testInstance.abort();
                    alert('✅ Speech recognition connectivity test passed!');
                };

                testInstance.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('Speech recognition test failed:', error);
                    alert(`❌ Speech recognition test failed: ${error.error}`);
                };

                testInstance.start();
            } else {
                alert('❌ Speech recognition not supported in this browser');
            }
        } catch (error) {
            console.error('Connectivity test error:', error);
            alert('❌ Connectivity test failed. Check your internet connection.');
        }
    };

    const startMicTest = async () => {
        if (micTestRecording) return;

        try {
            // Request mic access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            const options = { mimeType: 'audio/webm' };
            const mediaRecorder = new MediaRecorder(stream, options);
            micRecorderRef.current = mediaRecorder;

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setMicTestBlob(blob);
                setMicTestRecording(false);
                // stop tracks
                try { stream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
            };

            mediaRecorder.start();
            setMicTestRecording(true);

            // stop automatically after 3 seconds
            setTimeout(() => {
                try { mediaRecorder.stop(); } catch (e) { console.warn('stop error', e); }
            }, 3000);
        } catch (err) {
            console.error('Microphone test error:', err);
            alert('Microphone test failed: ' + (err.message || err));
            setMicTestRecording(false);
        }
    };

    const playMicTest = () => {
        if (!micTestBlob) return;
        const url = URL.createObjectURL(micTestBlob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(err => console.error('Playback failed', err));
    };

    const speakText = async (text) => {
        if (isSpeaking) {
            // Stop if already speaking
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            setIsSpeaking(false);
            return;
        }

        try {
            setIsSpeaking(true);

            // Use gTTS server
            const langMap = { en: 'en', hi: 'hi', ta: 'ta', te: 'te' };
            const lang = langMap[inputLanguage] || 'en';

            const response = await fetch('/api/gtts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, lang })
            });

            if (!response.ok) {
                throw new Error(`TTS failed: ${response.status} ${response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            currentAudioRef.current = audio;

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudioRef.current = null;
                setIsSpeaking(false);
            };

            audio.onerror = (error) => {
                console.error('Audio playback error:', error);
                URL.revokeObjectURL(audioUrl);
                currentAudioRef.current = null;
                setIsSpeaking(false);
                alert('Failed to play audio. Please try again.');
            };

            await audio.play();
        } catch (error) {
            console.error('TTS error:', error);
            setIsSpeaking(false);
            alert('Text-to-speech failed. Please check if the server is running and try again.');
        }
    };
    const expertPrompts = [
        "A serene mountain landscape at golden hour with dramatic lighting",
        "A futuristic cyberpunk city street at night with neon lights",
        "Create a React component for a responsive navigation menu",
        "Write a Python script to analyze CSV data and generate charts",
        "Generate a professional email template for business proposals"
    ];

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [imageProvider] = useState('stability'); // Only Stability AI
    const [apiKeys, setApiKeys] = useState(() => {
        try {
            const saved = localStorage.getItem('progenai_api_keys');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to parse saved api keys', e);
        }
        return {
            stability: import.meta.env.VITE_STABILITY_API_KEY || '',
            elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY || ''
        };
    });
    // cloud TTS options
    const [useCloudTTS, setUseCloudTTS] = useState(() => {
        try { return JSON.parse(localStorage.getItem('progenai_useCloudTTS')) || false; } catch { return false; }
    });
    const [cloudVoiceId, setCloudVoiceId] = useState(() => localStorage.getItem('progenai_cloud_voice_id') || '');
    // NOTE: local gTTS server removed — use in-browser TTS or cloud TTS (ElevenLabs).

    // Plugin System State
    const [plugins, setPlugins] = useState(() => {
        const saved = localStorage.getItem('progenai_plugins');
        return saved ? JSON.parse(saved) : {
            filters: [],
            styles: [],
            genres: [],
            enhancers: []
        };
    });
    const [activePlugins, setActivePlugins] = useState(() => {
        const saved = localStorage.getItem('progenai_active_plugins');
        return saved ? JSON.parse(saved) : {
            filters: [],
            styles: [],
            genres: [],
            enhancers: []
        };
    });
    const [showPluginManager, setShowPluginManager] = useState(false);
    const [pluginTab, setPluginTab] = useState('filters');
    const [newPlugin, setNewPlugin] = useState({
        type: 'filter',
        name: '',
        description: '',
        code: '',
        config: {}
    });

    // Microphone test state
    const [micTestRecording, setMicTestRecording] = useState(false);
    const [micTestBlob, setMicTestBlob] = useState(null);
    const micStreamRef = React.useRef(null);
    const micRecorderRef = React.useRef(null);

    const handleGenerate = async () => {
        if (!input.trim()) return;

        setIsOptimizing(true);
        setResult(null);
        setGeneratedImage(null);
        setRating(0);
        setGeneratedCode('');
        setRefinementQuestions([]);
        setRefinementAnswers({});

        try {
            // 1. Optimize Prompt with Gemini
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            let systemPrompt = "";
            if (model === 'image') {
                if (promptType === 'simple') {
                    systemPrompt = "Transform the user's basic idea into a clear, concise image generation prompt. Focus on the main subject and basic style. Keep it under 50 words. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'detailed') {
                    systemPrompt = "You are a professional AI image prompt engineer. Create a highly detailed, professional image generation prompt that includes: subject description, artistic style, lighting conditions, camera angle, composition, color palette, mood, and specific visual details. Make it optimized for AI image generators like Midjourney, DALL-E, or Stable Diffusion. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'technical') {
                    systemPrompt = "Create a technical, precise image generation prompt with specific parameters. Include: exact dimensions/aspect ratio, rendering style, technical specifications, quality settings, and detailed artistic parameters. Use technical terminology and specify exact requirements for professional results. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'creative') {
                    systemPrompt = "Create a wildly creative and imaginative image generation prompt that pushes artistic boundaries. Include surreal elements, unexpected combinations, innovative concepts, and unique visual metaphors. Encourage experimental and boundary-pushing artistic approaches. Output ONLY the optimized prompt, nothing else.";
                }
            } else if (model === 'text') {
                if (promptType === 'simple') {
                    systemPrompt = "Transform the user's idea into a clear, straightforward prompt for text generation. Focus on the core request without unnecessary complexity. Keep it concise and direct. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'detailed') {
                    systemPrompt = "You are an expert prompt engineer for large language models. Create a comprehensive, well-structured prompt that includes: clear objective, specific context, detailed requirements, desired format, constraints, examples if needed, and success criteria. Ensure the prompt will produce high-quality, targeted results. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'technical') {
                    systemPrompt = "Create a technical, structured prompt for advanced AI text generation with precise specifications. Include: exact output format, technical requirements, data structures, validation criteria, performance constraints, and detailed implementation guidelines. Use technical terminology appropriate for the domain. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'creative') {
                    systemPrompt = "Create an innovative, creative prompt that encourages imaginative thinking and artistic expression. Include: creative constraints, inspirational elements, unique perspectives, metaphorical thinking, and encouragement for original approaches. Push the boundaries of conventional thinking. Output ONLY the optimized prompt, nothing else.";
                }
            } else if (model === 'code') {
                if (promptType === 'simple') {
                    systemPrompt = "Transform the user's coding idea into a clear, straightforward prompt for code generation. Specify the programming language, basic functionality, and core requirements. Keep it concise and focused. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'detailed') {
                    systemPrompt = "You are a senior software architect. Create a comprehensive coding prompt that includes: technology stack, detailed requirements, best practices, error handling, testing strategy, performance considerations, security requirements, and code quality standards. Ensure the prompt will produce production-ready, maintainable code. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'technical') {
                    systemPrompt = "Create a highly technical coding prompt with specific implementation details. Include: exact algorithms, data structures, time/space complexity requirements, technical specifications, performance benchmarks, security considerations, and detailed architectural patterns. Use precise technical terminology. Output ONLY the optimized prompt, nothing else.";
                } else if (promptType === 'creative') {
                    systemPrompt = "Create an innovative coding prompt that explores creative programming solutions. Include: unique algorithmic approaches, artistic coding techniques, unconventional data structures, creative problem-solving methods, and experimental implementation strategies. Encourage thinking outside traditional programming paradigms. Output ONLY the optimized prompt, nothing else.";
                }
            }

            // Make sure the AI outputs in the user's selected language
            const langNames = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu' };
            const languageName = langNames[inputLanguage] || 'English';
            if (languageName) {
                systemPrompt += `\n\nImportant: Output the optimized prompt in ${languageName}. Respond ONLY with the optimized prompt in ${languageName}, and do not include explanations.`;
            }

            // Apply active plugins
            let processedInput = input;
            Object.entries(activePlugins).forEach(([pluginType, activePluginNames]) => {
                activePluginNames.forEach(pluginName => {
                    const plugin = plugins[pluginType].find(p => p.name === pluginName);
                    if (plugin) {
                        try {
                            // Create a safe function from the plugin code
                            const pluginFunction = new Function('prompt', 'config', plugin.code + '\nreturn processPrompt(prompt, config);');
                            processedInput = pluginFunction(processedInput, plugin.config || {});
                        } catch (error) {
                            console.error(`Error executing plugin ${pluginName}:`, error);
                        }
                    }
                });
            });

            const result = await aiModel.generateContent(`${systemPrompt}\n\nUser Input: "${processedInput}"`);
            const response = await result.response;
            const optimizedPrompt = response.text();

            setResult(optimizedPrompt);
            setChatHistory(prev => [...prev, { type: 'user', content: input, timestamp: new Date() }, { type: 'ai', content: `Generated prompt: ${optimizedPrompt}`, timestamp: new Date() }]);

            // Generate refinement questions
            await generateRefinementQuestions(input, optimizedPrompt, model);

            // 3. Generate Image (if applicable)
            if (model === 'image') {
                await generateImage(optimizedPrompt);
                // Don't set isOptimizing to false here - generateImage handles it
            } else {
                setIsOptimizing(false);
            }

            // 4. Generate Code (if applicable)
            if (model === 'code') {
                const codeResult = await aiModel.generateContent(`Generate high-quality, production-ready code based on this prompt: "${optimizedPrompt}". Include proper structure, comments, error handling, and follow best practices. Output only the code, no explanations.`);
                const codeResponse = await codeResult.response;
                const generatedCode = codeResponse.text();
                setGeneratedCode(generatedCode);
                setIsOptimizing(false);
            }

            // For text model, we're done
            if (model === 'text') {
                setIsOptimizing(false);
            }

        } catch (error) {
            console.error("Error:", error);
            setResult(`Error: ${error.message || "Failed to generate content"}`);
            setIsOptimizing(false);
        }
    };

    const generateRefinementQuestions = async (originalInput, optimizedPrompt, modelType) => {
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const langNames = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu' };
                const languageName = langNames[inputLanguage] || 'English';
                const questionPrompt = `Based on the user's original input: "${originalInput}" and the optimized prompt: "${optimizedPrompt}", in ${languageName}, generate 3 specific questions that would help refine and improve this ${modelType} prompt even further. Focus on details that are missing or could be enhanced. Output only the questions, one per line, numbered 1-3.`;

            const result = await aiModel.generateContent(questionPrompt);
            const response = await result.response;
            const questionsText = response.text();

            // Parse questions
            const questions = questionsText.split('\n')
                .filter(line => line.trim().match(/^\d+\./))
                .map(line => line.replace(/^\d+\.\s*/, '').trim());

            setRefinementQuestions(questions.slice(0, 3)); // Max 3 questions
            setRefinementAnswers({});
        } catch (error) {
            console.error("Error generating questions:", error);
            setRefinementQuestions([]);
        }
    };

    const refinePrompt = async () => {
        if (Object.keys(refinementAnswers).length === 0) return;

        setIsRefining(true);
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const answersText = Object.entries(refinementAnswers)
                .map(([q, a]) => `Q: ${q}\nA: ${a}`)
                .join('\n\n');

            const refinementPrompt = `Original user input: "${input}"\n\nAdditional details from user:\n${answersText}\n\nPlease create an even better, more refined ${model} prompt incorporating all this information. Make it highly detailed and optimized. Output ONLY the final prompt, nothing else.`;

            const result = await aiModel.generateContent(refinementPrompt);
            const response = await result.response;
            const refinedPrompt = response.text();

            setResult(refinedPrompt);
            setChatHistory(prev => [...prev, { type: 'ai', content: `Refined prompt: ${refinedPrompt}`, timestamp: new Date() }]);
            setRefinementQuestions([]); // Hide questions after refinement
            setRefinementAnswers({});

            // Regenerate code if needed
            if (model === 'code') {
                const codeResult = await aiModel.generateContent(`Generate high-quality, production-ready code based on this refined prompt: "${refinedPrompt}". Include proper structure, comments, error handling, and follow best practices. Output only the code, no explanations.`);
                const codeResponse = await codeResult.response;
                const generatedCode = codeResponse.text();
                setGeneratedCode(generatedCode);
            }

            // Regenerate image if needed
            if (model === 'image') {
                await generateImage(refinedPrompt);
            }

        } catch (error) {
            console.error("Error refining prompt:", error);
            alert("Failed to refine prompt. Please try again.");
        } finally {
            setIsRefining(false);
        }
    };

    const generateImage = async (prompt) => {
        try {
            setIsOptimizing(true);
            setGeneratedImage(null);
            
            if (!apiKeys.stability) {
                throw new Error("Stability AI API Key is missing. Please configure it in Settings.");
            }

            const response = await fetch(
                "/api/stability/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKeys.stability}`,
                    },
                    body: JSON.stringify({
                        text_prompts: [{ text: prompt }],
                        cfg_scale: 7,
                        height: 1024,
                        width: 1024,
                        samples: 1,
                        steps: 30,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to generate image: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const data = await response.json();
            if (!data.artifacts || !data.artifacts[0] || !data.artifacts[0].base64) {
                throw new Error("Invalid response from Stability AI. Please check your API key and try again.");
            }
            
            const base64Image = data.artifacts[0].base64;
            const imageUrl = `data:image/png;base64,${base64Image}`;
            setGeneratedImage(imageUrl);
            setIsOptimizing(false);
        } catch (error) {
            console.error("Image Gen Error:", error);
            setGeneratedImage(null);
            setIsOptimizing(false);
            alert(`Image Generation Failed: ${error.message}\n\nPlease configure your Stability AI API key in Settings.`);
        }
    };

    // ElevenLabs / Cloud TTS helper - generate audio and play
    const cloudTtsSpeak = async (text) => {
        if (!apiKeys.elevenlabs) {
            throw new Error('ElevenLabs API key not configured');
        }

        if (!cloudVoiceId) {
            throw new Error('ElevenLabs voice ID not configured');
        }

        // ElevenLabs API - create audio and stream back
        try {
            const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cloudVoiceId)}`;
            const body = {
                text,
                // voice_settings can be customized by users later
                voice_settings: { stability: 0.6, similarity_boost: 0.5 }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKeys.elevenlabs
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const textErr = await res.text().catch(() => 'no error body');
                throw new Error(`Cloud TTS failed: ${res.status} ${res.statusText} ${textErr}`);
            }

            const arr = await res.arrayBuffer();
            const blob = new Blob([arr], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();

            // Cleanup URL when finished
            audio.onended = () => URL.revokeObjectURL(audioUrl);
            return true;
        } catch (err) {
            console.error('Cloud TTS error:', err);
            throw err;
        }
    };

    // local gTTS server has been removed — client-side TTS uses cloud TTS (ElevenLabs) or browser speechSynthesis

    const sharePrompt = async (prompt) => {
        const shareText = `Check out this AI prompt I created with ProGen AI:\n\n"${prompt}"\n\nTry it at: ${window.location.origin}`;

        if (navigator.share) {
            // Use native Web Share API if available
            try {
                await navigator.share({
                    title: 'ProGen AI Prompt',
                    text: shareText,
                    url: window.location.origin
                });
            } catch (error) {
                console.log('Share cancelled or failed:', error);
                fallbackShare(shareText);
            }
        } else {
            fallbackShare(shareText);
        }
    };

    const fallbackShare = (text) => {
        // Fallback to clipboard
        navigator.clipboard.writeText(text).then(() => {
            alert('Prompt copied to clipboard! You can now share it anywhere.');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Prompt copied to clipboard! You can now share it anywhere.');
        });
    };

    const savePrompt = (prompt) => {
        // Save to localStorage
        const savedPrompts = JSON.parse(localStorage.getItem('progenai_saved_prompts') || '[]');
        const promptData = {
            id: Date.now(),
            prompt: prompt,
            model: model,
            promptType: promptType,
            timestamp: new Date().toISOString(),
            rating: rating
        };

        savedPrompts.unshift(promptData); // Add to beginning

        // Keep only last 50 prompts
        if (savedPrompts.length > 50) {
            savedPrompts.splice(50);
        }

        localStorage.setItem('progenai_saved_prompts', JSON.stringify(savedPrompts));
        setSavedPrompts(savedPrompts); // Update local state
        alert('Prompt saved successfully! Access saved prompts from the menu.');
    };

    const loadSavedPrompts = () => {
        const prompts = JSON.parse(localStorage.getItem('progenai_saved_prompts') || '[]');
        setSavedPrompts(prompts);
        setShowSavedPrompts(true);
    };

    const loadPrompt = (promptData) => {
        setInput(promptData.prompt);
        setModel(promptData.model);
        setPromptType(promptData.promptType);
        setRating(promptData.rating);
        setShowSavedPrompts(false);
        alert('Prompt loaded! You can now generate or modify it.');
    };

    const deletePrompt = (id) => {
        const updatedPrompts = savedPrompts.filter(p => p.id !== id);
        localStorage.setItem('progenai_saved_prompts', JSON.stringify(updatedPrompts));
        setSavedPrompts(updatedPrompts);
    };

    const exportPrompt = (prompt) => {
        const dataStr = JSON.stringify({
            prompt: prompt,
            model: model,
            promptType: promptType,
            timestamp: new Date().toISOString(),
            app: 'ProGen AI'
        }, null, 2);

        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `progenai-prompt-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full px-4 py-4">
            <div className="w-full h-full flex gap-4">
                {/* Left Panel - Main Content */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 sm:p-6 w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white dark:text-gray-800">API Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-800">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Stability AI API Key - Required for Image Generation */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="block text-sm font-semibold text-white dark:text-gray-800">Stability AI API Key</label>
                                        <span className="text-xs text-red-400 dark:text-red-600">*Required</span>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeys.stability}
                                        onChange={(e) => setApiKeys({ ...apiKeys, stability: e.target.value })}
                                        placeholder="sk-..."
                                        className="input-field w-full"
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        Required for image generation. Get your API key from{' '}
                                        <a href="https://platform.stability.ai" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] dark:text-[#00a8cc] hover:underline">
                                            platform.stability.ai
                                        </a>
                                    </p>
                                </div>

                                {/* ElevenLabs TTS Settings */}
                                <div className="pt-4 border-t border-white/10 dark:border-gray-300/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-200 dark:text-gray-700">High-quality Cloud TTS (Optional)</h4>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">Use ElevenLabs voices for realistic speech</p>
                                        </div>
                                        <div className="text-xs text-gray-300 dark:text-gray-600">
                                            {useCloudTTS ? 'Enabled' : 'Disabled'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs text-gray-300 dark:text-gray-600 mb-1">ElevenLabs API Key</label>
                                        <input
                                            type="password"
                                            value={apiKeys.elevenlabs}
                                            onChange={(e) => setApiKeys({ ...apiKeys, elevenlabs: e.target.value })}
                                            placeholder="eleven-..."
                                            className="input-field text-xs"
                                        />

                                        <label className="block text-xs text-gray-300 dark:text-gray-600 mb-1">Cloud Voice ID</label>
                                        <input
                                            type="text"
                                            value={cloudVoiceId}
                                            onChange={(e) => { setCloudVoiceId(e.target.value); localStorage.setItem('progenai_cloud_voice_id', e.target.value); }}
                                            placeholder="voice ID (from ElevenLabs)"
                                            className="input-field text-xs"
                                        />

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    setUseCloudTTS(prev => {
                                                        localStorage.setItem('progenai_useCloudTTS', JSON.stringify(!prev));
                                                        return !prev;
                                                    });
                                                }}
                                                className={`px-3 py-1 rounded text-xs transition-colors ${useCloudTTS ? 'bg-yellow-500/20 text-yellow-300 dark:bg-yellow-500/30 dark:text-yellow-600 hover:bg-yellow-500/30' : 'bg-white/5 dark:bg-gray-200/10 text-gray-300 dark:text-gray-600 hover:bg-white/10'}`}
                                            >
                                                Toggle Cloud TTS
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!useCloudTTS) return alert('Enable Cloud TTS first.');
                                                    if (!apiKeys.elevenlabs) return alert('Please set ElevenLabs API key');
                                                    if (!cloudVoiceId) return alert('Please set the cloud voice ID');
                                                    speakText('This is a quick cloud T T S test. If you hear this, cloud T T S works.');
                                                }}
                                                className="px-3 py-1 rounded text-xs bg-blue-500/20 text-blue-300 dark:bg-blue-500/30 dark:text-blue-600 hover:bg-blue-500/30 transition-colors"
                                            >
                                                Test Cloud Voice
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        try {
                                            localStorage.setItem('progenai_api_keys', JSON.stringify(apiKeys));
                                            localStorage.setItem('progenai_useCloudTTS', JSON.stringify(useCloudTTS));
                                            // gTTS server removed — we keep cloud/browser TTS settings only
                                            // cloud voice id persisted on change
                                        } catch (e) {
                                            console.warn('Failed to persist settings', e);
                                        }
                                        setShowSettings(false);
                                    }}
                                    className="w-full btn-primary mt-4"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Plugin Manager Modal */}
            <AnimatePresence>
                {showPluginManager && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 sm:p-6 w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap size={24} />
                                    Plugin Manager
                                </h2>
                                <button onClick={() => setShowPluginManager(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Plugin Tabs */}
                            <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
                                {[
                                    { id: 'filters', label: 'Filters', icon: Filter },
                                    { id: 'styles', label: 'Styles', icon: Palette },
                                    { id: 'genres', label: 'Genres', icon: BookOpen },
                                    { id: 'enhancers', label: 'Enhancers', icon: Zap }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPluginTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                                            pluginTab === tab.id
                                                ? 'bg-indigo-500 text-white'
                                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Plugin List */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        {pluginTab.charAt(0).toUpperCase() + pluginTab.slice(1)} Plugins
                                    </h3>
                                    <div className="max-h-96 overflow-y-auto space-y-3">
                                        {plugins[pluginTab].length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                                                    {pluginTab === 'filters' && <Filter size={32} className="opacity-50" />}
                                                    {pluginTab === 'styles' && <Palette size={32} className="opacity-50" />}
                                                    {pluginTab === 'genres' && <BookOpen size={32} className="opacity-50" />}
                                                    {pluginTab === 'enhancers' && <Zap size={32} className="opacity-50" />}
                                                </div>
                                                <p>No {pluginTab} plugins yet.</p>
                                                <p className="text-sm">Create your first plugin below!</p>
                                            </div>
                                        ) : (
                                            plugins[pluginTab].map((plugin, index) => (
                                                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-medium text-white">{plugin.name}</h4>
                                                            <p className="text-sm text-gray-400">{plugin.description}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    const newActive = { ...activePlugins };
                                                                    if (newActive[pluginTab].includes(plugin.name)) {
                                                                        newActive[pluginTab] = newActive[pluginTab].filter(p => p !== plugin.name);
                                                                    } else {
                                                                        newActive[pluginTab] = [...newActive[pluginTab], plugin.name];
                                                                    }
                                                                    setActivePlugins(newActive);
                                                                    localStorage.setItem('progenai_active_plugins', JSON.stringify(newActive));
                                                                }}
                                                                className={`p-1 rounded transition-colors ${
                                                                    activePlugins[pluginTab].includes(plugin.name)
                                                                        ? 'bg-green-500/20 text-green-300'
                                                                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                                                }`}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const newPlugins = { ...plugins };
                                                                    newPlugins[pluginTab] = newPlugins[pluginTab].filter((_, i) => i !== index);
                                                                    setPlugins(newPlugins);
                                                                    localStorage.setItem('progenai_plugins', JSON.stringify(newPlugins));

                                                                    // Remove from active plugins if deleted
                                                                    const newActive = { ...activePlugins };
                                                                    newActive[pluginTab] = newActive[pluginTab].filter(p => p !== plugin.name);
                                                                    setActivePlugins(newActive);
                                                                    localStorage.setItem('progenai_active_plugins', JSON.stringify(newActive));
                                                                }}
                                                                className="p-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Create Plugin Form */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Plus size={20} />
                                        Create New Plugin
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Plugin Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newPlugin.name}
                                                onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                                                placeholder="Enter plugin name..."
                                                className={`input-field ${!newPlugin.name.trim() && newPlugin.name !== '' ? 'border-red-500/50' : ''}`}
                                            />
                                            {!newPlugin.name.trim() && newPlugin.name !== '' && (
                                                <p className="text-xs text-red-400 mt-1">Plugin name is required</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                            <input
                                                type="text"
                                                value={newPlugin.description}
                                                onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                                                placeholder="Brief description of what this plugin does..."
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Plugin Code (JavaScript) <span className="text-red-400">*</span>
                                            </label>
                                            <textarea
                                                value={newPlugin.code}
                                                onChange={(e) => setNewPlugin({ ...newPlugin, code: e.target.value })}
                                                placeholder={`// Example ${pluginTab} plugin
function processPrompt(prompt, config) {
  // Your plugin logic here
  return prompt;
}`}
                                                className={`input-field h-48 font-mono text-sm ${!newPlugin.code.trim() && newPlugin.code !== '' ? 'border-red-500/50' : ''}`}
                                            />
                                            {!newPlugin.code.trim() && newPlugin.code !== '' && (
                                                <p className="text-xs text-red-400 mt-1">Plugin code is required</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const nameValid = newPlugin.name.trim();
                                                const codeValid = newPlugin.code.trim();

                                                if (!nameValid || !codeValid) {
                                                    // Update state to show validation errors
                                                    setNewPlugin(prev => ({
                                                        ...prev,
                                                        name: prev.name, // Keep current value to show validation
                                                        code: prev.code  // Keep current value to show validation
                                                    }));
                                                    return;
                                                }

                                                const newPlugins = { ...plugins };
                                                newPlugins[pluginTab] = [...newPlugins[pluginTab], {
                                                    ...newPlugin,
                                                    type: pluginTab
                                                }];
                                                setPlugins(newPlugins);
                                                localStorage.setItem('progenai_plugins', JSON.stringify(newPlugins));

                                                setNewPlugin({
                                                    type: pluginTab,
                                                    name: '',
                                                    description: '',
                                                    code: '',
                                                    config: {}
                                                });

                                                alert('Plugin created successfully!');
                                            }}
                                            className="w-full btn-primary flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} />
                                            Create Plugin
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-400">
                                        Active plugins: {Object.values(activePlugins).flat().length}
                                    </div>
                                    <button
                                        onClick={() => setShowPluginManager(false)}
                                        className="btn-primary"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Saved Prompts Modal */}
            <AnimatePresence>
                {showSavedPrompts && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 sm:p-6 w-full sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Bookmark size={24} />
                                    Saved Prompts
                                </h2>
                                <button onClick={() => setShowSavedPrompts(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-[60vh]">
                                {savedPrompts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No saved prompts yet.</p>
                                        <p className="text-sm">Save your favorite prompts using the Save button!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {savedPrompts.map((promptData) => (
                                            <div key={promptData.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            promptData.model === 'image' ? 'bg-blue-500/20 text-blue-300' :
                                                            promptData.model === 'code' ? 'bg-green-500/20 text-green-300' :
                                                            'bg-purple-500/20 text-purple-300'
                                                        }`}>
                                                            {promptData.model}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(promptData.timestamp).toLocaleDateString()}
                                                        </span>
                                                        {promptData.rating > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Star size={12} className="text-yellow-400 fill-current" />
                                                                <span className="text-xs text-yellow-400">{promptData.rating}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => loadPrompt(promptData)}
                                                            className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-xs transition-colors"
                                                        >
                                                            Load
                                                        </button>
                                                        <button
                                                            onClick={() => sharePrompt(promptData.prompt)}
                                                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs transition-colors"
                                                        >
                                                            Share
                                                        </button>
                                                        <button
                                                            onClick={() => deletePrompt(promptData.id)}
                                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-200 text-sm leading-relaxed">
                                                    {promptData.prompt.length > 200
                                                        ? promptData.prompt.substring(0, 200) + '...'
                                                        : promptData.prompt
                                                    }
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {savedPrompts.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            const allPrompts = savedPrompts.map(p => p.prompt).join('\n\n---\n\n');
                                            exportPrompt(allPrompts);
                                        }}
                                        className="w-full btn-primary text-sm"
                                    >
                                        Export All Prompts
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

                    {/* Main Content Area */}
                    <div className="glass-panel rounded-2xl p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                        {/* Select Mode */}
                        <div>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent"></div>
                                <h3 className="text-xs font-semibold text-[#00e5ff] dark:text-[#00a8cc] uppercase tracking-wider model-badge px-4 py-1.5">
                                    Select AI Model
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ff32b8] to-transparent"></div>
                            </div>
                            <div className="flex justify-center gap-3">
                                {[
                                    { id: 'image', icon: ImageIcon, label: 'Image', desc: 'Visuals' },
                                    { id: 'text', icon: Type, label: 'Text', desc: 'Content' },
                                    { id: 'code', icon: Code, label: 'Code', desc: 'Development' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setModel(m.id)}
                                        className={`group flex-1 max-w-[180px] p-4 rounded-xl border-2 transition-all duration-300 ${
                                            model === m.id
                                                ? 'bg-gradient-to-br from-[#00e5ff]/20 to-[#ff32b8]/20 dark:from-[#00e5ff]/30 dark:to-[#ff32b8]/30 text-white dark:text-gray-800 border-[#00e5ff] dark:border-[#00a8cc] shadow-lg shadow-[#00e5ff]/30 scale-105'
                                                : 'glass-panel text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-800 border-white/10 dark:border-gray-300/20 hover:border-[#00e5ff]/30'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`p-2 rounded-lg transition-all ${
                                                model === m.id 
                                                    ? 'bg-gradient-to-br from-[#00e5ff] to-[#ff32b8] dark:from-[#00a8cc] dark:to-[#cc2670] shadow-lg shadow-[#00e5ff]/50' 
                                                    : 'bg-white/5 dark:bg-gray-200/10'
                                            }`}>
                                                <m.icon size={24} className="group-hover:scale-110 transition-transform duration-200" />
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-sm">{m.label}</div>
                                                <div className="text-xs opacity-70">{m.desc}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spacing */}
                        <div className="h-4"></div>

                        {/* Prompt Style */}
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center uppercase tracking-wider">Prompt Style</h3>
                            <div className="flex justify-center gap-2 flex-wrap">
                                {[
                                    { id: 'simple', label: 'Simple' },
                                    { id: 'detailed', label: 'Detailed' },
                                    { id: 'technical', label: 'Technical' }
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPromptType(p.id)}
                                        className={`px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-medium ${
                                            promptType === p.id
                                                ? 'bg-gradient-to-r from-[#00e5ff]/20 to-[#ff32b8]/20 dark:from-[#00e5ff]/30 dark:to-[#ff32b8]/30 text-white dark:text-gray-800 border-[#00e5ff]/50 dark:border-[#00a8cc]/50 shadow-lg shadow-[#00e5ff]/20'
                                                : 'glass-panel text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-800 border-white/10 dark:border-gray-300/20 hover:border-[#00e5ff]/30'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language Selection - Left Aligned */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400 dark:text-gray-500 font-medium min-w-[80px]">Language:</span>
                            <select
                                value={inputLanguage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setInputLanguage(val);
                                    localStorage.setItem('progenai_input_language', val);
                                    try { reinitializeRecognition(); } catch (err) { console.warn('reinit failed', err); }
                                }}
                                className="flex-1 glass-panel border border-white/10 dark:border-gray-300/20 text-sm rounded-xl px-4 py-2.5 text-gray-200 dark:text-gray-700 focus:border-[#00e5ff]/50 dark:focus:border-[#00a8cc]/50 focus:ring-2 focus:ring-[#00e5ff]/20 transition-all bg-black/20 dark:bg-white/20"
                            >
                                <option value="en">🇺🇸 English</option>
                                <option value="hi">🇮🇳 Hindi</option>
                                <option value="ta">🇮🇳 Tamil</option>
                                <option value="te">🇮🇳 Telugu</option>
                            </select>
                        </div>

                        {/* Settings Buttons */}
                        <div className="flex justify-end items-center gap-2">
                            <button
                                onClick={loadSavedPrompts}
                                className="p-2 glass-panel text-gray-400 dark:text-gray-600 hover:text-[#ff32b8] dark:hover:text-[#cc2670] border border-white/10 dark:border-gray-300/20 hover:border-[#ff32b8]/30 rounded-lg transition-all"
                                title="Saved Prompts"
                            >
                                <Bookmark size={16} />
                            </button>
                            <button
                                onClick={() => setShowPluginManager(true)}
                                className="p-2 glass-panel text-gray-400 dark:text-gray-600 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] border border-white/10 dark:border-gray-300/20 hover:border-[#00e5ff]/30 rounded-lg transition-all"
                                title="Plugin Manager"
                            >
                                <Zap size={16} />
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 glass-panel text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-800 border border-white/10 dark:border-gray-300/20 hover:border-white/30 rounded-lg transition-all"
                                title="Settings"
                            >
                                <Settings size={16} />
                            </button>
                        </div>

                            {/* Input Area */}
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter your idea or prompt here..."
                                className={`input-field w-full h-32 text-sm resize-none ${
                                    isListening ? 'ring-2 ring-[#ff32b8]/50 dark:ring-[#cc2670]/50 border-[#ff32b8]/50 dark:border-[#cc2670]/50' : ''
                                }`}
                            />
                            {isListening && (
                                <div className="absolute top-3 left-3 flex items-center gap-2 text-[#ff32b8] dark:text-[#cc2670] text-xs bg-black/40 dark:bg-white/40 px-2 py-1 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-[#ff32b8] dark:bg-[#cc2670] rounded-full animate-pulse"></div>
                                    Listening...
                                </div>
                            )}
                            <div className="absolute bottom-3 right-3 flex gap-2">
                                <button
                                    onClick={startListening}
                                    disabled={!recognitionRef.current || !isOnline}
                                    className={`p-2 rounded-lg transition-all duration-200 glass-panel ${
                                        isListening
                                            ? 'bg-[#ff32b8]/20 dark:bg-[#cc2670]/20 text-[#ff32b8] dark:text-[#cc2670] border border-[#ff32b8]/50 dark:border-[#cc2670]/50 animate-pulse shadow-lg shadow-[#ff32b8]/30'
                                            : !isOnline
                                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed border border-gray-500/30'
                                            : 'text-gray-400 dark:text-gray-600 hover:text-[#00e5ff] dark:hover:text-[#00a8cc] border border-white/10 dark:border-gray-300/20 hover:border-[#00e5ff]/30 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                    title="Voice input"
                                >
                                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isOptimizing || !input.trim()}
                                    className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                                >
                                    {isOptimizing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={16} />
                                            Generate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Result Section */}
                        {result && (
                            <div className="space-y-4">
                                {/* Generated Prompt Result */}
                                <div className="glass-panel rounded-xl p-4 relative overflow-hidden border border-[#00e5ff]/20 dark:border-[#00a8cc]/20">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5ff] via-[#ff32b8] to-[#00e5ff]"></div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-sm font-semibold text-white dark:text-gray-800 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-[#00e5ff] dark:text-[#00a8cc]" />
                                            Generated Prompt
                                        </h3>
                                        <div className="flex gap-2">
                                            <ActionButton icon={Copy} label="Copy" onClick={() => navigator.clipboard.writeText(result)} />
                                            <ActionButton icon={Volume2} label="Speak" onClick={() => speakText(result)} disabled={!('speechSynthesis' in window)} />
                                            <ActionButton icon={Save} label="Save" onClick={() => savePrompt(result)} />
                                        </div>
                                    </div>
                                    <div className="glass-panel rounded-lg p-4 border border-white/10 dark:border-gray-300/20 max-h-48 overflow-y-auto">
                                        <p className="text-sm text-gray-200 dark:text-gray-700 leading-relaxed font-mono whitespace-pre-wrap">
                                            {result}
                                        </p>
                                    </div>
                                </div>

                                {/* Image Preview - Always shown for Image Model, directly under Generated Prompt */}
                                {model === 'image' && (
                                    <div className="glass-panel rounded-xl p-4 relative overflow-hidden border border-[#ff32b8]/20 dark:border-[#cc2670]/20">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff32b8] via-[#00e5ff] to-[#ff32b8]"></div>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-sm font-semibold text-white dark:text-gray-800 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-[#ff32b8] dark:text-[#cc2670]" />
                                                Image Preview
                                            </h3>
                                            {generatedImage && (
                                                <div className="flex gap-2">
                                                    <ActionButton icon={Share2} label="Share" onClick={() => sharePrompt(result)} />
                                                    <ActionButton 
                                                        icon={Download} 
                                                        label="Download" 
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = generatedImage;
                                                            link.download = `progenai-image-${Date.now()}.png`;
                                                            link.click();
                                                        }} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-black/20 dark:bg-white/10 rounded-lg border border-white/5 dark:border-gray-300/10 min-h-[350px] flex items-center justify-center overflow-hidden">
                                            {isOptimizing ? (
                                                <div className="flex flex-col items-center justify-center gap-4 py-12">
                                                    <div className="relative">
                                                        <Loader2 className="animate-spin text-[#00e5ff] dark:text-[#00a8cc]" size={48} />
                                                        <div className="absolute inset-0 rounded-full border-2 border-[#00e5ff]/20 dark:border-[#00a8cc]/20"></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-300 dark:text-gray-600">Generating image...</span>
                                                    <div className="w-48 h-1 bg-white/10 dark:bg-gray-200/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-[#00e5ff] to-[#ff32b8] dark:from-[#00a8cc] dark:to-[#cc2670] rounded-full animate-pulse"></div>
                                                    </div>
                                                </div>
                                            ) : generatedImage ? (
                                                <img
                                                    src={generatedImage}
                                                    alt="Generated Image"
                                                    className="w-full h-auto max-h-[600px] object-contain rounded-lg shadow-lg"
                                                    onError={(e) => {
                                                        console.error("Image load error");
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400 dark:text-gray-500">
                                                    <ImageIcon size={48} className="opacity-30" />
                                                    <span className="text-sm">Image will appear here after generation</span>
                                                </div>
                                            )}
                                        </div>
                                        {generatedImage && (
                                            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                Powered by Stability AI - Stable Diffusion XL
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Code Preview - Only for Code Model */}
                                {model === 'code' && generatedCode && (
                                    <div className="glass-panel rounded-xl p-4 relative overflow-hidden border border-[#00e5ff]/20 dark:border-[#00a8cc]/20">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5ff] via-[#ff32b8] to-[#00e5ff]"></div>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-sm font-semibold text-white dark:text-gray-800 flex items-center gap-2">
                                                <Code className="w-4 h-4 text-[#00e5ff] dark:text-[#00a8cc]" />
                                                Generated Code
                                            </h3>
                                            <div className="flex gap-2">
                                                <ActionButton icon={Copy} label="Copy Code" onClick={() => navigator.clipboard.writeText(generatedCode)} />
                                                <ActionButton icon={Download} label="Download" onClick={() => {
                                                    const blob = new Blob([generatedCode], { type: 'text/plain' });
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `progenai-code-${Date.now()}.txt`;
                                                    link.click();
                                                    URL.revokeObjectURL(url);
                                                }} />
                                            </div>
                                        </div>
                                        <div className="bg-black/30 dark:bg-gray-800/30 rounded-lg p-4 border border-white/5 dark:border-gray-300/10 max-h-96 overflow-y-auto">
                                            <pre className="text-xs text-green-400 dark:text-green-500 font-mono leading-relaxed whitespace-pre-wrap">
                                                <code>{generatedCode}</code>
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Refinement Questions */}
                                {refinementQuestions.length > 0 && (
                                    <div className="glass-panel rounded-xl p-4 border border-[#ff32b8]/20 dark:border-[#cc2670]/20">
                                        <h4 className="text-sm font-medium text-[#ff32b8] dark:text-[#cc2670] mb-3 flex items-center gap-2">
                                            <Wand2 size={16} />
                                            Refine Your Prompt
                                        </h4>
                                        <div className="space-y-3">
                                            {refinementQuestions.map((question, index) => (
                                                <div key={index} className="space-y-2">
                                                    <label className="text-xs text-gray-300 dark:text-gray-600 block font-medium">{question}</label>
                                                    <input
                                                        type="text"
                                                        value={refinementAnswers[question] || ''}
                                                        onChange={(e) => setRefinementAnswers({ ...refinementAnswers, [question]: e.target.value })}
                                                        className="input-field w-full text-xs"
                                                        placeholder="Your answer..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={refinePrompt}
                                            disabled={isRefining || Object.keys(refinementAnswers).length === 0}
                                            className="w-full mt-3 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2"
                                        >
                                            {isRefining ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={14} />
                                                    Refining...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 size={14} />
                                                    Refine Prompt
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Ratings Section */}
                                {result && (
                                    <div className="glass-panel rounded-xl p-4 border border-[#00e5ff]/20 dark:border-[#00a8cc]/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-[#00e5ff] dark:text-[#00a8cc]">Rate this prompt:</span>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRating(star)}
                                                        className={`transition-all duration-200 ${
                                                            rating >= star ? 'text-yellow-400 dark:text-yellow-500 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-yellow-400 dark:hover:text-yellow-500 hover:scale-105'
                                                        }`}
                                                    >
                                                        <Star size={18} fill={rating >= star ? 'currentColor' : 'none'} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                </div>

                {/* Right Panel - Conversation History */}
                <div className="w-96 glass-panel rounded-2xl p-4 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white dark:text-gray-800 flex items-center gap-2">
                            <MessageCircle size={20} />
                            History
                        </h3>
                        <button
                            onClick={() => setChatHistory([])}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 dark:text-red-600 rounded-lg text-xs font-medium border border-red-500/30 dark:border-red-400/30 transition-all"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {chatHistory.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No conversations yet</p>
                            </div>
                        ) : (
                            chatHistory.map((message, index) => (
                                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                                        message.type === 'user'
                                            ? 'bg-gradient-to-r from-[#00e5ff]/20 to-[#ff32b8]/20 dark:from-[#00e5ff]/30 dark:to-[#ff32b8]/30 text-white dark:text-gray-800 border border-[#00e5ff]/30'
                                            : 'bg-white/5 dark:bg-gray-200/20 text-gray-300 dark:text-gray-700 border border-white/10 dark:border-gray-300/20'
                                    }`}>
                                        <p className="leading-relaxed">{message.content.substring(0, 150)}{message.content.length > 150 ? '...' : ''}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                            {message.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default Generator;
