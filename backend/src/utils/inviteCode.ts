export function normalizeInviteCode(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase();
}

export function inviteCodesMatch(inputCode: string, storedCode: string): boolean {
  return normalizeInviteCode(inputCode) === normalizeInviteCode(storedCode);
}
