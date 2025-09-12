import { FC } from "react";


// Widget Registry for dynamic component rendering
export const WIDGET_COMPONENTS = {
    
} as const;

export type WidgetType = keyof typeof WIDGET_COMPONENTS;

export interface WidgetConfig {
    type: WidgetType;
    id: string;
    props?: Record<string, any>;
    gridProps?: {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
    };
}

interface Props {
    config: WidgetConfig;
}

export const DynamicWidget: FC<Props> = ({ config }) => {
    const Component = WIDGET_COMPONENTS[config.type];

    if (!Component) {
        return <div>Unknown widget type: {config.type}</div>;
    }

    return <Component {...config.props} />;
};
