import { pdfjsLib } from "@/lib/pdfjs";

export async function extractPdfText(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}
