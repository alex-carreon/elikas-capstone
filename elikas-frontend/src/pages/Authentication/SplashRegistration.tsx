import { Card } from "@/components/ui/card";
import carousel1 from "../assets/Registration/Carousel1.svg";
import carousel2 from "../assets/Registration/Carousel2.svg";
import carousel3 from "../assets/Registration/Carousel3.svg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Logo from "../../components/Logo";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { type CarouselApi } from "@/components/ui/carousel";
import ButtonComp from "../../components/Button";
import { Circle } from "lucide-react";
import CarouselCard from "../../components/CarouselCard";

function SplashRegistration() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    if (!api) return;

    // Set initial index
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    // Update index on slide change
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  console.log(count);

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-sm flex justify-evenly flex-col p-6">
        <div className="w-full">
          <Link to="/Login" id="R-BackLogin">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="w-full flex flex-col items-center">
          <Carousel
            setApi={setApi}
            className="w-xs flex  justify-self-center overflow-hidden"
          >
            <CarouselContent>
              <CarouselItem key={1}>
                <Card style={{ border: "none", boxShadow: "none" }}>
                  <CarouselCard
                    img={carousel1}
                    alt="Carousel Image 1"
                    header="Know where to go!"
                    text="Informing you with accurate information, eLikas provides routes towards the nearest Evacuation Center near you!"
                  ></CarouselCard>
                </Card>
              </CarouselItem>
              <CarouselItem key={2}>
                <CarouselCard
                  img={carousel2}
                  alt="Carousel Image 2"
                  header="Make Informed Decisions"
                  text="Keep yourself in the loop with real-time updates from your surroundings marked by your fellow neighbors."
                ></CarouselCard>
              </CarouselItem>
              <CarouselItem key={3}>
                <CarouselCard
                  img={carousel3}
                  alt="Carousel Image 3"
                  header="Help your community keep safe!"
                  text="Mark flooded roads or provide the safety of your home to help your neighbors in need. Keep informed, give support, and let our Bayanihan flow with eLikas!"
                ></CarouselCard>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div className="py-2 flex flex-row gap-2 self-center">
            <Circle
              className={
                "h-3 w-3 stroke-none " +
                (current === 0 ? "fill-gray-500" : "fill-gray-300")
              }
            />
            <Circle
              className={
                "h-3 w-3 stroke-none " +
                (current === 1 ? "fill-gray-500" : "fill-gray-300")
              }
            />
            <Circle
              className={
                "h-3 w-3 stroke-none " +
                (current === 2 ? "fill-gray-500" : "fill-gray-300")
              }
            />
          </div>
        </div>
        <br />
        <div className="w-full flex flex-col justify-center items-center m-0 gap-2">
          {current === 2 ? (
            <Link to="/Registration/Form" className="w-full max-w-xs">
              <ButtonComp text="Get Started" variant="primary" id="R-ToForm" />
            </Link>
          ) : (
            <ButtonComp
              text="Next"
              variant="primary"
              onClick={
                current === 2
                  ? () => api?.scrollNext()
                  : () => api?.scrollNext()
              }
              id="R-SplashNext"
            />
          )}

          <ButtonComp
            text="Previous"
            variant="outline"
            onClick={() => api?.scrollPrev()}
            id="R-SplashPrevious"
          />
        </div>
      </div>
    </div>
  );
}

export default SplashRegistration;
