import { FC } from "react";
import { BaseWidgetProps, Widget } from "../widget";

interface Props extends BaseWidgetProps {}

export const KeyValueWidget: FC<Props> = ({ onDelete }) => {
    return (
        <Widget onDelete={onDelete}>
            <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-500">Key</div>
                <div className="text-lg font-bold">Value</div>
            </div>
        </Widget>
    );
};
