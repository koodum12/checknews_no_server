/**
 * 서버 없이 동작하는 클라이언트 사이드 키워드 기반 편향 분석
 * 서버가 오프라인일 때 analyzeArticle()의 폴백으로 사용됨
 */
import type { AnalyzeResult } from "./api";

const BIAS_KEYWORDS: Array<{ keyword: string; reason: string }> = [
  { keyword: "무분별한", reason: "가치판단이 담긴 부정적 수식어" },
  { keyword: "졸속", reason: "경멸적 수식어" },
  { keyword: "참담한", reason: "감정적 어투" },
  { keyword: "망국적", reason: "극단적 표현" },
  { keyword: "친중", reason: "이념적 프레이밍" },
  { keyword: "포퓰리즘", reason: "정치적 낙인 표현" },
  { keyword: "명백히", reason: "단정적 서술" },
  { keyword: "전문가들은", reason: "출처 불명확한 일반화" },
  { keyword: "일각에서는", reason: "모호한 주체 일반화" },
  { keyword: "강하게 비판", reason: "감정적 어투" },
  { keyword: "또다시", reason: "반복 강조를 통한 부정적 프레이밍" },
  { keyword: "현실과 동떨어진", reason: "가치판단 서술" },
  { keyword: "충격적", reason: "감정 자극 표현" },
  { keyword: "파격", reason: "과장 수식어" },
  { keyword: "서민을 외면", reason: "단정적 프레이밍" },
  { keyword: "낙하산", reason: "부정적 프레이밍 표현" },
  { keyword: "강행", reason: "일방적 행동을 부각하는 표현" },
  { keyword: "망신", reason: "감정적 부정 표현" },
  { keyword: "폭탄", reason: "과장된 위협 수식어" },
  { keyword: "논란", reason: "중립적이지 않은 갈등 부각" },
];

export function mockAnalyzeText(body: string): AnalyzeResult {
  const sentences = body
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const highlights: AnalyzeResult["highlight_sentences"] = [];
  let keywordCount = 0;

  sentences.forEach((sent, idx) => {
    for (const { keyword, reason } of BIAS_KEYWORDS) {
      if (sent.includes(keyword)) {
        keywordCount++;
        if (highlights.length < 5) {
          highlights.push({ text: sent, reason, position: idx });
        }
        break;
      }
    }
  });

  const rawScore = Math.min(keywordCount * 11, 85);
  const bias_score = Math.max(5, Math.min(95, rawScore));
  const bias_level = bias_score >= 61 ? "high" : bias_score >= 41 ? "medium" : "low";

  return {
    bias_score,
    bias_level,
    summary: "",
    report:
      "(오프라인 Mock) 키워드 기반 편향 추정 결과입니다. " +
      "정확한 AI 분석을 위해 서버를 실행하고 다시 시도해주세요.",
    highlight_sentences: highlights,
    is_mock: true,
    used_llm: false,
  };
}
