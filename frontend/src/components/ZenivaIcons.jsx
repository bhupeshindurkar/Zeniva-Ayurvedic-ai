import React from 'react';

// Zeniva Golden Lotus Logo
export const ZenivaLogo = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer Sacred Lotus Petals */}
    <path d="M50 12 C53 28 64 38 78 40 C66 48 58 60 50 82 C42 60 34 48 22 40 C36 38 47 28 50 12 Z" stroke="#E5C07B" strokeWidth="2.5" fill="none" />
    <path d="M50 24 C52 35 60 42 70 44 C61 50 55 58 50 72 C45 58 39 50 30 44 C40 42 48 35 50 24 Z" stroke="#D4AF37" strokeWidth="2" fill="rgba(212, 175, 55, 0.1)" />
    <path d="M50 36 C51 43 56 48 62 50 C56 54 52 60 50 66 C48 60 44 54 38 50 C44 48 49 43 50 36 Z" fill="#D4AF37" />
    {/* Lotus Side Blossoms */}
    <path d="M22 40 C15 50 18 64 30 70 C34 60 38 52 44 46 C35 44 28 42 22 40 Z" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <path d="M78 40 C85 50 82 64 70 70 C66 60 62 52 56 46 C65 44 72 42 78 40 Z" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    {/* Base Lotus Leaf Crescent */}
    <path d="M20 72 C32 84 68 84 80 72 C68 78 32 78 20 72 Z" fill="#E5C07B" />
  </svg>
);

// Glowing Meditating Yogi with Chakras Illustration
export const MeditatingYogi = ({ className = "w-36 h-36" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-600/30 via-indigo-500/20 to-amber-400/20 blur-xl"></div>
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 chakra-glow">
      {/* Halo and Sacred Geometry */}
      <circle cx="100" cy="100" r="82" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
      <circle cx="100" cy="100" r="72" stroke="url(#purpleGrad)" strokeWidth="1.5" opacity="0.8" />
      <circle cx="100" cy="100" r="62" stroke="#E5C07B" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
      
      {/* Aura Rays */}
      <g opacity="0.7">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
          <line key={i} x1="100" y1="100" x2={100 + 78 * Math.cos(deg * Math.PI / 180)} y2={100 + 78 * Math.sin(deg * Math.PI / 180)} stroke="#D4AF37" strokeWidth="0.6" strokeDasharray="2 6" />
        ))}
      </g>

      {/* Yogi Silhouette in Padmasana */}
      {/* Head */}
      <ellipse cx="100" cy="62" rx="10" ry="12" fill="#1C1030" stroke="#D4AF37" strokeWidth="1.2" />
      {/* Crown Topknot */}
      <circle cx="100" cy="48" r="4" fill="#D4AF37" />
      {/* Torso */}
      <path d="M90 76 C86 86 86 108 84 122 C92 124 108 124 116 122 C114 108 114 86 110 76 C104 74 96 74 90 76 Z" fill="#1C1030" stroke="#D4AF37" strokeWidth="1.2" />
      {/* Shoulders & Arms in Mudra */}
      <path d="M90 76 C76 82 66 98 70 114 C73 124 82 128 88 124 C85 116 83 104 88 94" fill="#1C1030" stroke="#D4AF37" strokeWidth="1.2" />
      <path d="M110 76 C124 82 134 98 130 114 C127 124 118 128 112 124 C115 116 117 104 112 94" fill="#1C1030" stroke="#D4AF37" strokeWidth="1.2" />
      {/* Crossed Legs (Lotus Pose) */}
      <path d="M84 122 C70 124 54 136 56 148 C58 156 80 156 100 154 C120 156 142 156 144 148 C146 136 130 124 116 122 C108 126 92 126 84 122 Z" fill="#1C1030" stroke="#D4AF37" strokeWidth="1.2" />

      {/* Radiant Chakras */}
      {/* Sahasrara (Crown) */}
      <circle cx="100" cy="54" r="3.5" fill="#E9D5FF" stroke="#A855F7" strokeWidth="1" />
      {/* Ajna (Third Eye) */}
      <circle cx="100" cy="63" r="2.5" fill="#C084FC" />
      {/* Vishuddha (Throat) */}
      <circle cx="100" cy="74" r="2.5" fill="#60A5FA" />
      {/* Anahata (Heart - Radiant Gold Core) */}
      <circle cx="100" cy="90" r="5" fill="#FDE047" stroke="#EAB308" strokeWidth="1.5" />
      <circle cx="100" cy="90" r="9" stroke="#FACC15" strokeWidth="0.8" opacity="0.6" />
      {/* Manipura (Solar Plexus) */}
      <circle cx="100" cy="104" r="3" fill="#F97316" />
      {/* Svadhisthana (Sacral) */}
      <circle cx="100" cy="116" r="3" fill="#EF4444" />
      {/* Muladhara (Root) */}
      <circle cx="100" cy="132" r="3.5" fill="#DC2626" />

      {/* Lotus Pedestal Base */}
      <path d="M68 152 C80 162 120 162 132 152 C124 158 76 158 68 152 Z" fill="#D4AF37" />

      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5E9BF" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#AA820A" />
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C084FC" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Ayurvedic Tree of Life with 3 Clinical Health Hubs
export const AyurvedicTreeOfLife = ({ stress = 25, joints = 85, vitality = 90, onSelectNode }) => (
  <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
    {/* Subtle connection circle */}
    <div className="absolute inset-8 rounded-full border border-dashed border-stone-300 pointer-events-none"></div>

    {/* Center Sacred Banyan / Neem Tree Graphic */}
    <div className="relative z-10 w-44 h-44 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-md">
        {/* Tree Trunk & Roots */}
        <path d="M96 168 C96 142 90 128 92 110 C93 100 85 90 78 84 C86 86 94 92 98 100 C100 88 102 76 102 68 C104 78 107 88 110 98 C116 90 122 84 130 82 C122 88 115 98 116 110 C118 128 112 142 112 168 C106 166 102 166 96 168 Z" fill="#6B4F35" />
        <path d="M96 168 C90 172 82 176 74 178 C84 175 92 171 96 168 Z" fill="#4E3629" />
        <path d="M112 168 C118 172 126 176 134 178 C124 175 116 171 112 168 Z" fill="#4E3629" />
        
        {/* Lush Foliage Canopy */}
        <circle cx="100" cy="74" r="32" fill="#5F8D4E" opacity="0.9" />
        <circle cx="80" cy="82" r="24" fill="#49713C" opacity="0.85" />
        <circle cx="120" cy="80" r="25" fill="#75A463" opacity="0.85" />
        <circle cx="95" cy="56" r="22" fill="#88BA72" opacity="0.95" />
        <circle cx="112" cy="62" r="18" fill="#A4D089" opacity="0.8" />
        
        {/* Sacred Golden Leaf Flecks */}
        <circle cx="90" cy="68" r="2.5" fill="#FACC15" />
        <circle cx="108" cy="78" r="2" fill="#FDE047" />
        <circle cx="82" cy="90" r="2" fill="#FACC15" />
        <circle cx="118" cy="88" r="2.5" fill="#FDE047" />
      </svg>
    </div>

    {/* Top Node: STRESS & MIND */}
    <button 
      onClick={() => onSelectNode && onSelectNode('stress')}
      className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center group transition-all duration-300 hover:scale-110 focus:outline-none"
    >
      <div className="w-16 h-16 rounded-full bg-[#FAF5FF] border-2 border-purple-600 flex flex-col items-center justify-center shadow-md group-hover:shadow-lg">
        <span className="text-xl">🌙</span>
        <span className="text-[10px] font-bold text-purple-700 tracking-wider mt-0.5">STRESS</span>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-stone-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">{stress}%</span>
    </button>

    {/* Bottom Left Node: JOINTS */}
    <button 
      onClick={() => onSelectNode && onSelectNode('joints')}
      className="absolute bottom-2 left-6 flex flex-col items-center group transition-all duration-300 hover:scale-110 focus:outline-none"
    >
      <div className="w-16 h-16 rounded-full bg-[#F0F9FF] border-2 border-sky-600 flex flex-col items-center justify-center shadow-md group-hover:shadow-lg">
        <span className="text-xl">⚡</span>
        <span className="text-[10px] font-bold text-sky-700 tracking-wider mt-0.5">JOINTS</span>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-stone-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">{joints}%</span>
    </button>

    {/* Bottom Right Node: VITALITY / GUT */}
    <button 
      onClick={() => onSelectNode && onSelectNode('vitality')}
      className="absolute bottom-2 right-6 flex flex-col items-center group transition-all duration-300 hover:scale-110 focus:outline-none"
    >
      <div className="w-16 h-16 rounded-full bg-[#FFFBEB] border-2 border-amber-600 flex flex-col items-center justify-center shadow-md group-hover:shadow-lg">
        <span className="text-xl">🔥</span>
        <span className="text-[10px] font-bold text-amber-700 tracking-wider mt-0.5">VITALITY</span>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-stone-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">{vitality}%</span>
    </button>
  </div>
);

