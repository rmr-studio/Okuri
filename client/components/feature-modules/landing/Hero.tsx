export default function Hero() {
    return (
        <main className="h-screen-without-header relative">
            <div className="absolute bottom-24 left-24 z-20 max-w-3xl">
                <div className="text-left">
                    <div
                        className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
                        style={{
                            filter: "url(#glass-effect)",
                        }}
                    >
                        <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                        <span className="text-white/90 text-xs font-light relative z-10">
                            ✨ A new client management experience
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
                        <span className="font-medium italic instrument">Next Generation</span>{" "}
                        Client
                        <br />
                        <span className="font-light tracking-tight text-white">
                            and Invoice Management
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-xs font-light text-white/70 mb-4 leading-relaxed">
                        Create stunning visual experiences with our advanced shader technology.
                        Interactive lighting, smooth animations, and beautiful effects that respond
                        to your every move.
                    </p>

                    {/* Buttons */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <button className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer">
                            Pricing
                        </button>
                        <button className="px-8 py-3 rounded-full bg-white text-black font-normal text-xs transition-all duration-200 hover:bg-white/90 cursor-pointer">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
