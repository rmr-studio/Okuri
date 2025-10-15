import { BackgroundBeams } from "@/components/ui/background/beams";
import { Card } from "@/components/ui/card";
import { FCWC, Propless } from "@/lib/interfaces/interface";

export const AuthFormWrapper: FCWC<Propless> = ({ children }) => {
    return (
        <>
            <BackgroundBeams />
            <section className="h-screen-without-header bg-background/20 flex justify-center items-center">
                <Card className="p-6 relative transition-all bg-background/70 backdrop-blur-sm">
                    {children}
                </Card>
            </section>
        </>
    );
};
