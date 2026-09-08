"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfmake fonts safely
if (typeof window !== "undefined") {
  (pdfMake as any).vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : (pdfFonts as any).vfs;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("DROP YOUR PDF HERE");

  const generateAndDownloadPDF = (notesText: string, fileName: string) => {
    const docDefinition: any = {
      content: [
        { text: "WRITEMYNOTES", fontSize: 10, bold: true, color: "#9333ea", margin: [0, 0, 0, 10] },
        { text: notesText, fontSize: 11, lineHeight: 1.4 }
      ],
      defaultStyle: {
        font: 'Roboto'
      },
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] }
      }
    };

    pdfMake.createPdf(docDefinition).download(`${fileName}_notes.pdf`);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    setStatusText("PROCESSING FILE & GENERATING NOTES...");

    const uploadedFile = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.notes) {
        // Automatically trigger PDF download and skip the preview box completely
        const baseName = uploadedFile.name.replace(/\.[^/.]+$/, "");
        generateAndDownloadPDF(data.notes, baseName);
      } else {
        alert("Error generating notes from file.");
      }
    } catch {
      alert("Failed to connect to server.");
    } finally {
      setLoading(false);
      setStatusText("DROP YOUR PDF HERE");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <main className="min-h-screen bg-[#111111] text-gray-800 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="font-bold text-sm tracking-wider text-purple-700 uppercase mb-8">
          WRITEMYNOTES
        </h1>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragActive ? "border-purple-600 bg-purple-50" : "border-purple-300 hover:border-purple-500"
          }`}
        >
          <input {...getInputProps()} />
          <svg className="w-10 h-10 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="font-bold text-gray-800 text-sm tracking-wide">
            {loading ? statusText : "DROP YOUR PDF HERE"}
          </p>
          <p className="text-xs text-purple-600 mt-2 font-medium">
            or <span className="underline">browse files</span>
          </p>
        </div>
      </div>
    </main>
  );
}