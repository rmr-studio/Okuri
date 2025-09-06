"use client";

import { ClassNameProps, FCWC } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { MeshGradient } from "@paper-design/shaders-react";
import { useRef } from "react";

interface Props extends ClassNameProps {
    colors?: string[];
    speed?: number;
    backgroundColor?: string;
    wireframe?: boolean | string;
}

const ShaderPageContainer: FCWC<Props> = ({ children, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const lightModeColors = ["#78716c", "#ea580c", "#a8a29e", "#c2410c", "#7c2d12"];
    const darkModeColors = ["#0c0a09", "#ea580c", "#1c1917", "#9a3412", "#451a03"];

    return (
        <div
            ref={containerRef}
            className={cn(`min-h-screen w-full bg-neutral-950 relative overflow-hidden`, className)}
        >
            {/* SVG Filters */}
            <svg className="absolute inset-0 w-0 h-0">
                <defs>
                    <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0.05
                      0.8 0 0 0 0.03
                      0.6 0 0 0 0.01
                      0 0 0 0.9 0"
                            result="tint"
                        />
                    </filter>

                    <filter id="film-grain-high" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" seed="1" />
                        <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise" />
                        <feComponentTransfer in="monoNoise" result="grain">
                            <feFuncA type="discrete" tableValues="0.88 0.90 0.92 0.94 0.96" />
                        </feComponentTransfer>
                        <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
                    </filter>

                    <filter id="film-grain-medium" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence baseFrequency="0.6" numOctaves="3" result="noise" seed="2" />
                        <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise" />
                        <feComponentTransfer in="monoNoise" result="grain">
                            <feFuncA type="discrete" tableValues="0.75 0.80 0.85 0.88 0.90 0.92" />
                        </feComponentTransfer>
                        <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
                    </filter>

                    <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="gooey"
                        />
                        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                    </filter>
                </defs>
            </svg>

            <MeshGradient
                className="absolute inset-0 w-full h-full opacity-30"
                colors={darkModeColors}
                speed={0.2}
                // backgroundColor="#0c0a09"
            />

            <div
                className="absolute inset-0 w-full h-full opacity-10 pointer-events-none backdrop-blur-sm"
                style={{ filter: "url(#film-grain-medium)" }}
            />

            {children}
        </div>
    );
};

export default ShaderPageContainer;
