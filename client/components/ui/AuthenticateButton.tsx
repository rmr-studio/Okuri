import { CornerRightUp } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

const AuthenticateButton = () => {
    return (
        <div
            id="gooey-btn"
            className="relative flex items-center group"
            style={{ filter: "url(#gooey-filter)" }}
        >
            <Button
                size={"icon"}
                className="absolute right-0 px-2.5 py-2 cursor-pointer rounded-full font-normal text-xs transition-all duration-300 h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0"
            >
                <Link href={"/auth/register"}>
                    <CornerRightUp className="size-3" />
                </Link>
            </Button>
            <Button className="px-6 py-2 rounded-full  font-normal text-xs transition-all duration-300 cursor-pointer h-8 flex items-center z-10">
                <Link href={"/auth/login"}>Login</Link>
            </Button>
        </div>
    );
};

export default AuthenticateButton;
