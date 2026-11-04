export function parseWebOrigins(value: string | undefined): string[] {
  return value?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
}

export function parseAiReviewDailyLimit(value: string | undefined): number {
  if (value === undefined) return 50;
  const limit = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isInteger(limit) || limit > 2147483647) {
    throw new Error("AI_REVIEW_DAILY_LIMIT must be a positive 32-bit integer");
  }
  return limit;
}

export function parseSeedCaseCount(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const count = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isInteger(count) || count > 2000) {
    throw new Error("SEED_CASE_COUNT must be a positive integer no greater than 2000");
  }
  return count;
}
