import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";
import { QuestionBankPdf } from "@/components/pdf/question-bank-pdf";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await applicationOsService.listQuestions(session.user.id);
    const now = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const buffer = await renderToBuffer(
      <QuestionBankPdf
        questions={questions}
        generatedAt={now}
        totalCount={questions.length}
      />,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename=\"interview-question-bank.pdf\"",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export/questions/pdf]", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
