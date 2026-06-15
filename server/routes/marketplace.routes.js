/**
 * ============================================================================
 * Marketplace — Routes
 * ============================================================================
 *
 * Mounted at:  /api/marketplace
 *
 * Route map
 * ─────────
 * GET    /listings               Public browse with query filters
 * POST   /listings               Auth'd — create a listing (with image upload)
 * PUT    /listings/:id           Auth'd — update own listing
 * DELETE /listings/:id           Auth'd — soft-delete (archive) own listing
 * POST   /listings/:id/purchase  Auth'd — purchase a listing atomically
 * GET    /profile/me             Auth'd — own active listings + sales history
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const listingController = require('../controllers/marketplace/listingController');

const router = express.Router();

// ── Authenticated ─── (all routes require login) ──────────────────────────
router.get('/listings', authMiddleware, listingController.getListings);

// ── Authenticated ─────────────────────────────────────────────────────────
router.post(
  '/listings',
  authMiddleware,
  upload.array('images', 5),
  listingController.createListing
);
router.put('/listings/:id', authMiddleware, listingController.updateListing);
router.delete('/listings/:id', authMiddleware, listingController.deleteListing);

router.post('/listings/:id/purchase', authMiddleware, listingController.purchaseListing);

router.get('/profile/me', authMiddleware, listingController.getMyProfile);

module.exports = router;
