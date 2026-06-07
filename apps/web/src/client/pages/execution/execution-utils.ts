export function isMyBoTeamCreditExhaustedError(message?: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('credits_exhausted') ||
    lower.includes('monthly_credit_limit_reached') ||
    (lower.includes('myboteam') && lower.includes('free credits'))
  );
}
