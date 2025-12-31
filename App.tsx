import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ThemeType, ModelType, ChatMessage } from './types';
import { registerUser, loginUser, getSystemStats } from './services/authService';
import { generateStudentResponse, startLiveSession, endLiveSession } from './services/geminiService';
import { SUBJECTS, AVAILABLE_MODELS, PENTEST_URL } from './constants';
import NelaAssistant from './components/NelaAssistant';
import { 
  Send, Paperclip, Mic, Video, Image as ImageIcon, 
  Settings, LogOut, Search, User as UserIcon, Atom, Brain, Calculator, Globe, Zap, Database, BarChart3, TrendingUp, Phone, PhoneOff, Radio
} from 'lucide-react';

// Floating Background Symbols
const BACKGROUND_SYMBOLS = [
  '∑', 'π', '√', '∞', '⚛️', '🧬', '🔭', '📐', '🧪', '🌍', '💻', '🎨', '🚀', '💡', '✖️', '➗'
];

const App: React.FC = () => {
  // --- State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<ThemeType>(ThemeType.DEFAULT);
  
  // Login/Reg Form State
  const [authId, setAuthId] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [regData, setRegData] = useState<UserProfile>({
    name: '', callName: '', age: 10, classGrade: '', 
    subjectPreference: SUBJECTS[0], aiGenderPref: 'girl', 
    language: 'English', email: ''
  });

  // UI States for interactivity
  const [isScanning, setIsScanning] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [titleText, setTitleText] = useState("QUANTUM GPT");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.AUTO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nelaSpeaking, setNelaSpeaking] = useState(false);
  const [isLiveCall, setIsLiveCall] = useState(false); // New: Live Call State
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{data: string, type: string} | null>(null);

  // --- Effects ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // "Hacker" Decoding Text Effect on Mount
  useEffect(() => {
    if (isLoggedIn) return;
    const originalText = "QUANTUM GPT";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let iterations = 0;
    
    const interval = setInterval(() => {
        setTitleText(originalText
            .split("")
            .map((letter, index) => {
                if (index < iterations) return originalText[index];
                return letters[Math.floor(Math.random() * letters.length)];
            })
            .join("")
        );
        
        if (iterations >= originalText.length) clearInterval(interval);
        iterations += 1/3;
    }, 50);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Cleanup live session on unmount or logout
  useEffect(() => {
      return () => {
          if (isLiveCall) {
              endLiveSession();
          }
      }
  }, [isLiveCall]);

  // --- Handlers ---

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLoggedIn) return;
    // Calculate tilt based on mouse position relative to center screen
    const x = (window.innerWidth / 2 - e.clientX) / 40;
    const y = (window.innerHeight / 2 - e.clientY) / 40;
    setTilt({ x, y });
  };

  const toggleLiveCall = () => {
      if (isLiveCall) {
          // Stop Call
          endLiveSession();
          setIsLiveCall(false);
          setNelaSpeaking(false);
      } else {
          // Start Call
          setIsLiveCall(true);
          startLiveSession(
              (speaking) => setNelaSpeaking(speaking),
              (error) => {
                  alert("Live Call Error: " + error);
                  setIsLiveCall(false);
                  setNelaSpeaking(false);
              }
          );
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setLoginStatus('Initializing Quantum Handshake...');

    setTimeout(async () => {
        setLoginStatus('Verifying Biometric Data...');
        setTimeout(async () => {
            const user = await loginUser(authId, authPass);
            if (user) {
              setLoginStatus('Access Granted. Welcome.');
              setTimeout(() => {
                  setCurrentUser(user);
                  setIsLoggedIn(true);
                  setIsScanning(false);
                  if (user.aiGenderPref === 'girl') setTheme(ThemeType.GIRLS_INTERACTIVE);
                  else setTheme(ThemeType.BOYS_INTERACTIVE);
                  
                  setMessages([{
                    id: 'init', role: 'model', timestamp: Date.now(),
                    content: `Hello ${user.callName}! I am Nela, your Quantum AI Assistant. Ready to study ${user.subjectPreference}?`
                  }]);
              }, 800);
            } else {
              setLoginStatus('Access Denied: Invalid Credentials');
              setIsScanning(false);
              alert("Invalid ID or Password. Note: Password requires specific salting if creating manually.");
            }
        }, 1000);
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPass) { alert("Password required"); return; }
    
    setIsScanning(true);
    setLoginStatus('Creating Quantum Identity...');

    setTimeout(async () => {
        const newId = regData.email.split('@')[0] + Math.floor(Math.random() * 1000);
        const finalProfile = { ...regData, id: newId };
        await registerUser(finalProfile, authPass);
        setLoginStatus('Identity Created Successfully.');
        alert(`Registration Successful! Your ID is: ${newId}`);
        setIsRegistering(false);
        setAuthId(newId);
        setIsScanning(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          data: reader.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
      attachments: selectedFile ? [{
        name: 'upload', 
        type: selectedFile.type.startsWith('image') ? 'image' : 'file', 
        url: selectedFile.data 
      }] : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    const currentFile = selectedFile; 
    setSelectedFile(null);
    setIsProcessing(true);
    setNelaSpeaking(true);

    if (newUserMsg.content.toLowerCase().includes('pentest') || newUserMsg.content.toLowerCase().includes('hack')) {
       setTimeout(() => {
         window.open(PENTEST_URL, '_blank');
         setMessages(prev => [...prev, {
           id: Date.now().toString(), role: 'model', timestamp: Date.now(),
           content: "Connecting you to Pentest.org security resources automatically..."
         }]);
         setIsProcessing(false);
         setNelaSpeaking(false);
       }, 1000);
       return;
    }

    if (newUserMsg.content.toLowerCase().includes('open website')) {
        const words = newUserMsg.content.split(' ');
        const url = words.find(w => w.includes('.com') || w.includes('http'));
        if (url) {
             const finalUrl = url.startsWith('http') ? url : `https://${url}`;
             window.open(finalUrl, '_blank');
             setMessages(prev => [...prev, {
                id: Date.now().toString(), role: 'model', timestamp: Date.now(),
                content: `Opening ${finalUrl} for you instantly.`
             }]);
             setIsProcessing(false);
             setNelaSpeaking(false);
             return;
        }
    }

    const responseText = await generateStudentResponse(
      messages, 
      newUserMsg.content, 
      currentUser!.age,
      currentUser!.id!, 
      currentFile?.data.split(',')[1],
      currentFile?.type
    );

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: responseText,
      timestamp: Date.now()
    }]);

    setIsProcessing(false);
    setTimeout(() => setNelaSpeaking(false), 3000); 
  };

  const getPowerLevel = (text: string) => Math.min(100, (text.length / 10) * 100);

  // --- Render ---

  // 1. Interactive Auth Screen
  if (!isLoggedIn) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black text-white font-sans perspective-1000"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0"></div>
             <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/3/31/Grid_graph_5x5.svg')] opacity-10 bg-repeat bg-[length:50px_50px] animate-pulse"></div>
        </div>

        <div className="absolute inset-0 z-0 overflow-hidden">
            {BACKGROUND_SYMBOLS.map((sym, i) => (
                 <div key={i} className="float-symbol hover-pop absolute text-4xl text-cyan-500/30 select-none transition-colors duration-300"
                      style={{
                          left: `${Math.random() * 90 + 5}%`,
                          top: `${Math.random() * 90 + 5}%`,
                          animationDelay: `${Math.random() * 5}s`,
                          fontSize: `${Math.random() * 40 + 20}px`
                      }}>
                     {sym}
                 </div>
             ))}
        </div>

        <div 
            className="z-10 w-full max-w-md transition-transform duration-100 ease-out"
            style={{ 
                transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                perspective: '1000px'
            }}
        >
            <div className="bg-gray-900/60 backdrop-blur-xl p-8 rounded-2xl border border-cyan-500 shadow-[0_0_50px_rgba(0,255,255,0.3)] rgb-border-animate relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_80px_rgba(0,255,255,0.4)]">
              {isScanning && <div className="scanner-bar z-20"></div>}
              <div className="text-center mb-8 relative">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,255,255,0.5)] animate-bounce">
                      <Atom size={40} className="text-white spin-slow" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-400 tracking-wider h-10">
                    {titleText}
                  </h1>
                  <p className="text-cyan-400 text-xs font-mono mt-1 tracking-widest uppercase">Student Access Portal</p>
              </div>

              <div className="flex justify-center mb-6 bg-gray-800/50 rounded-lg p-1">
                <button 
                  onClick={() => setIsRegistering(false)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all ${!isRegistering ? 'bg-cyan-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setIsRegistering(true)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all ${isRegistering ? 'bg-cyan-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white'}`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4 relative z-10">
                {isRegistering ? (
                  <div className="space-y-3 animate-fade-in-up">
                     <div className="group relative">
                        <UserIcon size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                        <input required type="text" placeholder="Full Name" className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] outline-none transition-all text-white" 
                            onChange={e => setRegData({...regData, name: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <input required type="text" placeholder="Call Name" className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 outline-none focus:border-cyan-500 text-white transition-all"
                          onChange={e => setRegData({...regData, callName: e.target.value})} />
                        <input required type="number" placeholder="Age" className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 outline-none focus:border-cyan-500 text-white transition-all"
                          onChange={e => setRegData({...regData, age: parseInt(e.target.value)})} />
                     </div>
                     <select className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 outline-none text-gray-300 focus:border-cyan-500 transition-all cursor-pointer hover:bg-black/70"
                       onChange={e => setRegData({...regData, subjectPreference: e.target.value})}>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     <select className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 outline-none text-gray-300 focus:border-cyan-500 transition-all cursor-pointer hover:bg-black/70"
                       onChange={e => setRegData({...regData, aiGenderPref: e.target.value as any})}>
                        <option value="girl">AI Preference: Girl 👩</option>
                        <option value="boy">AI Preference: Boy 👨</option>
                     </select>
                     <input required type="email" placeholder="Gmail Address" className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 outline-none focus:border-cyan-500 text-white transition-all"
                       onChange={e => setRegData({...regData, email: e.target.value})} />
                  </div>
                ) : (
                   <div className="space-y-4 animate-fade-in-up">
                       <div className="group relative">
                            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-cyan-400 transition-colors">ID</div>
                            <input required type="text" placeholder="Example: Nuke.nuke" value={authId} onChange={e => setAuthId(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] outline-none transition-all text-white font-mono tracking-wider" />
                            <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${getPowerLevel(authId)}%` }}></div>
                            </div>
                       </div>
                   </div>
                )}
                <div className="group relative">
                    <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-cyan-400 transition-colors">🔑</div>
                    <input required type="password" placeholder="Password (Neo...)" value={authPass} onChange={e => setAuthPass(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 pl-10 focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] outline-none transition-all text-white" />
                    <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                         <div 
                             className={`h-full transition-all duration-300 ${authPass.length > 8 ? 'bg-green-500' : authPass.length > 5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                             style={{ width: `${getPowerLevel(authPass)}%` }}>
                         </div>
                    </div>
                </div>
                <button type="submit" disabled={isScanning} className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group">
                  {isScanning ? (
                      <span className="flex items-center justify-center space-x-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          <span>Processing...</span>
                      </span>
                  ) : (
                      <span className="flex items-center justify-center gap-2">
                        {isRegistering ? 'Initialize Student ID' : 'Initiate Sequence'}
                        <Zap size={18} className="group-hover:text-yellow-300 transition-colors" />
                      </span>
                  )}
                </button>
                {loginStatus && (
                    <div className="text-center text-xs font-mono text-cyan-400 mt-2 animate-pulse">
                        {">"} {loginStatus}
                    </div>
                )}
              </form>
            </div>
        </div>
        <div className="absolute bottom-4 text-center w-full text-gray-600 text-xs font-mono pointer-events-none">
             SECURE CONNECTION • QUANTUM ENCRYPTION ENABLED
        </div>
      </div>
    );
  }

  // 2. Developer Dashboard View (Special Access)
  if (currentUser?.id === 'Dev_647') {
    const stats = getSystemStats();
    
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center border-b border-green-500 pb-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Database /> SYSTEM_CORE_ACCESS</h1>
                    <p className="text-sm opacity-70">Dev_647 • Root Privileges Active</p>
                </div>
                <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10">
                    TERMINATE_SESSION
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-green-500/30 p-6 rounded-lg">
                    <h3 className="text-sm text-gray-400 flex items-center gap-2"><UserIcon size={16}/> TOTAL_USERS</h3>
                    <p className="text-5xl font-bold mt-2">{stats.totalUsers}</p>
                </div>
                <div className="bg-gray-900 border border-green-500/30 p-6 rounded-lg">
                    <h3 className="text-sm text-gray-400 flex items-center gap-2"><BarChart3 size={16}/> TOTAL_API_CALLS</h3>
                    <p className="text-5xl font-bold mt-2">{stats.totalUsage}</p>
                </div>
                <div className="bg-gray-900 border border-green-500/30 p-6 rounded-lg">
                    <h3 className="text-sm text-gray-400 flex items-center gap-2"><TrendingUp size={16}/> HIGHEST_USAGE</h3>
                    <div className="mt-2">
                        <p className="text-2xl font-bold text-white">{stats.topUser?.name || "N/A"}</p>
                        <p className="text-xl text-green-400">{stats.topUser?.usage || 0} calls</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">USER_DATABASE_REGISTRY <span className="text-xs font-normal opacity-50 ml-auto animate-pulse">LIVE_FEED</span></h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-green-500/20 text-gray-400">
                                <th className="p-3">USER_ID</th>
                                <th className="p-3">NAME</th>
                                <th className="p-3 text-right">API_USAGE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.allUsers.map((u, i) => (
                                <tr key={i} className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors">
                                    <td className="p-3 font-bold">{u.id}</td>
                                    <td className="p-3 text-white">{u.name}</td>
                                    <td className="p-3 text-right font-mono text-cyan-400">{u.usage}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // 3. Main Interface (Student View)
  return (
    <div className={`relative min-h-screen flex flex-col overflow-hidden
      ${theme === ThemeType.GIRLS_INTERACTIVE ? 'bg-gradient-to-br from-pink-900 via-purple-900 to-black' : ''}
      ${theme === ThemeType.BOYS_INTERACTIVE ? 'bg-gradient-to-br from-blue-900 via-slate-900 to-black' : ''}
      ${theme === ThemeType.DEFAULT ? 'bg-black' : ''}
    `}>
      {/* RGB Border Wrapper */}
      <div className={`absolute inset-0 pointer-events-none z-50 border-[10px] border-transparent transition-opacity duration-1000 ${isLiveCall ? 'opacity-100 border-green-500/30 animate-pulse' : 'rgb-border-animate opacity-50'}`}></div>

      {/* Floating Assistant - Nela is active when Speaking */}
      <NelaAssistant user={currentUser!} isSpeaking={nelaSpeaking} />

      {/* Header */}
      <header className="bg-black/40 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center z-40">
        <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-colors ${isLiveCall ? 'bg-green-500 animate-pulse' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}>
                {isLiveCall ? <Radio size={20} className="animate-spin" /> : 'Q'}
            </div>
            <div>
                <h1 className="font-bold text-lg text-white">Hossain Azmal Quantum GPT</h1>
                <p className="text-xs text-cyan-400">Student Edition • {currentUser?.callName} • {currentUser?.age}yo</p>
            </div>
        </div>
        
        <div className="flex items-center space-x-4">
            {isLiveCall && <div className="text-green-400 text-xs font-mono animate-pulse uppercase border border-green-500 px-2 py-1 rounded">Voice Mode Active</div>}
            
            <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as ThemeType)}
                className="bg-gray-800 text-white text-xs rounded p-2 border border-gray-600 outline-none"
            >
                {Object.values(ThemeType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="text-red-400 hover:text-red-300">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 z-10 pb-32">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl p-4 shadow-lg transition-all hover:scale-[1.01]
                    ${msg.role === 'user' 
                        ? 'bg-cyan-900/80 text-white rounded-br-none border border-cyan-500/30' 
                        : 'bg-gray-900/90 text-gray-100 rounded-bl-none border border-white/10'
                    }`}>
                    {msg.attachments && msg.attachments.map((att, idx) => (
                        <div key={idx} className="mb-2 rounded overflow-hidden border border-white/20">
                            {att.type === 'image' && <img src={att.url} alt="upload" className="max-h-48 object-contain" />}
                        </div>
                    ))}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
            </div>
        ))}
        {isProcessing && (
             <div className="flex justify-start">
                <div className="bg-gray-900/90 text-cyan-400 p-4 rounded-2xl rounded-bl-none text-sm animate-pulse border border-cyan-500/20 flex items-center space-x-2">
                    <Brain size={16} className="animate-pulse" />
                    <span>Nela is thinking...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer / Input */}
      <footer className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 z-40">
        <div className="max-w-4xl mx-auto space-y-2">
            
            {/* Model Selector & Tools */}
            <div className="flex justify-between items-center px-2">
                <div className="flex space-x-2">
                     <select 
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                        className="bg-gray-800 text-xs text-gray-300 rounded px-2 py-1 border border-gray-600 outline-none focus:border-cyan-500"
                     >
                        {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                     </select>
                </div>
                <div className="flex space-x-2 text-gray-400">
                     <span className="text-xs flex items-center gap-1"><Globe size={10} /> Secure Network</span>
                </div>
            </div>

            {/* Input Bar */}
            <div className={`relative flex items-center bg-gray-800/80 border rounded-2xl transition-all p-2 ${isLiveCall ? 'border-green-500/50 shadow-[0_0_20px_rgba(0,255,0,0.2)]' : 'border-gray-600 focus-within:border-cyan-400'}`}>
                {/* File Upload Hidden Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*,.pdf,.doc"
                    onChange={handleFileUpload}
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${selectedFile ? 'text-green-400' : 'text-gray-400'}`}
                    title="Upload File/Image"
                    disabled={isLiveCall}
                >
                    <Paperclip size={20} />
                </button>

                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={isLiveCall ? "Listening..." : "Ask Nela anything... (Math, Science, History)"}
                    disabled={isLiveCall}
                    className="flex-1 bg-transparent text-white px-3 py-2 outline-none resize-none h-12 flex items-center placeholder-gray-500 disabled:opacity-50"
                />
                
                {/* Live Call Toggle */}
                <button 
                    onClick={toggleLiveCall}
                    className={`p-2 rounded-full mx-1 transition-all ${isLiveCall ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40 animate-pulse' : 'text-gray-400 hover:text-green-400'}`}
                    title={isLiveCall ? "End Call" : "Voice Call Nela"}
                >
                    {isLiveCall ? <PhoneOff size={20} /> : <Phone size={20} />}
                </button>

                <button 
                    onClick={sendMessage}
                    disabled={isProcessing || isLiveCall || (!inputValue && !selectedFile)}
                    className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl ml-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send size={20} />
                </button>
            </div>
            {/* Visual indicator for lighter middle border requested */}
            <div className="absolute inset-x-0 -top-1 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        </div>
      </footer>
    </div>
  );
};

export default App;