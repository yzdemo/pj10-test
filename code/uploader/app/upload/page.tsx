"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toGoogleCalendarCsv, downloadCsv } from "@/lib/csvExport";
import type { CalendarEvent } from "@/types/events";

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    title: "Midterm Exam",
    start: "2026-02-15T10:00:00.000Z",
    allDay: false,
    description: "Ch 1–5",
  },
  {
    title: "Homework 3 Due",
    start: "2026-02-20T23:59:00.000Z",
    allDay: true,
    description: "Submit on GauchoSpace",
  },
  {
    title: "Final Project Presentation",
    start: "2026-03-10T14:00:00.000Z",
    allDay: false,
    description: "Phelps 3520",
    location: "Phelps 3520",
  },
];

export default function UploadPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [calendarStatus, setCalendarStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [calendarMessage, setCalendarMessage] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const searchParams = useSearchParams();

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

  // Handle OAuth callback from Google
  useEffect(() => {
    const authSuccess = searchParams?.get("auth_success");
    const token = searchParams?.get("access_token");
    const error = searchParams?.get("error");

    if (authSuccess === "true" && token) {
      setAccessToken(token);
      setCalendarMessage("Successfully connected to Google Calendar!");
      window.history.replaceState({}, "", "/upload");
    } else if (error) {
      setCalendarStatus("error");
      setCalendarMessage(`Authentication failed: ${error}`);
      window.history.replaceState({}, "", "/upload");
    }
  }, [searchParams]);

  function handleLoadSample() {
    setEvents(SAMPLE_EVENTS);
  }

  async function handleTestSyllabusParsing() {
    setParseStatus("loading");
    try {
      const res = await fetch("/api/parse-text");
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setParseStatus("error");
        setUploadMessage(data.error || "Failed to parse syllabus.txt");
        return;
      }

      setEvents(data.events || []);
      setParseStatus("ok");
      setUploadMessage(`Successfully parsed ${data.count} event(s) from syllabus.txt!`);
    } catch (err) {
      setParseStatus("error");
      setUploadMessage("Failed to parse syllabus.txt");
    }
  }

  function handleDownloadCsv() {
    if (events.length === 0) return;
    const csv = toGoogleCalendarCsv(events);
    downloadCsv(csv, "syllabus-events");
  }

  async function handleGoogleCalendarAuth() {
    try {
      const res = await fetch("/api/calendar/auth");
      const data = await res.json();
      
      if (!res.ok || !data.authUrl) {
        setCalendarStatus("error");
        setCalendarMessage(data.error || "Failed to start authentication");
        return;
      }

      window.location.href = data.authUrl;
    } catch (err) {
      setCalendarStatus("error");
      setCalendarMessage("Failed to connect to Google Calendar");
    }
  }

  async function handleAddToGoogleCalendar() {
    if (events.length === 0) {
      setCalendarMessage("Please load events first");
      setCalendarStatus("error");
      return;
    }

    if (!accessToken) {
      await handleGoogleCalendarAuth();
      return;
    }

    setCalendarStatus("loading");
    setCalendarMessage("");

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          events,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setAccessToken(null);
          setCalendarStatus("error");
          setCalendarMessage("Session expired. Please authenticate again.");
        } else {
          setCalendarStatus("error");
          setCalendarMessage(data.error || "Failed to add events to Google Calendar");
        }
        return;
      }

      setCalendarStatus("ok");
      setCalendarMessage(data.message || `Successfully added ${data.count} event(s) to Google Calendar!`);
    } catch (err) {
      setCalendarStatus("error");
      setCalendarMessage("Failed to add events to Google Calendar");
    }
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
                onClick={handleTestSyllabusParsing}
                disabled={parseStatus === "loading"}
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm transition hover:bg-blue-100 disabled:opacity-50"
              >
                {parseStatus === "loading" ? "Parsing…" : "Test Syllabus Parsing"}
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={events.length === 0}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={handleAddToGoogleCalendar}
                disabled={events.length === 0 || calendarStatus === "loading"}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {calendarStatus === "loading"
                  ? "Adding…"
                  : accessToken
                  ? "Add to Google Calendar"
                  : "Connect & Add to Google Calendar"}
              </button>
            </div>
            {events.length > 0 && (
              <p className="mt-3 text-sm text-zinc-600">
                {events.length} event(s) loaded. Click &quot;Download CSV&quot; or &quot;Add to Google Calendar&quot;.
              </p>
            )}
            {calendarMessage && (
              <p
                className={`mt-3 text-sm ${
                  calendarStatus === "error" ? "text-red-600" : "text-green-600"
                }`}
              >
                {calendarMessage}
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
