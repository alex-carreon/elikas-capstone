import { Card } from "@/components/ui/card";
import carousel1 from "@/assets/Registration/Carousel1.svg";
import carousel2 from "@/assets/Registration/Carousel2.svg";
import carousel3 from "@/assets/Registration/Carousel3.svg";
import carousel4 from "@/assets/Registration/Carousel4.svg";
import carousel5 from "@/assets/Registration/Carousel5.svg";

import privacyPdf from "@/assets/Registration/eLikas_DataPrivacy.pdf";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { type CarouselApi } from "@/components/ui/carousel";
import ButtonComp from "../../components/Button";
import { Circle } from "lucide-react";
import CarouselCard from "../../components/CarouselCard";
import { ArrowLeftIcon } from "lucide-react";
import Logo from "@/components/Logo";

function SplashRegistration() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    // Set initial index
    setCurrent(api.selectedScrollSnap());

    // Update index on slide change
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-sm flex justify-evenly flex-col p-6">
        <div className="mb-6">
          <Link to="/Login" id="R-BackSplash">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>{" "}
        <div className="w-full flex flex-col items-center">
          <Carousel
            setApi={setApi}
            className="w-xs flex  justify-self-center overflow-hidden"
            id="Splash_Carousel"
          >
            <CarouselContent id="Splash_CarouselContent">
              <CarouselItem key={1} id="Splash_CarouselItem1">
                <Card style={{ border: "none", boxShadow: "none" }}>
                  <CarouselCard
                    img={carousel1}
                    alt="Carousel Image 1"
                    header="Know where to go!"
                    text="Informing you with accurate information, eLikas provides routes towards the nearest Evacuation Center near you!"
                  ></CarouselCard>
                </Card>
              </CarouselItem>
              <CarouselItem key={2} id="Splash_CarouselItem2">
                <CarouselCard
                  img={carousel2}
                  alt="Carousel Image 2"
                  header="Make Informed Decisions"
                  text="Keep yourself in the loop with real-time updates from your surroundings marked by your fellow neighbors."
                ></CarouselCard>
              </CarouselItem>
              <CarouselItem key={3} id="Splash_CarouselItem3">
                <CarouselCard
                  img={carousel3}
                  alt="Carousel Image 3"
                  header="Help your community keep safe!"
                  text="Mark flooded roads or provide the safety of your home to help your neighbors in need. Keep informed, give support, and let our Bayanihan flow with eLikas!"
                ></CarouselCard>
              </CarouselItem>
              <CarouselItem key={4} id="Splash_CarouselItem3">
                <CarouselCard
                  img={carousel4}
                  alt="Carousel Image 4"
                  header="Stay Alert, Stay Safe"
                  text="Flood situations and evacuation centers can change minute to minute. We update as fast as we can, but always verify with local authorities when it really matters."
                ></CarouselCard>
              </CarouselItem>
              <CarouselItem key={5} id="Splash_CarouselItem5">
              <Card style={{ border: "none", boxShadow: "none" }}>
                <CarouselCard
                  img={carousel5}
                  alt="Carousel Image 5"
                  header="Your Privacy Matters"
                  text="eLikas only collects information necessary to provide its services. Comments may be processed through OpenAI for automated content moderation. Please review our complete Data Privacy Notice before creating your account."
                />
                <div className="flex justify-center mt-3">
                  <button
                    className="text-sm text-blue-600 underline hover:text-blue-800"
                    onClick={() => window.open(privacyPdf, "_blank")}
                  >
                    Read Full Data Privacy Notice
                  </button>
                </div>
              </Card>
            </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div
            id="Splash_CarouselIndicators"
            className="py-2 flex flex-row gap-2 self-center"
          >
            <Circle
              id="Splash_CarouselIndicator1"
              className={
                "h-3 w-3 stroke-none " +
                (current === 0 ? "fill-gray-500" : "fill-gray-300")
              }
            />
            <Circle
              id="Splash_CarouselIndicator2"
              className={
                "h-3 w-3 stroke-none " +
                (current === 1 ? "fill-gray-500" : "fill-gray-300")
              }
            />
            <Circle
              id="Splash_CarouselIndicator3"
              className={
                "h-3 w-3 stroke-none " +
                (current === 2 ? "fill-gray-500" : "fill-gray-300")
              }
            />
            <Circle
              id="Splash_CarouselIndicator4"
              className={
                "h-3 w-3 stroke-none " +
                (current === 3 ? "fill-gray-500" : "fill-gray-300")
              }
            />
            <Circle
              id="Splash_CarouselIndicator5"
              className={
                "h-3 w-3 stroke-none " +
                (current === 4 ? "fill-gray-500" : "fill-gray-300")
              }
            />
          </div>
        </div>
        <br />
        <div className="w-full flex flex-col justify-center items-center m-0 gap-2">
          {current === 4 ? (
            <Link to="/Registration/Form" className="w-full max-w-xs">
              <ButtonComp
                text="Get Started"
                variant="primary"
                id="Splash_StartBtn"
                heightSize="38px"
                widthSize="100%"
              />
            </Link>
          ) : (
            <ButtonComp
              text="Next"
              id="Splash_NextBtn"
              variant="primary"
              onClick={
                current === 4
                  ? () => api?.scrollNext()
                  : () => api?.scrollNext()
              }
              heightSize="38px"
              widthSize="100%"
            />
          )}

          <ButtonComp
            text="Previous"
            variant="outline"
            onClick={() => api?.scrollPrev()}
            id="Splash_PrevBtn"
            heightSize="38px"
            widthSize="100%"
          />
        </div>
      </div>
    </div>
  );
}

export default SplashRegistration;
