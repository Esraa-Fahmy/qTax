const asyncHandler = require("express-async-handler");
const Wallet = require("../models/walletModel");
const ApiError = require("../utils/apiError");

// @desc    Get wallet balance and transactions
// @route   GET /api/v1/passenger/wallet
// @access  Private (Passenger)
exports.getWallet = asyncHandler(async (req, res, next) => {
  let wallet = await Wallet.findOne({ user: req.user._id });

  // Create wallet if doesn't exist
  if (!wallet) {
    wallet = await Wallet.create({ user: req.user._id, balance: 0 });
  }

  res.status(200).json({
    status: "success",
    data: {
      balance: wallet.balance,
      transactions: wallet.transactions.slice(0, 20), // Last 20 transactions
    },
  });
});

// @desc    Get all transactions (paginated)
// @route   GET /api/v1/passenger/wallet/transactions
// @access  Private (Passenger)
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    return res.status(200).json({
      status: "success",
      results: 0,
      data: [],
    });
  }

  const transactions = wallet.transactions
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice((page - 1) * limit, page * limit);

  res.status(200).json({
    status: "success",
    results: transactions.length,
    total: wallet.transactions.length,
    currentPage: page,
    totalPages: Math.ceil(wallet.transactions.length / limit),
    data: transactions,
  });
});

// @desc    Top up wallet
// @route   POST /api/v1/passenger/wallet/topup
// @access  Private (Passenger)
exports.topUpWallet = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return next(new ApiError("Amount must be greater than 0", 400));
  }

  let wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({ user: req.user._id, balance: 0 });
  }

  const balanceBefore = wallet.balance;
  wallet.balance += amount;
  const balanceAfter = wallet.balance;

  // Add transaction
  wallet.transactions.push({
    type: "topup",
    amount,
    description: `Wallet top-up of ${amount} EGP`,
    balanceBefore,
    balanceAfter,
  });

  await wallet.save();

  res.status(200).json({
    status: "success",
    message: "Wallet topped up successfully",
    data: {
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1],
    },
  });
});

// @desc    Deduct from wallet (internal use - for ride payments)
// @route   Internal function
exports.deductFromWallet = async (userId, amount, rideId, description, allowOverdraft = false) => {
  let wallet = await Wallet.findOne({ user: userId });

  // Create wallet if doesn't exist (needed for drivers who might not have one yet)
  if (!wallet && allowOverdraft) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (!allowOverdraft && wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  const balanceAfter = wallet.balance;

  wallet.transactions.push({
    type: "ride_payment",
    amount: -amount,
    description: description || `Ride payment`,
    rideId,
    balanceBefore,
    balanceAfter,
  });

  await wallet.save();
  return wallet;
};

// @desc    Refund to wallet
// @route   Internal function
exports.refundToWallet = async (userId, amount, rideId, description) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }

  const balanceBefore = wallet.balance;
  wallet.balance += amount;
  const balanceAfter = wallet.balance;

  wallet.transactions.push({
    type: "refund",
    amount,
    description: description || `Refund for cancelled ride`,
    rideId,
    balanceBefore,
    balanceAfter,
  });

  await wallet.save();
  return wallet;
};