// Ayurvedic Mortar and Pestle / Panchakarma Vector Graphic
export const MortarPestleGraphic = ({ className = "w-20 h-20" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Herbal Leaves background */}
    <path d="M42 22 C36 12 24 16 22 26 C28 28 36 28 42 22 Z" fill="#689F38" />
    <path d="M50 18 C52 8 62 10 64 20 C58 22 52 22 50 18 Z" fill="#8BC34A" />
    
    {/* Pestle */}
    <rect x="52" y="14" width="12" height="42" rx="6" transform="rotate(32 52 14)" fill="#E0D6C6" stroke="#9E8D76" strokeWidth="1.5" />
    
    {/* Stone Mortar Bowl */}
    <path d="M22 48 C22 46 78 46 78 48 C78 72 66 82 50 82 C34 82 22 72 22 48 Z" fill="#5D6D7E" stroke="#34495E" strokeWidth="2" />
    <ellipse cx="50" cy="48" rx="28" ry="7" fill="#85929E" stroke="#34495E" strokeWidth="1.5" />
    
    {/* Crushed Ayurvedic Herbs inside */}
    <ellipse cx="50" cy="49" rx="20" ry="4" fill="#27AE60" />
    <circle cx="46" cy="50" r="1.5" fill="#F1C40F" />
    <circle cx="54" cy="49" r="1.5" fill="#E67E22" />
  </svg>
);

// Official Instagram Gradient Icon
export const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="zenivaIgGrad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#zenivaIgGrad)" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4.2" stroke="url(#zenivaIgGrad)" strokeWidth="2" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="url(#zenivaIgGrad)" />
  </svg>
);

export const InstagramSolidIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

