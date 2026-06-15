/**
 * ============================================================================
 * Marketplace — Listing Controller
 * ============================================================================
 *
 * CRUD operations for marketplace listings plus purchase and profile endpoints.
 *
 * Isolation guarantees
 * ────────────────────
 * - Only imports Listing and Transaction models from the marketplace module.
 * - Never reads/writes Expense, Complaint, or any unrelated core model.
 * - Uses `req.user` set by the existing auth middleware — no middleware edits.
 */

const Listing = require('../../models/Listing');
const Transaction = require('../../models/Transaction');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Shared constants (kept in sync with the schema)
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = [
  'Furniture',
  'Electronics',
  'Appliances',
  'Vehicles',
  'Books',
  'Other',
];

const VALID_STATUSES = ['available', 'pending', 'sold', 'archived'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the authenticated user's ID from the JWT payload.
 * Mirrors the pattern in routes/complaints.js.
 */
const getAuthenticatedUserId = (req) => req.user.userId || req.user.id;

/**
 * Collect validation errors for a listing payload.
 * Returns an array of human-readable error strings (empty = valid).
 */
function validateListingPayload(body, { isUpdate = false } = {}) {
  const errors = [];
  const { title, description, price, category, images, status } = body;

  // ── title ──────────────────────────────────────────────────────────
  if (!isUpdate || title !== undefined) {
    if (title === undefined || title === null) {
      if (!isUpdate) errors.push('Title is required.');
    } else if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title must be a non-empty string.');
    } else if (title.trim().length > 120) {
      errors.push('Title cannot exceed 120 characters.');
    }
  }

  // ── description ────────────────────────────────────────────────────
  if (!isUpdate || description !== undefined) {
    if (description === undefined || description === null) {
      if (!isUpdate) errors.push('Description is required.');
    } else if (typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description must be a non-empty string.');
    } else if (description.trim().length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    }
  }

  // ── price ──────────────────────────────────────────────────────────
  if (!isUpdate || price !== undefined) {
    if (price === undefined || price === null) {
      if (!isUpdate) errors.push('Price is required.');
    } else {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice)) {
        errors.push('Price must be a valid number.');
      } else if (numericPrice < 0) {
        errors.push('Price cannot be negative.');
      }
    }
  }

  // ── category ───────────────────────────────────────────────────────
  if (!isUpdate || category !== undefined) {
    if (category === undefined || category === null) {
      if (!isUpdate) errors.push('Category is required.');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push(
        `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}.`
      );
    }
  }

  // ── images ─────────────────────────────────────────────────────────
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.push('Images must be an array of URL strings.');
    } else if (images.length > 10) {
      errors.push('A listing may have at most 10 images.');
    } else if (images.some((url) => typeof url !== 'string' || url.trim().length === 0)) {
      errors.push('Every image entry must be a non-empty URL string.');
    }
  }

  // ── status (update only) ───────────────────────────────────────────
  if (isUpdate && status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      errors.push(
        `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}.`
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// GET  /api/marketplace/listings
// Public — browse with optional filters
// ---------------------------------------------------------------------------

exports.getListings = async (req, res) => {
  try {
    const {
      category,
      status,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res
          .status(400)
          .json({ message: `Invalid category filter. Must be one of: ${VALID_CATEGORIES.join(', ')}.` });
      }
      filter.category = category;
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}.` });
      }
      filter.status = status;
    } else {
      // Default: only show available listings; archived items are excluded
      filter.status = 'available';
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        const min = Number(minPrice);
        if (!Number.isFinite(min) || min < 0) {
          return res.status(400).json({ message: 'minPrice must be a non-negative number.' });
        }
        filter.price.$gte = min;
      }
      if (maxPrice !== undefined) {
        const max = Number(maxPrice);
        if (!Number.isFinite(max) || max < 0) {
          return res.status(400).json({ message: 'maxPrice must be a non-negative number.' });
        }
        filter.price.$lte = max;
      }
    }

    if (search && search.trim().length > 0) {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'price', 'title'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ [safeSortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('sellerId', 'name email apartment')
        .lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({
      listings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST  /api/marketplace/listings
// Authenticated — create a new listing (supports multipart image uploads)
// ---------------------------------------------------------------------------

exports.createListing = async (req, res) => {
  try {
    const sellerId = getAuthenticatedUserId(req);

    if (!sellerId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // ── Validation ────────────────────────────────────────────────────
    const errors = validateListingPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const { title, description, price, category } = req.body;

    // ── Map uploaded files to public URL paths ────────────────────────
    // req.files is populated by upload.array('images', 5) in the router.
    // Fall back to an empty array if no files were attached.
    const uploadedImages = req.files && req.files.length > 0
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const listing = await Listing.create({
      sellerId,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      images: uploadedImages,
      category,
    });

    res.status(201).json({
      message: 'Listing created successfully.',
      listing,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: 'Validation failed.', errors: messages });
    }

    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// PUT  /api/marketplace/listings/:id
// Authenticated — update own listing
// ---------------------------------------------------------------------------

exports.updateListing = async (req, res) => {
  try {
    const sellerId = getAuthenticatedUserId(req);

    if (!sellerId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listing.sellerId.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'You can only edit your own listings.' });
    }

    if (listing.status === 'sold') {
      return res
        .status(400)
        .json({ message: 'Cannot edit a listing that has already been sold.' });
    }

    const errors = validateListingPayload(req.body, { isUpdate: true });

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const allowedFields = ['title', 'description', 'price', 'images', 'category', 'status'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : field === 'price'
              ? Number(req.body[field])
              : req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    res.json({
      message: 'Listing updated successfully.',
      listing: updatedListing,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: 'Validation failed.', errors: messages });
    }

    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE  /api/marketplace/listings/:id
// Authenticated — soft-delete (archive) own listing
// ---------------------------------------------------------------------------

exports.deleteListing = async (req, res) => {
  try {
    const sellerId = getAuthenticatedUserId(req);

    if (!sellerId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (listing.sellerId.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: 'You can only archive your own listings.' });
    }

    if (listing.status === 'archived') {
      return res.status(400).json({ message: 'Listing is already archived.' });
    }

    listing.status = 'archived';
    await listing.save();

    res.json({
      message: 'Listing archived successfully.',
      listing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST  /api/marketplace/listings/:id/purchase
// Authenticated — atomically purchase a listing; blocks self-purchases
// ---------------------------------------------------------------------------

exports.purchaseListing = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const buyerId = getAuthenticatedUserId(req);

    if (!buyerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }

    // Fetch listing inside the session so the read participates in the transaction
    const listing = await Listing.findById(req.params.id).session(session);

    if (!listing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // ── Block self-purchases ──────────────────────────────────────────
    if (listing.sellerId.toString() === buyerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'You cannot purchase your own listing.' });
    }

    // ── Only available listings can be purchased ──────────────────────
    if (listing.status !== 'available') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Listing is not available for purchase (current status: "${listing.status}").`,
      });
    }

    // ── Atomic update: mark listing as sold ───────────────────────────
    listing.status = 'sold';
    await listing.save({ session });

    // ── Record the transaction ────────────────────────────────────────
    const [transaction] = await Transaction.create(
      [
        {
          listingId: listing._id,
          sellerId: listing.sellerId,
          buyerId,
          purchasePrice: listing.price,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Purchase completed successfully.',
      transaction,
      listing,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET  /api/marketplace/profile/me
// Authenticated — returns logged-in user's active listings and sales history
// ---------------------------------------------------------------------------

exports.getMyProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Run both queries in parallel for efficiency
    const [activeListings, salesHistory] = await Promise.all([
      // Active listings: everything the user is currently selling (not sold/archived)
      Listing.find({
        sellerId: userId,
        status: { $in: ['available', 'pending'] },
      })
        .sort({ createdAt: -1 })
        .lean(),

      // Sales history: completed transactions where the user was the seller,
      // with listing details populated
      Transaction.find({ sellerId: userId })
        .sort({ createdAt: -1 })
        .populate('listingId', 'title category images')
        .populate('buyerId', 'name apartment')
        .lean(),
    ]);

    res.json({
      activeListings,
      salesHistory,
      summary: {
        activeCount: activeListings.length,
        soldCount: salesHistory.length,
        totalRevenue: salesHistory.reduce((sum, t) => sum + t.purchasePrice, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
