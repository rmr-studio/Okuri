import { Brain, Cloud, Shield, Zap } from "lucide-react";

const features = [
    {
        name: "Automated Invoice Generation",
        description:
            "Harness the power of our software to automatically turn your billable hours into ready to go Invoices to send straight to your client",
        icon: Brain,
    },
    {
        name: "Seamless Client Management",
        description:
            "Store, manage and update all of your client details in a singular easy to use Platform.",
        icon: Cloud,
    },
    {
        name: "Efficienct Invoice Storage",
        description:
            "Store all generated Invoices in our storage systems. Ready and available for when you need them most.",
        icon: Shield,
    },
    {
        name: "Improved Productivity",
        description:
            "Optimized for speed and efficiency, our solutions deliver unparalleled performance.",
        icon: Zap,
    },
];

export default function Features() {
    return (
        <section className="container space-y-16 py-24 md:py-32 mx-auto">
            <div className="mx-auto max-w-[58rem] text-center">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                    Time-saving Solutions
                </h2>
                <p className="mt-4 text-muted-foreground sm:text-lg">
                    Discover how Okare can simplify your workflow and enhance productivity to ensure
                    your time is spent on doing what you do best
                </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
                {features.map((feature) => (
                    <div
                        key={feature.name}
                        className="relative overflow-hidden rounded-lg border bg-background p-8"
                    >
                        <div className="flex items-center gap-4">
                            <feature.icon className="h-8 w-8" />
                            <h3 className="font-bold">{feature.name}</h3>
                        </div>
                        <p className="mt-2 text-muted-foreground">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
