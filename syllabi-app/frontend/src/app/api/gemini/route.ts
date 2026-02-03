import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "No syllabus text provided" }, { status: 400 });
  }

  const prompt = `
You will receive a transcript of a syllabus from a class.

Your task:
- Extract ALL events (lectures, exams, assignments, holidays, etc.).
- Output a valid CSV file for Google Calendar.
- Include a header row.
- Each event must be on its own row.
- Every row must have exactly 7 columns.
- If a field is unknown, leave it blank (but keep the comma).

CSV columns (exact order):
Subject,Start Date,Start Time,End Date,End Time,Description,Location

Output ONLY raw CSV. No markdown, no commentary.

Syllabus transcript:
"""${text}"""
`;

  try {
    console.log("GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 3000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: `Gemini API returned ${response.status}: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 🔍 Combine all parts from the first candidate
    const candidate = data?.candidates?.[0];
    if (!candidate?.content?.length) {
      return NextResponse.json({ error: "Gemini returned no content" }, { status: 500 });
    }

    // Combine all parts of all content blocks into one CSV
    const csvText = candidate.content
      .map(c => c.parts.map(p => p.text).join("\n"))
      .join("\n")
      .trim();

    if (!csvText) {
      return NextResponse.json({ error: "Gemini returned empty CSV" }, { status: 500 });
    }

    return NextResponse.json({ csvText });
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return NextResponse.json({ error: "Failed to call Gemini" }, { status: 500 });
  }
}