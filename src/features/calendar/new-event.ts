import { z } from "zod";

const MAX_TITLE = 200;
const MAX_LOCATION = 300;
const MAX_DESCRIPTION = 8000;
const MAX_GUESTS = 20;

export const newEventSchema = z
  .object({
    title: z.string().trim().min(1, "Give the event a title").max(MAX_TITLE),
    start: z.iso.datetime(),
    end: z.iso.datetime(),
    timeZone: z.string().min(1).max(64),
    location: z.string().trim().max(MAX_LOCATION).optional(),
    description: z.string().trim().max(MAX_DESCRIPTION).optional(),
    guests: z.array(z.email()).max(MAX_GUESTS).default([]),
    addMeet: z.boolean().default(false),
  })
  .refine((event) => new Date(event.end) > new Date(event.start), {
    message: "The event must end after it starts",
    path: ["end"],
  });

export type NewEvent = z.infer<typeof newEventSchema>;
