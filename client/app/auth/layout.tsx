import { HomeNavbar } from "@/components/ui/nav/home.navbar";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";

const layout: FC<ChildNodeProps> = ({ children }) => {
    return (
        <div>
            <HomeNavbar />
            {children}
        </div>
    );
};

export default layout;
