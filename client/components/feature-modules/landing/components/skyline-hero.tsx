"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type PhaseKey = "sunrise" | "day" | "sunset" | "night";
interface SkylineImage {
    key: PhaseKey;
    src: string;
    alt: string;
}

const SKYLINE_IMAGES: SkylineImage[] = [
    { key: "sunrise", src: "/static/SKYLINE-SUNRISE.png", alt: "City skyline at sunrise" },
    { key: "day", src: "/static/SKYLINE-DAY.png", alt: "City skyline during day" },
    { key: "sunset", src: "/static/SKYLINE-SUNSET.png", alt: "City skyline at sunset" },
    { key: "night", src: "/static/SKYLINE-NIGHT.png", alt: "City skyline at night" },
];

// Tunables
const FULL_CYCLE_MS = 3 * 60 * 1000; // 3 min loop for all 4 phases
const INITIAL_FADE_MS = 300; // quicker first fade feels snappier than 4s
const CROSSFADE_MS = 3000; // ongoing crossfade between phases

// --- Utilities --------------------------------------------------------------

function phaseIndexForDate(d: Date): number {
    const m = d.getHours() * 60 + d.getMinutes();
    if (m >= 5 * 60 && m < 9 * 60) return 0; // sunrise 05:00–08:59
    if (m >= 9 * 60 && m < 17 * 60) return 1; // day     09:00–16:59
    if (m >= 17 * 60 && m < 20 * 60) return 2; // sunset  17:00–19:59
    return 3; // night   20:00–04:59
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = () => setReduced(mq.matches);
        handler();
        mq.addEventListener?.("change", handler);
        return () => mq.removeEventListener?.("change", handler);
    }, []);
    return reduced;
}

// Preload an image in the background (helps avoid crossfade popping)
function preload(src: string) {
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
}

// Compute per-phase opacities given a fractional segment position [0..4)
function opacitiesForSegment(seg: number, count = SKYLINE_IMAGES.length) {
    const values = new Array(count).fill(0);
    const current = Math.floor(seg) % count;
    const next = (current + 1) % count;
    const intra = seg - Math.floor(seg);
    values[current] = 1 - intra;
    values[next] = intra;
    return values;
}

// --- Component --------------------------------------------------------------

