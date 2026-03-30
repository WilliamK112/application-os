import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { InterviewQuestion } from "@/types/domain";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: 700,
    },
  ],
});

const CATEGORY_COLORS: Record<string, string> = {
  BEHAVIORAL: "#DBEAFE",
  TECHNICAL: "#F3E8FF",
  SYSTEM_DESIGN: "#FEF3C7",
  CODING: "#DCFCE7",
  LEADERSHIP: "#FEE2E2",
  CULTURE_FIT: "#FCE7F3",
  COMPENSATION: "#FEF9C3",
  OTHER: "#F1F5F9",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  BEHAVIORAL: "#1E40AF",
  TECHNICAL: "#6B21A8",
  SYSTEM_DESIGN: "#92400E",
  CODING: "#166534",
  LEADERSHIP: "#991B1B",
  CULTURE_FIT: "#9D174D",
  COMPENSATION: "#854D0E",
  OTHER: "#475569",
};

const QUESTION_CATEGORY_LABELS: Record<string, string> = {
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  LEADERSHIP: "Leadership",
  CULTURE_FIT: "Culture Fit",
  COMPENSATION: "Compensation",
  OTHER: "Other",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#1E293B",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2px solid #3B82F6",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 4,
  },
  meta: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },
  categoryCount: {
    fontSize: 9,
    color: "#94A3B8",
    marginLeft: 6,
  },
  questionCard: {
    marginBottom: 10,
    paddingLeft: 14,
    borderLeft: "3px solid #CBD5E1",
  },
  questionBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 700,
    padding: "2 6",
    borderRadius: 3,
  },
  usageBadge: {
    fontSize: 8,
    color: "#64748B",
    marginLeft: 6,
  },
  questionText: {
    fontSize: 10,
    fontWeight: 400,
    color: "#1E293B",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  answerLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: "#94A3B8",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    fontSize: 8,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    padding: "2 5",
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: "1px solid #E2E8F0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#94A3B8",
  },
  pageNumber: {
    fontSize: 8,
    color: "#94A3B8",
  },
  emptyState: {
    textAlign: "center",
    marginTop: 40,
    color: "#94A3B8",
    fontSize: 12,
  },
});

interface QuestionBankPdfProps {
  questions: InterviewQuestion[];
  generatedAt: string;
  totalCount: number;
}

function CategorySection({
  category,
  questions,
}: {
  category: string;
  questions: InterviewQuestion[];
}) {
  const bgColor = CATEGORY_COLORS[category] ?? "#F1F5F9";
  const textColor = CATEGORY_TEXT_COLORS[category] ?? "#475569";
  const label = QUESTION_CATEGORY_LABELS[category] ?? category;

  return (
    <View>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryDot, { backgroundColor: textColor }]} />
        <Text style={styles.categoryTitle}>{label}</Text>
        <Text style={styles.categoryCount}>({questions.length})</Text>
      </View>
      {questions.map((q) => (
        <View key={q.id} style={styles.questionCard}>
          <View style={styles.questionBadge}>
            <Text style={[styles.badgeText, { backgroundColor: bgColor, color: textColor }]}>
              {label}
            </Text>
            {q.usageCount > 0 && (
              <Text style={styles.usageBadge}>📝 Used {q.usageCount}x</Text>
            )}
          </View>
          <Text style={styles.questionText}>{q.question}</Text>
          {q.answerHints && (
            <>
              <Text style={styles.answerLabel}>Answer Hints</Text>
              <Text style={styles.answerText}>{q.answerHints}</Text>
            </>
          )}
          {q.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {q.tags.map((tag) => (
                <Text key={tag} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export function QuestionBankPdf({
  questions,
  generatedAt,
  totalCount,
}: QuestionBankPdfProps) {
  // Group by category
  const grouped: Record<string, InterviewQuestion[]> = {};
  for (const q of questions) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  const categories = Object.keys(grouped).sort();

  return (
    <Document
      title="Interview Question Bank"
      author="Application OS"
      subject="Interview Questions"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Interview Question Bank</Text>
          <Text style={styles.subtitle}>
            {totalCount} question{totalCount !== 1 ? "s" : ""} across{" "}
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </Text>
          <Text style={styles.meta}>Generated: {generatedAt}</Text>
        </View>

        {/* Categories */}
        {categories.length === 0 ? (
          <Text style={styles.emptyState}>No questions in the bank yet.</Text>
        ) : (
          categories.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              questions={grouped[cat]}
            />
          ))
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Application OS — Interview Question Bank</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
