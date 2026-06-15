export const CATEGORY_META = {
  'Staff Salary': {
    color: '#4f46e5',
    soft: 'rgba(79, 70, 229, 0.14)',
    glow: 'rgba(99, 102, 241, 0.32)',
    icon: 'team'
  },
  'Repairs & Maintenance': {
    color: '#ec4899',
    soft: 'rgba(236, 72, 153, 0.14)',
    glow: 'rgba(244, 114, 182, 0.28)',
    icon: 'tools'
  },
  Utilities: {
    color: '#0ea5e9',
    soft: 'rgba(14, 165, 233, 0.14)',
    glow: 'rgba(56, 189, 248, 0.28)',
    icon: 'bolt'
  },
  'Reserve Fund': {
    color: '#8b5cf6',
    soft: 'rgba(139, 92, 246, 0.14)',
    glow: 'rgba(167, 139, 250, 0.28)',
    icon: 'shield'
  },
  Other: {
    color: '#14b8a6',
    soft: 'rgba(20, 184, 166, 0.14)',
    glow: 'rgba(45, 212, 191, 0.28)',
    icon: 'spark'
  }
};

const DEFAULT_CATEGORY_ORDER = [
  'Staff Salary',
  'Repairs & Maintenance',
  'Utilities',
  'Reserve Fund'
];

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}

export function buildDefaultExpenseList() {
  return DEFAULT_CATEGORY_ORDER.map((category) => ({
    category,
    amount: '',
    description: ''
  }));
}

export function buildExpenseFormRows(savedExpenses = []) {
  const baseRows = DEFAULT_CATEGORY_ORDER.map((category) => {
    const matchedExpense = savedExpenses.find((expense) => expense.category === category);

    return matchedExpense
      ? {
          category: matchedExpense.category,
          amount: matchedExpense.amount,
          description: matchedExpense.description || ''
        }
      : {
          category,
          amount: '',
          description: ''
        };
  });

  const extraRows = savedExpenses
    .filter((expense) => !DEFAULT_CATEGORY_ORDER.includes(expense.category))
    .map((expense) => ({
      category: expense.category,
      amount: expense.amount,
      description: expense.description || ''
    }));

  return [...baseRows, ...extraRows];
}

export function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export function formatMonthLabel(month) {
  if (!month) {
    return 'Unknown month';
  }

  const date = new Date(`${month}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}
