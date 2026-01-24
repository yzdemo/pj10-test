"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            ← Back
          </Link>
        </div>

        <main className="space-y-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Syllabus to Calendar
            </h1>
            <p className="mt-1 text-zinc-600">
              Upload a syllabus PDF, then download events as CSV for Google Calendar.
            </p>
          </div>

          <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-zinc-900">
              Upload syllabus (PDF)
            </h2>
            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <input
                type="file"
                name="file"
                accept=".pdf,application/pdf"
                className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-300"
              />
              <button
                type="submit"
                disabled={uploadStatus === "loading"}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {uploadStatus === "loading" ? "Uploading…" : "Upload"}
              </button>
            </form>
            {uploadMessage && (
              <p
                className={`mt-3 text-sm ${
                  uploadStatus === "error" ? "text-red-600" : "text-zinc-600"
                }`}
              >
                {uploadMessage}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
            <h2 className="text-lg font-medium text-zinc-900">
              Download calendar events (CSV)
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              CSV format works with Google Calendar import. Use sample events to try it, or connect
              real events from extraction later.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLoadSample}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Load sample events
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={events.length === 0}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download CSV
              </button>
            </div>
            {events.length > 0 && (
              <p className="mt-3 text-sm text-zinc-600">
                {events.length} event(s) loaded. Click &quot;Download CSV&quot; to get a file named
                syllabus-events-YYYY-MM-DD.csv.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
