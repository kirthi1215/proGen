import React from 'react';
import { Star, User, Copy, Heart, Sparkles } from 'lucide-react';

const MOCK_PROMPTS = [
    {
        id: 1,
        title: "Cyberpunk Street Scene",
        prompt: "Neon-drenched rainy street in Tokyo, cyberpunk aesthetic, futuristic vehicles, holograms, 8k resolution, cinematic lighting, ray tracing...",
        author: "NeonUser",
        rating: 4.8,
        likes: 124,
        tags: ["Image", "Sci-Fi"]
    },
    {
        id: 2,
        title: "Professional Email Generator",
        prompt: "Act as a senior executive assistant. Draft a polite but firm email to a client regarding a delayed payment. Include the invoice number #12345...",
        author: "BizPro",
        rating: 4.9,
        likes: 89,
        tags: ["Text", "Business"]
    },
    {
        id: 3,
        title: "React Component Boilerplate",
        prompt: "Create a reusable React component for a data table with sorting, filtering, and pagination. Use TypeScript and Tailwind CSS. Include unit tests...",
        author: "DevGuru",
        rating: 4.7,
        likes: 256,
        tags: ["Code", "React"]
    },
    {
        id: 4,
        title: "Fantasy Landscape",
        prompt: "A sprawling fantasy landscape with floating islands, waterfalls cascading into the void, dragon flying in the distance, ethereal lighting...",
        author: "DreamWeaver",
        rating: 4.6,
        likes: 150,
        tags: ["Image", "Fantasy"]
    }
];

const Community = () => {
    return (
        <div id="community" className="w-full max-w-7xl mx-auto px-6 py-20 relative">
            {/* Section Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 mb-4">
                    <div className="logo-symbol">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold neon-logo">Community Prompts</h2>
                </div>
                <p className="text-gray-400 text-lg">Discover and remix top-rated prompts</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex justify-center gap-3 mb-10">
                <button className="px-5 py-2.5 glass-panel hover:border-[#00e5ff]/30 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all border border-white/10">
                    Top Rated
                </button>
                <button className="px-5 py-2.5 glass-panel hover:border-[#ff32b8]/30 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all border border-white/10">
                    Newest
                </button>
            </div>

            {/* Prompt Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PROMPTS.map((item) => (
                    <div key={item.id} className="glass-panel rounded-2xl p-6 hover:border-[#00e5ff]/30 transition-all group relative overflow-hidden">
                        {/* Gradient Top Border */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5ff] via-[#ff32b8] to-[#00e5ff]"></div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2 flex-wrap">
                                {item.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00e5ff]/10 to-[#ff32b8]/10 text-[#00e5ff] text-xs font-semibold border border-[#00e5ff]/30">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400 text-sm bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
                                <Star size={14} fill="currentColor" />
                                <span className="font-semibold">{item.rating}</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#00e5ff] transition-colors">
                            {item.title}
                        </h3>

                        <p className="text-gray-400 text-sm mb-6 line-clamp-3 font-mono bg-black/30 p-3 rounded-lg border border-white/5">
                            {item.prompt}
                        </p>

                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00e5ff] to-[#ff32b8] flex items-center justify-center text-xs text-white font-bold shadow-lg shadow-[#00e5ff]/30">
                                    {item.author[0]}
                                </div>
                                <span className="font-medium">{item.author}</span>
                            </div>

                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-[#ff32b8]/10 rounded-lg text-gray-400 hover:text-[#ff32b8] transition-all flex items-center gap-1 border border-transparent hover:border-[#ff32b8]/30">
                                    <Heart size={16} />
                                    <span className="text-xs font-medium">{item.likes}</span>
                                </button>
                                <button
                                    className="p-2 hover:bg-[#00e5ff]/10 rounded-lg text-gray-400 hover:text-[#00e5ff] transition-all border border-transparent hover:border-[#00e5ff]/30"
                                    onClick={() => navigator.clipboard.writeText(item.prompt)}
                                    title="Copy prompt"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Community;
