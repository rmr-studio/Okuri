"use client";

import { PaperTexture } from "@paper-design/shaders-react";

const PaperTextContainer = () => {
    return (
        <PaperTexture
            style={{ height: 500 }}
            colorBack="hsl(0, 0%, 100%)"
            colorFront="hsl(211, 18%, 68%)"
            contrast={0.3}
            roughness={0.4}
            fiber={0.3}
            fiberScale={1}
            crumples={0.3}
            crumplesScale={0.6}
            folds={0.65}
            foldsNumber={5}
            blur={0}
            drops={0.2}
            seed={5.8}
            scale={0.6}
            fit="contain"
        />
    );
};

export default PaperTextContainer;
