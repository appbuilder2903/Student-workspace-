import React, { useState, useEffect, useRef } from 'react';
import { ALL_AVATARS, NELA_DEFAULT_AVATAR } from '../constants';
import { UserProfile } from '../types';
import { Move, User, RefreshCcw, Camera, X } from 'lucide-react';

interface NelaProps {
  user: UserProfile;
  isSpeaking: boolean;
}

const NelaAssistant: React.FC<NelaProps> = ({ user, isSpeaking }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 150, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const assistantRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const changeAvatar = () => {
    // If custom image is active, clear it first to show emojis
    if (customImage) {
        setCustomImage(null);
        setAvatarIndex(1); // Start with first emoji
        return;
    }
    // 0 is the default Nela image, 1..N are emojis
    setAvatarIndex((prev) => (prev + 1) % (ALL_AVATARS.length + 1));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div
      ref={assistantRef}
      className="fixed z-50 cursor-move flex flex-col items-center group"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={handleFileUpload} 
      />

      <div className={`relative p-2 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all transform ${isSpeaking ? 'scale-110 animate-pulse shadow-[0_0_30px_rgba(0,255,255,0.8)]' : 'hover:scale-105'}`}>
        
        {/* Render Logic: Custom Image -> Default Image (Index 0) -> Emojis */}
        {customImage ? (
           <div className="w-20 h-20 rounded-full border-2 border-cyan-400 overflow-hidden relative bg-gray-900 shadow-inner">
               <img src={customImage} alt="Custom Nela" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent mix-blend-overlay pointer-events-none"></div>
           </div>
        ) : avatarIndex === 0 ? (
           <div className="w-20 h-20 rounded-full border-2 border-cyan-400 overflow-hidden relative bg-gray-900 shadow-inner">
               <img 
                 src={NELA_DEFAULT_AVATAR} 
                 alt="Nela" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                    console.warn("Nela image failed to load, switching to avatar mode");
                    changeAvatar(); 
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent mix-blend-overlay pointer-events-none"></div>
               <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/3/31/Grid_graph_5x5.svg')] opacity-20 bg-[length:10px_10px] pointer-events-none"></div>
           </div>
        ) : (
            <div className="w-20 h-20 flex items-center justify-center text-6xl select-none filter drop-shadow-lg bg-gray-800 rounded-full border-2 border-gray-600">
              {ALL_AVATARS[avatarIndex - 1]}
            </div>
        )}
        
        {/* Controls (Hidden unless hovered) */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 rounded-full px-3 py-1 border border-cyan-500/50 shadow-lg">
            <button 
                onClick={(e) => { e.stopPropagation(); changeAvatar(); }} 
                className="p-1.5 hover:text-cyan-400 text-white transition-colors" 
                title={customImage ? "Switch to Emojis" : "Next Avatar"}
            >
                <RefreshCcw size={14} />
            </button>
            <div className="w-[1px] h-4 bg-gray-600"></div>
            <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} 
                className="p-1.5 hover:text-green-400 text-white transition-colors" 
                title="Upload Custom Face"
            >
                <Camera size={14} />
            </button>
        </div>

        {/* Name Tag */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-cyan-900/80 text-cyan-100 text-xs px-2 py-1 rounded border border-cyan-500/50 backdrop-blur-sm shadow-[0_0_10px_rgba(0,255,255,0.2)]">
           {customImage ? 'Custom Nela' : 'Nela 2.0'}
        </div>
      </div>
      
      {/* Speech Bubble simulation if speaking */}
      {isSpeaking && (
        <div className="absolute top-0 right-full mr-4 bg-cyan-950/90 border border-cyan-500/30 backdrop-blur text-cyan-100 p-3 rounded-xl rounded-tr-none text-sm w-40 shadow-[0_0_20px_rgba(0,255,255,0.2)] animate-float">
            <div className="flex space-x-1 justify-center items-center h-4">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default NelaAssistant;