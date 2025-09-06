import ShaderPageContainer from "@/components/ui/background/shader-background";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WaitlistPage = () => {
    return (
        <>
            {/* <MouseMoveEffect /> */}

            <ShaderPageContainer className="flex justify-center items-center">
                <Card className="w-auto flex-grow lg:max-w-2xl h-fit m-2 md:m-6 lg:m-12">
                    <CardHeader>
                        <CardTitle>Join our waitlists</CardTitle>
                        <CardDescription>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla natus
                            officia assumenda unde accusamus animi nobis, beatae, fuga distinctio
                            necessitatibus error ex atque consequuntur culpa praesentium.
                            Dignissimos cumque sapiente est, ipsam facilis nihil repellat incidunt,
                            illo ex assumenda, maxime odit veniam ab possimus reprehenderit culpa
                            omnis et minima voluptatibus vero odio maiores labore impedit nulla.
                            Ratione fugit vero culpa, ut magnam quae, totam assumenda amet
                            consequuntur voluptatum impedit libero. Corporis, consequatur blanditiis
                            veritatis incidunt quam accusantium in perspiciatis minima, officiis
                            laudantium corrupti, facere beatae?
                        </CardDescription>
                    </CardHeader>
                    <CardContent></CardContent>
                </Card>
            </ShaderPageContainer>
        </>
    );
};

export default WaitlistPage;
