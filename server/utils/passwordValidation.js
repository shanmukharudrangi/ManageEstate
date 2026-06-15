const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /\d/.test(password)
  },
  {
    id: 'special',
    label: 'One special character',
    test: (password) => /[^A-Za-z0-9]/.test(password)
  }
];

function evaluatePassword(password = '') {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password)
  }));

  return {
    isValid: results.every((rule) => rule.passed),
    rules: results
  };
}

function getPasswordErrorMessage(results) {
  const unmetRules = results.rules
    .filter((rule) => !rule.passed)
    .map((rule) => rule.label.toLowerCase());

  return `Password must include ${unmetRules.join(', ')}.`;
}

module.exports = {
  PASSWORD_RULES,
  evaluatePassword,
  getPasswordErrorMessage
};
