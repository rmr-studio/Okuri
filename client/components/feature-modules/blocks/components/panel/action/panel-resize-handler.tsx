import { MoveDiagonal, MoveDiagonal2 } from "lucide-react";
import { FC, Fragment } from "react";
import { ResizePosition } from "../../../interface/panel.interface";
import { ResizeHandle } from "../../handle/resize-handle";

interface Props {
    visible: boolean;
    positions: ResizePosition[];
}

const PanelResizeHandler: FC<Props> = ({ visible, positions }) => {
    const includes = (pos: ResizePosition) => positions.includes(pos);

    return (
        <Fragment>
            {/* Top Left */}
            {includes("nw") && (
                <ResizeHandle position="nw" visible={visible}>
                    <MoveDiagonal2 />
                </ResizeHandle>
            )}
            {/* Top Right */}
            {includes("ne") && (
                <ResizeHandle position="ne" visible={visible}>
                    <MoveDiagonal />
                </ResizeHandle>
            )}
            {/* Bottom Left */}
            {includes("sw") && (
                <ResizeHandle position="sw" visible={visible}>
                    <MoveDiagonal />
                </ResizeHandle>
            )}
            {/* Bottom Right */}
            {includes("se") && (
                <ResizeHandle position="se" visible={visible}>
                    <MoveDiagonal2 />
                </ResizeHandle>
            )}
        </Fragment>
    );
};

export default PanelResizeHandler;
