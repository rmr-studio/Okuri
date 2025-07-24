import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
                    Your Everything App
                    <br />
                    <span className="text-gray-400">for Client, Invoice and Report Management</span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10">
                    Okare, an open-source platform, serves as an all-in-one solution for all
                    independant business with free flowing, structureless, template based management
                    solutions.
                </p>
                <Button className="relative group px-8 py-6 text-lg bg-gradient-to-r from-primary to-primary/40 hover:opacity-90">
                    <span className="relative z-10">Try it free</span>
                    <div className="absolute inset-0 bg-white/20 blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                </Button>
            </div>
        </div>
    );
}
