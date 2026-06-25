// server/repositories/walletRepository.js

/**
 * Wallet repository – Supabase-based, crash-safe version
 */

const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

/** Retrieve all wallets (safe) */
async function readWalletList() {
  try {
    const { data, error } = await Supabase.select('credits_wallets');
    if (error) {
      console.error('[wallet] readWalletList error:', error.message || error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[wallet] readWalletList exception:', err);
    return [];
  }
}

/** Retrieve all credit transactions (safe) */
async function readTransactionList() {
  try {
    const { data, error } = await Supabase.select('credit_transactions');
    if (error) {
      console.error('[wallet] readTransactionList error:', error.message || error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[wallet] readTransactionList exception:', err);
    return [];
  }
}

/** Get wallet by userId (optimized: no full table scan) */
async function getWalletByUserId(userId) {
  try {
    const { data, error } = await Supabase.select(
      'credits_wallets',
      { user_id: userId }
    );

    if (error) {
      console.error('[wallet] getWalletByUserId error:', error.message || error);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error('[wallet] getWalletByUserId exception:', err);
    return null;
  }
}

/** Create wallet safely */
async function createWallet(userId) {
  const wallet = {
    id: uuidv4(),
    user_id: userId,
    balance: 0,
    total_purchased: 0,
    total_consumed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await Supabase.insert('credits_wallets', wallet, userId);

  if (error) {
    console.error('[wallet] createWallet failed:', error.message || error);
    return null;
  }

  return wallet;
}

/** Get or create wallet (fully safe) */
// async function getOrCreateWallet(userId) {
//   try {
//     if (!userId) {
//       console.error('[wallet] getOrCreateWallet called with null userId');
//       return null;
//     }

//     let wallet = await getWalletByUserId(userId);

//     if (!wallet) {
//       wallet = await createWallet(userId);
//     }

//     return wallet;
//   } catch (err) {
//     console.error('[wallet] getOrCreateWallet exception:', err);
//     return null;
//   }
// }

async function getOrCreateWallet(userId) {
  try {
    if (!userId) {
      console.warn('[wallet] skipped: missing userId');
      return null;
    }

    // 🔥 CHECK USER EXISTS FIRST
    const { data: user, error: userErr } = await Supabase.select(
      'users',
      { id: userId }
    );

    if (userErr || !user || user.length === 0) {
      console.warn('[wallet] skipped: user does not exist in Supabase:', userId);
      return null;
    }

    const wallet = await getWalletByUserId(userId);
    if (wallet) return wallet;

    const walletData = {
      id: uuidv4(),
      user_id: userId,
      balance: 0,
      total_purchased: 0,
      total_consumed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await Supabase.insert('credits_wallets', walletData, userId);

    return walletData;
  } catch (err) {
    console.error('[wallet] create/get failed:', err.message || err);
    return null;
  }
}

/** Adjust wallet balance + transaction (safe + atomic-ish) */
async function adjustWalletBalance(userId, amount, type, description, reference) {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) throw new Error('Wallet not found or could not be created');

    const balanceBefore = Number(wallet.balance) || 0;
    const adjustAmount = Number(amount);
    if (Number.isNaN(adjustAmount)) {
      throw new Error('Invalid wallet adjustment amount: amount is NaN');
    }
    const balanceAfter = balanceBefore + adjustAmount;
    if (Number.isNaN(balanceAfter)) {
      throw new Error('Invalid wallet adjustment: balance after adjustment is NaN');
    }

    if (balanceAfter < 0) {
      const err = new Error('Insufficient wallet credits');
      err.errorCode = 'INSUFFICIENT_CREDITS';
      err.statusCode = 402;
      throw err;
    }

    const updatePayload = {
      balance: balanceAfter,
      updated_at: new Date().toISOString()
    };

    if (adjustAmount > 0) {
      updatePayload.total_purchased =
        (Number(wallet.total_purchased) || 0) + adjustAmount;
    } else {
      updatePayload.total_consumed =
        (Number(wallet.total_consumed) || 0) + Math.abs(adjustAmount);
    }

    const { error: updErr } = await Supabase.update(
      'credits_wallets',
      { id: wallet.id },
      updatePayload,
      userId
    );

    if (updErr) {
      console.error('[wallet] update failed:', updErr.message || updErr);
      throw updErr;
    }

    const txId = uuidv4();

    const txRecord = {
      id: txId,
      user_id: userId,
      type,
      amount: adjustAmount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference:
        reference || `tx_${txId.slice(0, 8)}_${Date.now()}`,
      description:
        description || `Credits adjusted by ${adjustAmount}`,
      created_at: new Date().toISOString()
    };

    const { error: txErr } = await Supabase.insert(
      'credit_transactions',
      txRecord,
      userId
    );

    if (txErr) {
      console.error('[wallet] transaction insert failed:', txErr.message || txErr);
      throw txErr;
    }

    return {
      wallet: { ...wallet, ...updatePayload },
      transaction: txRecord
    };
  } catch (err) {
    console.error('[wallet] adjustWalletBalance failed:', err);
    throw err;
  }
}

async function setWalletBalance(userId, balance, type = 'sync', description = 'Wallet balance synchronized', reference) {
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) throw new Error('Wallet not found or could not be created');

  const balanceBefore = Number(wallet.balance) || 0;
  const balanceAfter = Number(balance) || 0;
  const delta = balanceAfter - balanceBefore;

  const updatePayload = {
    balance: balanceAfter,
    updated_at: new Date().toISOString(),
  };

  if (type !== 'credit_sync' && delta > 0) {
    updatePayload.total_purchased = (Number(wallet.total_purchased) || 0) + delta;
  } else if (type !== 'credit_sync' && delta < 0) {
    updatePayload.total_consumed = (Number(wallet.total_consumed) || 0) + Math.abs(delta);
  }

  const { error: updErr } = await Supabase.update(
    'credits_wallets',
    { id: wallet.id },
    updatePayload,
    userId,
  );
  if (updErr) throw updErr;

  if (delta !== 0) {
    const txId = uuidv4();
    const txRecord = {
      id: txId,
      user_id: userId,
      type,
      amount: delta,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference: reference || `sync_${txId.slice(0, 8)}_${Date.now()}`,
      description,
      created_at: new Date().toISOString(),
    };
    const { error: txErr } = await Supabase.insert('credit_transactions', txRecord, userId);
    if (txErr) throw txErr;
  }

  return { ...wallet, ...updatePayload };
}

module.exports = {
  readWalletList,
  readTransactionList,
  getWalletByUserId,
  getOrCreateWallet,
  adjustWalletBalance,
  setWalletBalance,
};