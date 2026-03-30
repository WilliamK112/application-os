import type { Document } from "@/types/domain";

export type DocumentApplicationProfile = {
  resumeUrl?: string;
  coverLetterUrl?: string;
  source: "documents" | "fallback";
  diagnostics: string[];
};

function pickDefaultDoc(documents: Document[], type: Document["type"]): Document | undefined {
  const byType = documents.filter((doc) => doc.type === type);
  if (byType.length === 0) {
    return undefined;
  }

  return byType.find((doc) => doc.isDefault) ?? byType[0];
}

export function buildDocumentApplicationProfile(
  documents: Document[],
): DocumentApplicationProfile {
  const diagnostics: string[] = [];

  const resume = pickDefaultDoc(documents, "RESUME");
  const coverLetter = pickDefaultDoc(documents, "COVER_LETTER");

  if (!resume?.url) {
    diagnostics.push("Missing default resume URL in Documents.");
  }

  if (!coverLetter?.url) {
    diagnostics.push("No cover letter URL found in Documents (optional)." );
  }

  return {
    resumeUrl: resume?.url,
    coverLetterUrl: coverLetter?.url,
    source: "documents",
    diagnostics,
  };
}
