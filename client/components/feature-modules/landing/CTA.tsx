import { Button } from "@/components/ui/button";

export default function CTA() {
    return (
        <section>
            <div className="flex flex-col items-center gap-4 py-24 text-center md:py-32">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                    Ready to automate your business processes?
                </h2>
                <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                    Join other independant carers who trust Okare to handle their management and
                    invoice generation needs to stay ahead and focus on what matters most: providing
                    exceptional care to your clients.
                </p>
                <Button size="lg" className="mt-4">
                    Get Started Today
                </Button>
            </div>
        </section>
    );
}
