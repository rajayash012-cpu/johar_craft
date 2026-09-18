import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Account, ArtisanAccount, BuyerAccount } from '../types';
import {
  getAccounts,
  getActiveAccount,
  setActiveAccount as serviceSetActiveAccount,
  switchAccount as serviceSwitchAccount,
  createArtisanAccount,
  createBuyerAccount,
  updateAccount as serviceUpdateAccount,
  deleteAccount as serviceDeleteAccount,
  initializeAccountsIfNeeded,
} from '../services/accountService';

interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  isArtisan: boolean;
  isBuyer: boolean;
  activeArtisan: ArtisanAccount | null;
  activeBuyer: BuyerAccount | null;
  switchAccount: (id: string) => void;
  createArtisan: (data: Parameters<typeof createArtisanAccount>[0]) => ArtisanAccount;
  createBuyer: (data: Parameters<typeof createBuyerAccount>[0]) => BuyerAccount;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => { remainingAccounts: Account[]; newActiveId: string | null };
  logout: () => void;
  refreshAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    return initializeAccountsIfNeeded();
  });
  const [activeAccount, setActiveAccountState] = useState<Account | null>(() => {
    return getActiveAccount();
  });

  const refreshAccounts = useCallback(() => {
    const list = getAccounts();
    const active = getActiveAccount();
    setAccounts(list);
    setActiveAccountState(active);
  }, []);

  useEffect(() => {
    refreshAccounts();

    const handleAccountChange = () => {
      refreshAccounts();
    };

    window.addEventListener('joharcraft:account-changed', handleAccountChange);
    window.addEventListener('storage', handleAccountChange);

    return () => {
      window.removeEventListener('joharcraft:account-changed', handleAccountChange);
      window.removeEventListener('storage', handleAccountChange);
    };
  }, [refreshAccounts]);

  const switchAccount = useCallback((id: string) => {
    serviceSwitchAccount(id);
    refreshAccounts();
  }, [refreshAccounts]);

  const createArtisan = useCallback(
    (data: Parameters<typeof createArtisanAccount>[0]) => {
      const created = createArtisanAccount(data);
      refreshAccounts();
      return created;
    },
    [refreshAccounts]
  );

  const createBuyer = useCallback(
    (data: Parameters<typeof createBuyerAccount>[0]) => {
      const created = createBuyerAccount(data);
      refreshAccounts();
      return created;
    },
    [refreshAccounts]
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<Account>) => {
      serviceUpdateAccount(id, updates);
      refreshAccounts();
    },
    [refreshAccounts]
  );

  const deleteAccount = useCallback(
    (id: string) => {
      const result = serviceDeleteAccount(id);
      refreshAccounts();
      return result;
    },
    [refreshAccounts]
  );

  const logout = useCallback(() => {
    serviceSetActiveAccount(null);
    refreshAccounts();
  }, [refreshAccounts]);

  const isArtisan = activeAccount?.type === 'artisan';
  const isBuyer = activeAccount?.type === 'buyer';
  const activeArtisan = isArtisan ? (activeAccount as ArtisanAccount) : null;
  const activeBuyer = isBuyer ? (activeAccount as BuyerAccount) : null;

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        isArtisan,
        isBuyer,
        activeArtisan,
        activeBuyer,
        switchAccount,
        createArtisan,
        createBuyer,
        updateAccount,
        deleteAccount,
        logout,
        refreshAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
