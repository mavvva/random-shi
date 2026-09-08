import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
You are a study notes generator. Read the attached document and output organized notes structured as a JSON-like text outline or clear plain text sections.

Follow this exact content requirement:
1. TITLE: First line must be the lesson title.
2. TERMINOLOGY FORMAT:
   - Term: [Term Name]
   - Definition: [Definition with **2-3 bold keywords** for memory]
   - Analogy: [Simple analogy or explanation]
   - Example: [Example text]

3. ENUMERATION / FUNCTIONS FORMAT:
   - Category: [Category Name]
     * [Item Name] - [Short explanation]

Keep it clean, concise, and structured. Do not use HTML tags. Use markdown or plain text only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    });

    return NextResponse.json({
      success: true,
      notes: response.text,
    });

  } catch (error: unknown) {
    console.error("Error generating notes:", error);
    return NextResponse.json(
      { error: "Failed to generate notes from file" },
      { status: 500 }
    );
  }
}