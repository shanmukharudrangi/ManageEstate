export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (password) => password.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { id: 'lowercase', label: 'One lowercase letter', test: (password) => /[a-z]/.test(password) },
  { id: 'number', label: 'One number', test: (password) => /\d/.test(password) },
  {
    id: 'special',
    label: 'One special character',
    test: (password) => /[^A-Za-z0-9]/.test(password)
  }
];

export function evaluatePassword(password = '') {
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password)
  }));
  const score = rules.filter((rule) => rule.passed).length;

  return {
    score,
    rules,
    isValid: rules.every((rule) => rule.passed)
  };
}

export function getPasswordStrengthMeta(score) {
  if (score <= 2) {
    return {
      label: 'Weak',
      tone: 'danger'
    };
  }

  if (score === 3 || score === 4) {
    return {
      label: 'Good',
      tone: 'warning'
    };
  }

  return {
    label: 'Strong',
    tone: 'success'
  };
}
