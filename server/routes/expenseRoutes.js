const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/expenses - Admin adds expense (protected)
router.post('/', authMiddleware, adminOnly, expenseController.addExpense);

// GET /api/expenses/breakdown - Resident views breakdown
router.get('/breakdown', authMiddleware, expenseController.getExpenseBreakdown);

// GET /api/expenses/all - Get all expenses
router.get('/all', authMiddleware, expenseController.getAllExpenses);

// GET /api/expenses/trends - Get monthly trends
router.get('/trends', authMiddleware, expenseController.getTrends);

// POST /api/expenses/ask-ai - Ask AI about expenses
router.post('/ask-ai', authMiddleware, expenseController.askAI);

module.exports = router;
