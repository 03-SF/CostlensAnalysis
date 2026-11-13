export const PASSWORD_RULES = [
  { label: "At least 10 characters", test: (password: string) => password.length >= 10 },
  { label: "An uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { label: "A lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { label: "A number", test: (password: string) => /[0-9]/.test(password) },
  { label: "A symbol (for example ! or ?)", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
];

export function unmetPasswordRules(password: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
