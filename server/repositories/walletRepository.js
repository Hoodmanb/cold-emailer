const { v4: uuidv4 } = require('uuid');
const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');

const FILE_NAME = 'credits_wallets.json';
const WALLET_TX_FILE = 'credit_transactions.json';

function readWalletList() {
  const raw = safeRead(FILE_NAME, []);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && raw.__scoped === true) {
    // Global wallet store was incorrectly scoped — recover wallet rows if any exist.
    const wallets = [];
    const users = raw.users && typeof raw.users === 'object' ? raw.users : {};
    for (const userData of Object.values(users)) {
      if (Array.isArray(userData)) {
        wallets.push(...userData.filter((row) => row && typeof row === 'object'));
      } else if (userData && typeof userData === 'object' && userData.user_id) {
        wallets.push(userData);
      }
    }
    return wallets;
  }
  return [];
}

function writeWalletList(wallets) {
  atomicWrite(FILE_NAME, Array.isArray(wallets) ? wallets : []);
}

function readTransactionList() {
  const raw = safeRead(WALLET_TX_FILE, []);
  return Array.isArray(raw) ? raw : [];
}

function getOrCreateWallet(userId, useTx = false) {
  const readFn = () => {
    const wallets = readWalletList();
    let wallet = wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      // Fetch user to check if they have existing credits
      const users = safeRead('users.json', []);
      const user = users.find((u) => u.id === userId);
      const existingCredits = user ? Number(user.credits || 0) : 0;

      wallet = {
        id: uuidv4(),
        user_id: userId,
        balance: existingCredits,
        total_purchased: existingCredits,
        total_consumed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      wallets.push(wallet);
      writeWalletList(wallets);

      // Keep user.credits in sync
      if (user) {
        user.credits = existingCredits;
        user.updatedAt = new Date().toISOString();
        user.userVersion = (user.userVersion || 1) + 1;
        atomicWrite('users.json', users);
      }
    }
    return wallet;
  };

  if (useTx) {
    return readFn();
  }
  return withLock(FILE_NAME, readFn);
}

function adjustWalletBalance(userId, amount, type, description, reference, useTx = false) {
  const op = () => {
    let wallets = readWalletList();
    let walletIdx = wallets.findIndex((w) => w.user_id === userId);
    if (walletIdx < 0) {
      getOrCreateWallet(userId, true);
      wallets = readWalletList();
      walletIdx = wallets.findIndex((w) => w.user_id === userId);
    }

    const wallet = wallets[walletIdx];
    const balanceBefore = Number(wallet.balance) || 0;
    const adjustAmount = Number(amount);
    const balanceAfter = balanceBefore + adjustAmount;

    // Prevent negative balance
    if (balanceAfter < 0) {
      const err = new Error('Insufficient wallet credits');
      err.errorCode = 'INSUFFICIENT_CREDITS';
      err.statusCode = 402;
      throw err;
    }

    // Update statistics
    wallet.balance = balanceAfter;
    if (adjustAmount > 0) {
      wallet.total_purchased = (Number(wallet.total_purchased) || 0) + adjustAmount;
    } else {
      wallet.total_consumed = (Number(wallet.total_consumed) || 0) - adjustAmount; // adjustAmount is negative
    }
    wallet.updated_at = new Date().toISOString();
    wallets[walletIdx] = wallet;

    writeWalletList(wallets);

    const transactions = readTransactionList();
    const txId = uuidv4();
    const txRecord = {
      id: txId,
      user_id: userId,
      type, // purchase, ai_usage, refund, admin_adjustment, bonus
      amount: adjustAmount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference: reference || `tx_${txId.slice(0, 8)}_${Date.now()}`,
      description: description || `Credits adjusted by ${adjustAmount}`,
      created_at: new Date().toISOString(),
    };
    transactions.push(txRecord);
    atomicWrite(WALLET_TX_FILE, transactions);

    // Sync users.json for backward compatibility
    const users = safeRead('users.json', []);
    const userIdx = users.findIndex((u) => u.id === userId);
    if (userIdx >= 0) {
      users[userIdx].credits = balanceAfter;
      users[userIdx].updatedAt = new Date().toISOString();
      users[userIdx].userVersion = (users[userIdx].userVersion || 1) + 1;
      atomicWrite('users.json', users);
    }

    return { wallet, transaction: txRecord };
  };

  if (useTx) {
    return op();
  }

  // Lock both files if not in a transaction
  return withLock(FILE_NAME, () => {
    return withLock(WALLET_TX_FILE, op);
  });
}

module.exports = {
  getOrCreateWallet,
  adjustWalletBalance,
  readWalletList,
  writeWalletList,
};
