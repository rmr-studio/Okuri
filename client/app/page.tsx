import CTA from "@/components/feature-modules/landing/components/CTA";
import Features from "@/components/feature-modules/landing/components/Features";
import Footer from "@/components/feature-modules/landing/components/Footer";
import Hero from "@/components/feature-modules/landing/components/Hero";
import MouseMoveEffect from "@/components/feature-modules/landing/components/mouse-move-effect";
import ShaderPageContainer from "@/components/ui/background/shader-background";
import { HomeNavbar } from "@/components/ui/nav/home.navbar";

export default function Home() {
    return (
        <>
            <MouseMoveEffect />

            <ShaderPageContainer>
                <div className="relative z-10">
                    <HomeNavbar />
                    <Hero />
                    <Features />
                    <CTA />
                    <Footer />
                </div>
            </ShaderPageContainer>
        </>
    );
}