export function SkylineHero() {
    // SSR: start at pure sunrise only.
    const [mode, setMode] = useState<"boot" | "fadeToClock" | "cycle">("boot");
    const [segment, setSegment] = useState(0); // [0..4) segment across all phases
    const [fadeMs, setFadeMs] = useState(CROSSFADE_MS);
    const [ready, setReady] = useState(false); // at least sunrise is ready
    const reducedMotion = useReducedMotion();

    const rafRef = useRef<number | null>(null);

    // Hydration step: once mounted, resolve clock phase and start initial fade
    useEffect(() => {
        // Preload all in background, but immediately the target phase
        const nowIdx = phaseIndexForDate(new Date());
        const target = SKYLINE_IMAGES[nowIdx];
        preload(target.src);

        // If user prefers reduced motion, just jump to the correct phase and stop
        if (reducedMotion) {
            setSegment(nowIdx);
            setMode("cycle"); // still enter cycle but no animation
            setFadeMs(0);
            return;
        }

        // Start in sunrise → fade to target
        setMode("fadeToClock");
        setFadeMs(INITIAL_FADE_MS);

        // Align the post-fade cycle so it starts at the right *position* inside the loop
        // Example: if time is in "day", jump the loop to phase 1.x where x depends on clock
        // We'll approximate the intra-phase position by minute within its coarse block.
        const startMs = performance.now();
        const tickFade = (now: number) => {
            const p = Math.min(1, (now - startMs) / INITIAL_FADE_MS);
            // interpolate sunrise (0) to target (nowIdx)
            // We simply crossfade: segment = sunrise*(1-p) + nowIdx*p -> handled via explicit opacities below
            if (p < 1) {
                rafRef.current = requestAnimationFrame(tickFade);
            } else {
                // Fade complete → enter continuous cycle aligned to clock
                setFadeMs(CROSSFADE_MS);
                setMode("cycle");
            }
        };
        rafRef.current = requestAnimationFrame(tickFade);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [reducedMotion]);

    // Continuous loop after initial fade
    useEffect(() => {
        if (mode !== "cycle") return;

        // Offset the loop so we begin in the correct phase segment
        const now = new Date();
        const phase = phaseIndexForDate(now);

        // Intra-phase fraction — coarse but good enough for visual alignment
        const minutes = now.getHours() * 60 + now.getMinutes();
        const phaseStartMin =
            phase === 0 ? 5 * 60 : phase === 1 ? 9 * 60 : phase === 2 ? 17 * 60 : 20 * 60;
        const phaseEndMin =
            phase === 0 ? 9 * 60 : phase === 1 ? 17 * 60 : phase === 2 ? 20 * 60 : 29 * 60; // night wraps
        const span = phaseEndMin + (phase === 3 ? 24 * 60 : 0) - phaseStartMin; // handle wrap for night
        const intraPhase = Math.max(
            0,
            Math.min(1, (minutes + (phase === 3 ? 24 * 60 : 0) - phaseStartMin) / span)
        );

        const initialSeg = phase + intraPhase; // e.g., 1.42 for "day"
        const t0 = performance.now();

        const loop = (t: number) => {
            const elapsed = t - t0;
            const seg =
                (initialSeg + (elapsed / FULL_CYCLE_MS) * SKYLINE_IMAGES.length) %
                SKYLINE_IMAGES.length;
            setSegment(seg);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [mode]);

    // Preload the two most likely images for next transition to avoid pop
    useEffect(() => {
        const count = SKYLINE_IMAGES.length;
        const current = Math.floor(segment) % count;
        const next = (current + 1) % count;
        preload(SKYLINE_IMAGES[current].src);
        preload(SKYLINE_IMAGES[next].src);
    }, [segment]);

    // Compute opacities:
    // - In "boot": only sunrise visible
    // - In "fadeToClock": manual crossfade sunrise -> target phase
    // - In "cycle": crossfade current -> next based on `segment`
    const opacities = useMemo(() => {
        if (mode === "boot") {
            const v = new Array(SKYLINE_IMAGES.length).fill(0);
            v[0] = 1; // sunrise only
            return v;
        }
        if (mode === "fadeToClock") {
            // We drive this with CSS transition time; here we just show both sunrise & target fully,
            // letting CSS do the interpolation. To keep logic simple, show sunrise & the current clock phase.
            const idx = phaseIndexForDate(new Date());
            const v = new Array(SKYLINE_IMAGES.length).fill(0);
            v[0] = 1; // sunrise
            v[idx] = 0; // will fade up via class change
            return v;
        }
        // cycle
        return opacitiesForSegment(segment);
    }, [mode, segment]);

    // Mark ready once first frame paints (avoids gradient flashing)
    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <article className="absolute w-full h-[120dvh] min-h-[800px] overflow-hidden">
            <div className="absolute inset-0 backdrop-blur-xs w-full h-full z-10" />
            <section
                className="relative w-full h-[120dvh] min-h-[800px] overflow-hidden z-0"
                data-phase={mode}
            >
                {SKYLINE_IMAGES.map((image, index) => {
                    // In fadeToClock we attach a class to animate from sunrise to target
                    const isSunrise = index === 0;
                    const isTargetDuringFade =
                        mode === "fadeToClock" && index === phaseIndexForDate(new Date());

                    return (
                        <div
                            key={image.key}
                            className={[
                                "absolute inset-0 will-change-opacity",
                                mode === "fadeToClock" && (isSunrise || isTargetDuringFade)
                                    ? "transition-opacity ease-out"
                                    : "transition-opacity ease-linear",
                            ].join(" ")}
                            style={{
                                opacity:
                                    mode === "fadeToClock"
                                        ? isSunrise
                                            ? 1 // start fully visible then CSS will fade this down
                                            : isTargetDuringFade
                                            ? 0 // start at 0 then CSS will fade up
                                            : 0
                                        : opacities[index],
                                transitionDuration:
                                    mode === "fadeToClock"
                                        ? `${reducedMotion ? 0 : INITIAL_FADE_MS}ms`
                                        : `${reducedMotion ? 0 : fadeMs}ms`,
                                pointerEvents: "none",
                            }}
                            aria-hidden={opacities[index] < 0.01}
                        >
                            <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                sizes="100vw"
                                priority={index === 0} // sunrise eagerly fetched
                                loading={index === 0 ? "eager" : "lazy"}
                                className="absolute inset-0"
                                style={{ objectFit: "cover" }}
                                onLoad={index === 0 ? () => setReady(true) : undefined}
                            />
                        </div>
                    );
                })}

                {/* Gentle vignette/grade; tweak per your brand */}
                <div
                    className={[
                        "absolute opacity-100 inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60 pointer-events-none",
                        ready && " transition-opacity duration-300",
                    ].join(" ")}
                />
            </section>
        </article>
    );
}
