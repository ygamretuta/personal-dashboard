"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { CalendarAccessProblem } from "./calendar-source";
import { newEventSchema, type NewEvent } from "./new-event";

export interface EventDraft {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
}

interface EventFormProps {
  initial: EventDraft;
  onSubmit: (event: NewEvent) => Promise<unknown>;
  onClose: () => void;
}

const FIELD = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm";

const splitGuests = (text: string) =>
  text
    .split(/[,\s]+/)
    .map((guest) => guest.trim())
    .filter(Boolean);

export function EventForm({ initial, onSubmit, onClose }: EventFormProps) {
  const [error, setError] = useState<string>();
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const at = (time: string) => new Date(`${text("date")}T${time}`);

    const parsed = newEventSchema.safeParse({
      title: text("title"),
      start: at(text("startTime")).toISOString(),
      end: at(text("endTime")).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: text("location"),
      description: text("description"),
      guests: splitGuests(text("guests")),
      addMeet: form.get("addMeet") === "on",
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the event");

    setError(undefined);
    setSaving(true);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch (failure) {
      setSaving(false);
      if (failure instanceof CalendarAccessProblem) setNeedsReconnect(true);
      setError(
        failure instanceof CalendarAccessProblem
          ? undefined
          : "Couldn't add the event. Please try again.",
      );
    }
  };

  return (
    <Dialog label="New event" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 p-4">
        <h2 className="text-sm font-medium">New event</h2>
        <input
          name="title"
          required
          autoFocus
          placeholder="Add title"
          aria-label="Title"
          className={FIELD}
        />
        <div className="grid grid-cols-3 gap-2">
          <label className="space-y-1 text-xs text-muted">
            Date
            <input name="date" type="date" required defaultValue={initial.date} className={FIELD} />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Start
            <input
              name="startTime"
              type="time"
              required
              defaultValue={initial.startTime}
              className={FIELD}
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            End
            <input
              name="endTime"
              type="time"
              required
              defaultValue={initial.endTime}
              className={FIELD}
            />
          </label>
        </div>
        <input name="location" placeholder="Location" aria-label="Location" className={FIELD} />
        <input
          name="guests"
          placeholder="Guests (emails, separated by commas). They get an invite."
          aria-label="Guests"
          className={FIELD}
        />
        <textarea
          name="description"
          rows={3}
          placeholder="Description"
          aria-label="Description"
          className={FIELD}
        />
        <label className="flex items-center gap-2 text-sm">
          <input name="addMeet" type="checkbox" /> Add a Google Meet link
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
        {needsReconnect && (
          <p role="alert" className="text-sm text-red-500">
            Google needs your permission to add events.{" "}
            <a className="underline" href="/api/integrations/gmail/connect">
              Reconnect Google
            </a>
            , then try again.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
