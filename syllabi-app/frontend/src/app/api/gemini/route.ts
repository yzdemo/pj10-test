import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "No syllabus text provided" }, { status: 400 });
  }

  const prompt = `You will receive a transcript of a syllabus from a class. Your task is to output a CSV file with all class events (assignments, lectures, test/exams) that can be imported into Google Calendar. Only provide the CSV content; no markdown or extra text. 
  
  I will be extracting this data in code through some of these snippets, for your reference.

    const csvText = (data?.candidates || [])
      .map(candidate =>
        candidate?.content?.parts?.map(part => part.text).join("") || ""
      )
    .join("\n");

    return NextResponse.json({ csvText });

    Upon call, it will be:

    const { csvText } = await res.json();

    const eventsFromCsv: CalendarEvent[] = csvText
          .split("\n")
          .filter((line) => line.trim() !== "")
          .slice(1)
          .map((line) => {
            const [title, start, allDayStr, description, location] = line.split(",");
            return {
              title,
              start,
              allDay: allDayStr?.toLowerCase() === "true" || false,
              description,
              location,
            } as CalendarEvent;
          });
  
  
  Here is the syllabus transcript:"""${text}"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
            temperature: 0.25,
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

    const csvText = (data?.candidates || [])
      .map(candidate =>
        candidate?.content?.parts?.map(part => part.text).join("") || ""
      )
      .join("\n");

    if (!csvText) {
      return NextResponse.json({ error: "Gemini returned no CSV" }, { status: 500 });
    }

    return NextResponse.json({ csvText });
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return NextResponse.json({ error: "Failed to call Gemini" }, { status: 500 });
  }
}