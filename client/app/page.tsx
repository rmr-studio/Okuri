import CTA from "@/components/feature-modules/landing/CTA";
import Features from "@/components/feature-modules/landing/Features";
import Footer from "@/components/feature-modules/landing/Footer";
import Hero from "@/components/feature-modules/landing/Hero";
import MouseMoveEffect from "@/components/feature-modules/landing/mouse-move-effect";
import { HomeNavbar } from "@/components/ui/nav/home.navbar";

export default function Home() {
    return (
        <>
            <MouseMoveEffect />
            <div className="relative min-h-screen">
                {/* Background gradients */}
                <div className="pointer-events-none fixed inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
                    <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-blue-500/10 blur-[100px]" />
                    <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-500/10 blur-[100px]" />
                </div>

                <div className="relative z-10">
                    <HomeNavbar />
                    <Hero />
                    <Features />
                    <CTA />
                    <Footer />
                </div>
            </div>
        </>
    );
}
