import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 font-sans text-zinc-900">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Syllabus to Calendar
      </h1>
      <Link
        href="/upload"
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        Go to Upload &amp; Download
      </Link>
    </div>
  );
}
