"use client";

import { useState } from "react";
import { toGoogleCalendarCsv, downloadCsv } from "@/lib/csvExport";
import type { CalendarEvent } from "@/types/events";

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    title: "Midterm Exam",
    start: "2025-02-15T10:00:00.000Z",
    allDay: false,
    description: "Ch 1–5",
  },
  {
    title: "Homework 3 Due",
    start: "2025-02-20T23:59:00.000Z",
    allDay: true,
    description: "Submit on GauchoSpace",
  },
  {
    title: "Final Project Presentation",
    start: "2025-03-10T14:00:00.000Z",
    allDay: false,
    description: "Phelps 3520",
    location: "Phelps 3520",
  },
];

export default function UploadPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file") as File | null;
    if (!file?.size) {
      setUploadMessage("Please select a PDF file.");
      setUploadStatus("error");
      return;
    }
    setUploadStatus("loading");
    setUploadMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadMessage(data.error || data.message || "Upload failed.");
        setUploadStatus("error");
        return;
      }
      setUploadMessage(data.message || "Upload successful.");
      setUploadStatus("ok");
    } catch (err) {
      setUploadMessage("Upload failed. Please try again.");
      setUploadStatus("error");
    }
  }

  function handleLoadSample() {
    setEvents(SAMPLE_EVENTS);
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;
    const csv = toGoogleCalendarCsv(events);
    downloadCsv(csv, "syllabus-events");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl space-y-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Syllabus to Calendar
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Upload a syllabus PDF, then download events as CSV for Google Calendar.
          </p>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Upload syllabus (PDF)
          </h2>
          <form onSubmit={handleUpload} className="mt-4 space-y-4">
            <input
              type="file"
              name="file"
              accept=".pdf,application/pdf"
              className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-300 dark:file:bg-zinc-700 dark:file:text-zinc-200 dark:hover:file:bg-zinc-600"
            />
            <button
              type="submit"
              disabled={uploadStatus === "loading"}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {uploadStatus === "loading" ? "Uploading…" : "Upload"}
            </button>
          </form>
          {uploadMessage && (
            <p
              className={`mt-3 text-sm ${
                uploadStatus === "error" ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {uploadMessage}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Download calendar events (CSV)
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            CSV format works with Google Calendar import. Use sample events to try it, or connect
            real events from extraction later.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleLoadSample}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Load sample events
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={events.length === 0}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Download CSV
            </button>
          </div>
          {events.length > 0 && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {events.length} event(s) loaded. Click &quot;Download CSV&quot; to get a file named
              syllabus-events-YYYY-MM-DD.csv.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
