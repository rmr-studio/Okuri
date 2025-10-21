import MouseMoveEffect from "@/components/feature-modules/landing/components/mouse-move-effect";
import Navbar from "@/components/feature-modules/landing/components/navbar";
import ShaderPageContainer from "@/components/ui/background/shader-background";

export default function Home() {
    return (
        <>
            <MouseMoveEffect />
            <ShaderPageContainer>
                <div className="w-full min-h-screen relative bg-background/70 overflow-x-hidden flex flex-col justify-start items-center">
                    <div className="relative flex flex-col justify-start items-center w-full">
                        {/* Main container with proper margins */}
                        <div className="w-full min-h-screen max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
                            {/* Left vertical line */}
                            <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-foreground/50 shadow-[1px_0px_0px_white] z-0"></div>

                            {/* Right vertical line */}
                            <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-foreground/50  z-0"></div>

                            <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
                                <Navbar />
                            </div>
                        </div>
                    </div>
                    {/* <HomeNavbar />
                    <Hero />
                    <Features />
                    <CTA />
                    <Footer /> */}
                </div>
            </ShaderPageContainer>
        </>
    );
}
