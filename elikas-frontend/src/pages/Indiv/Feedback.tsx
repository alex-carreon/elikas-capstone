import feedbackIcon from "@/assets/Feedback/feedbackIcon.svg";
import colors from "@/constants/colors";
import React, { useState } from "react";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import { FieldLabel, Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import ButtonComp from "@/components/Button";
import api from "@/api";
import { toast } from "sonner";

function Feedback() {
  const [rating, setRating] = useState(0);
  const [desc, setDesc] = useState("");
  // Catch Rating value
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = api.post("/feedback", {
        rating: rating,
        message: desc,
      });

      console.log(response);

      toast.promise(response, {
        loading: "Submitting your feedback...",
        success: "Feedback sent. Thank you for helping us improve!",
        error: (err: any) => {
          return err.response.data.details;
        },
        position: "top-center",
      });
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  return (
    <>
      <div className="min-h-screen flex justify-center p-6 pt-20">
        <div className="w-full max-w-sm">
          <div className="h-full flex gap-8 flex-col">
            <div className="flex gap-1 flex-col">
              <p
                className="font-bold text-2xl text-center"
                style={{ color: colors.heading }}
              >
                User Feedback
              </p>
              <p
                className="text-sm text-center"
                style={{ color: colors.label }}
              >
                Feel free to send us your feedback! You're opinions will help us
                improve our service.
              </p>
            </div>
            <div className="w-full flex justify-center">
              <img src={feedbackIcon} className="w-60" />
            </div>
            <div className="h-full w-full flex justify-center">
              <form
                className="flex flex-col justify-between gap-4"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel
                      className={"text-md w-s"}
                      style={{ color: colors.label }}
                    >
                      Rating
                    </FieldLabel>
                    <Stack spacing={1}>
                      <Rating
                        name="half-rating"
                        value={rating}
                        onChange={(
                          _e: React.SyntheticEvent,
                          val: number | null,
                        ) => setRating(val ?? 0)}
                        defaultValue={2.5}
                        precision={0.5}
                        sx={{ fontSize: "3rem" }}
                      />
                    </Stack>
                  </Field>
                  <Field>
                    <FieldLabel
                      className={"text-sm w-s"}
                      style={{ color: colors.label }}
                    >
                      Description (optional)
                    </FieldLabel>
                    <Textarea
                      placeholder="Feel free to say what you think!"
                      id="EvacPin_StreetField"
                      className="h-50 border rounded-lg text-xs"
                      onChange={(e) => setDesc(e.target.value)}
                    ></Textarea>
                  </Field>
                </div>

                <div className="w-full flex justify-center items-center m-0">
                  <ButtonComp
                    text="Submit"
                    id="Feedback_SubmitBtn"
                    variant="primary"
                    heightSize="38px"
                    widthSize="100%"
                    type="submit"
                  ></ButtonComp>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Feedback;
