const axios = require('axios');
const Expense = require('../models/Expense');

const VALID_CATEGORIES = [
  'Staff Salary',
  'Repairs & Maintenance',
  'Utilities',
  'Reserve Fund',
  'Other'
];

const isValidMonth = (month) => /^\d{4}-\d{2}$/.test(month || '');
const getGeminiApiKey = () => process.env.GEMIN_API_KEY || process.env.GEMINI_API_KEY;
const normalizeGeminiModelName = (model = '') => model.replace(/^models\//, '').trim();
let cachedGeminiModel = null;

function sanitizeExpenses(expenses) {
  if (!Array.isArray(expenses)) {
    return [];
  }

  return expenses
    .map((expense) => ({
      category: expense?.category,
      amount: Number(expense?.amount),
      description: expense?.description?.trim() || ''
    }))
    .filter(
      (expense) =>
        VALID_CATEGORIES.includes(expense.category) &&
        Number.isFinite(expense.amount) &&
        expense.amount > 0
    );
}

async function listGeminiModels() {
  const apiKey = getGeminiApiKey();

  const response = await axios.get(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  return response.data?.models || [];
}

async function resolveGeminiModel() {
  if (cachedGeminiModel) {
    return cachedGeminiModel;
  }

  const models = await listGeminiModels();
  const supportedModels = models.filter((model) =>
    model.supportedGenerationMethods?.includes('generateContent')
  );

  const normalizedNames = supportedModels
    .map((model) => normalizeGeminiModelName(model.baseModelId || model.name))
    .filter(Boolean);

  const preferredCandidates = [
  normalizeGeminiModelName(process.env.GEMINI_MODEL || ''),
  'gemini-3-flash',
].filter(Boolean);

  cachedGeminiModel =
    preferredCandidates.find((candidate) => normalizedNames.includes(candidate)) ||
    normalizedNames[0] ||
    null;

  return cachedGeminiModel;
}

async function getGeminiResponse(prompt) {
  const apiKey = getGeminiApiKey();
  const model = await resolveGeminiModel();

  if (!model) {
    throw new Error('No Gemini model with generateContent support is available for this API key.');
  }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 400
      }
    },
    {
      headers: {
        'content-type': 'application/json'
      }
    }
  );

  return response.data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function getAnthropicResponse(prompt) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-20250507',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );

  return response.data?.content?.find((item) => item.type === 'text')?.text;
}

exports.addExpense = async (req, res) => {
  try {
    const { month } = req.body;
    const expenses = sanitizeExpenses(req.body.expenses);

    if (!isValidMonth(month)) {
      return res.status(400).json({ message: 'Month must be in YYYY-MM format.' });
    }

    if (expenses.length === 0) {
      return res.status(400).json({
        message: 'Provide at least one valid expense with an amount greater than 0.'
      });
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const existingExpense = await Expense.findOne({ month });

    const expenseData = {
      month,
      expenses,
      totalAmount,
      createdBy: req.user.userId
    };

    let expense;
    let message;

    if (existingExpense) {
      existingExpense.set(expenseData);
      expense = await existingExpense.save();
      message = 'Expense updated successfully.';
    } else {
      expense = await Expense.create(expenseData);
      message = 'Expense added successfully.';
    }

    res.status(existingExpense ? 200 : 201).json({ message, expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpenseBreakdown = async (req, res) => {
  try {
    const { month } = req.query;

    if (!isValidMonth(month)) {
      return res.status(400).json({ message: 'Month must be in YYYY-MM format.' });
    }

    const expense = await Expense.findOne({ month }).populate('createdBy', 'name');

    if (!expense) {
      return res.status(404).json({ message: 'No expense data for this month.' });
    }

    const breakdown = expense.expenses.map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage:
        expense.totalAmount > 0
          ? Number(((item.amount / expense.totalAmount) * 100).toFixed(2))
          : 0,
      description: item.description
    }));

    res.json({
      month,
      totalAmount: expense.totalAmount,
      breakdown,
      createdBy: expense.createdBy
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ month: -1 })
      .populate('createdBy', 'name');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.askAI = async (req, res) => {
  try {
    const { question, month } = req.body;
    const trimmedQuestion = question?.trim();

    if (!trimmedQuestion) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    if (!isValidMonth(month)) {
      return res.status(400).json({ message: 'Month must be in YYYY-MM format.' });
    }

    if (!getGeminiApiKey() && !process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        message: 'Configure GEMIN_API_KEY or ANTHROPIC_API_KEY to use the AI assistant.'
      });
    }

    const expense = await Expense.findOne({ month });

    if (!expense) {
      return res.status(404).json({ message: 'No expense data for this month.' });
    }

    const expenseContext = expense.expenses
      .map((item) => `${item.category}: Rs ${item.amount} (${item.description || 'No description'})`)
      .join('\n');

    const prompt = `You are a helpful society maintenance assistant.
Here are the expenses for ${month}:
${expenseContext}
Total: Rs ${expense.totalAmount}

Resident question: ${trimmedQuestion}

Provide a clear and transparent answer in 2-3 sentences.`;

    const aiResponse = getGeminiApiKey()
      ? await getGeminiResponse(prompt)
      : await getAnthropicResponse(prompt);

    if (!aiResponse) {
      return res.status(502).json({ message: 'AI provider returned an empty response.' });
    }

    res.json({
      question: trimmedQuestion,
      answer: aiResponse,
      month
    });
  } catch (error) {
    const providerMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;

    console.error('AI Error:', providerMessage);
    res.status(502).json({ message: `Error getting AI response: ${providerMessage}` });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ month: 1 });

    const trends = expenses.map((expense) => {
      const categoryTotals = {};

      expense.expenses.forEach((item) => {
        categoryTotals[item.category] = item.amount;
      });

      return {
        month: expense.month,
        totalAmount: expense.totalAmount,
        ...categoryTotals
      };
    });

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
