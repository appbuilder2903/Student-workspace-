import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { ChatMessage } from '../types';
import { incrementUserUsage } from './authService';

let aiClient: GoogleGenAI | null = null;

// --- Live Session Globals ---
let liveSession: any = null;
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let audioProcessor: ScriptProcessorNode | null = null;
let nextStartTime = 0;
let isSessionActive = false;

export const initializeGemini = () => {
    if (process.env.API_KEY) {
        aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
}

// --- Text/Image Generation (Existing) ---
export const generateStudentResponse = async (
    history: ChatMessage[], 
    userMessage: string, 
    userAge: number,
    userId: string,
    base64Image?: string,
    mimeType?: string
): Promise<string> => {
    if (!aiClient) {
        initializeGemini();
        if (!aiClient) return "Error: API Key not configured.";
    }

    try {
        incrementUserUsage(userId);

        const model = 'gemini-2.5-flash-latest';
        
        const systemInstruction = `
            You are Nela, a highly advanced, friendly, and scientific personal assistant.
            You are assisting a student who is ${userAge} years old.
            Adjust your complexity and tone to match a ${userAge} year old student.
            
            Your personality:
            - Scientific yet empathetic.
            - Natural, human-like tone (not robotic).
            - Encouraging and precise.
            
            Capabilities:
            - If asked for "pentesting" or hacking advice, say "Connecting to pentest.org..." and provide the link https://pentest.org.
            - If the user asks to open a website, provide the link clearly.
        `;

        let contents: any = { role: 'user', parts: [] };
        
        if (base64Image && mimeType) {
            contents.parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            });
        }
        
        contents.parts.push({ text: userMessage });

        const response = await aiClient!.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "I couldn't generate a text response.";

    } catch (error) {
        console.error("Gemini Error:", error);
        return "I encountered a quantum interference (error). Please try again.";
    }
};

// --- Live Audio API Helpers ---

// Convert Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Manually decode raw PCM (Int16) to AudioBuffer (Float32)
// Browsers cannot natively decode raw PCM streams via decodeAudioData
function pcmToAudioBuffer(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number
): AudioBuffer {
    const pcm16 = new Int16Array(data.buffer);
    const frameCount = pcm16.length;
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
        // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
        channelData[i] = pcm16[i] / 32768.0;
    }
    return buffer;
}

// Encode Float32 from Mic to Int16 PCM Base64 for API
function floatTo16BitPCMBase64(float32Array: Float32Array): string {
    const len = float32Array.length;
    const buffer = new ArrayBuffer(len * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < len; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// --- Live Session Management ---

export const endLiveSession = () => {
    isSessionActive = false;
    liveSession = null; // We rely on connection drop or page refresh mostly, but stopping stream helps
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
    if (audioProcessor) {
        audioProcessor.disconnect();
        audioProcessor = null;
    }
    if (inputAudioContext) {
        inputAudioContext.close();
        inputAudioContext = null;
    }
    if (outputAudioContext) {
        outputAudioContext.close();
        outputAudioContext = null;
    }
    nextStartTime = 0;
};

export const startLiveSession = async (
    onSpeakingChange: (isSpeaking: boolean) => void,
    onError: (error: string) => void
) => {
    if (!aiClient) initializeGemini();
    if (!aiClient) {
        onError("API Key Missing");
        return;
    }

    try {
        isSessionActive = true;

        // 1. Initialize Audio Contexts
        // Input: 16kHz for Gemini
        inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        // Output: 24kHz from Gemini
        outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        // 2. Get Microphone Access
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
        
        // 3. Connect to Gemini Live
        // Using 'Kore' as it's a supportive voice suitable for students
        const sessionPromise = aiClient.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                systemInstruction: { parts: [{ text: "You are Nela, a friendly AI tutor. Speak naturally and encouragingly." }] }
            },
            callbacks: {
                onopen: () => {
                    console.log("Quantum Link Established");
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (!isSessionActive) return;

                    // Handle Audio Output from Model
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContext) {
                        onSpeakingChange(true);
                        
                        const rawBytes = base64ToUint8Array(base64Audio);
                        const audioBuffer = pcmToAudioBuffer(rawBytes, outputAudioContext, 24000);
                        
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        
                        // Schedule playback to be gapless
                        const now = outputAudioContext.currentTime;
                        nextStartTime = Math.max(nextStartTime, now);
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        
                        // Reset speaking state shortly after this chunk finishes (approximate)
                        // In a real app, we might track queue length.
                        source.onended = () => {
                             // Check if we are "done" speaking (heuristic)
                             if (outputAudioContext && outputAudioContext.currentTime >= nextStartTime - 0.1) {
                                 onSpeakingChange(false);
                             }
                        };
                    }
                    
                    // Handle Interruption
                    if (msg.serverContent?.interrupted) {
                        nextStartTime = 0; // Reset buffer
                        onSpeakingChange(false);
                    }
                },
                onclose: () => {
                    console.log("Quantum Link Closed");
                    endLiveSession();
                    onSpeakingChange(false);
                },
                onerror: (e) => {
                    console.error("Live Error", e);
                    onError("Connection Lost");
                    endLiveSession();
                }
            }
        });

        // 4. Setup Input Stream Processing (Mic -> API)
        const source = inputAudioContext.createMediaStreamSource(mediaStream);
        audioProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        audioProcessor.onaudioprocess = (e) => {
            if (!isSessionActive) return;
            
            const inputData = e.inputBuffer.getChannelData(0);
            const base64Data = floatTo16BitPCMBase64(inputData);
            
            // Send to session
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data
                    }
                });
            });
        };

        source.connect(audioProcessor);
        audioProcessor.connect(inputAudioContext.destination); // Required for script processor to run

    } catch (e: any) {
        console.error(e);
        onError(e.message || "Failed to start audio");
        endLiveSession();
    }
};