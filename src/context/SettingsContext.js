import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext(null);

export const CURRENCIES = [
  {code: 'PKR', symbol: 'Rs.', label: 'PKR — Pakistani Rupee'},
  {code: 'INR', symbol: '₹',  label: 'INR — Indian Rupee'},
  {code: 'USD', symbol: '$',  label: 'USD — US Dollar'},
  {code: 'RMB', symbol: '¥',  label: 'RMB — Chinese Yuan'},
  {code: 'AED', symbol: 'AED',label: 'AED — UAE Dirham'},
  {code: 'GBP', symbol: '£',  label: 'GBP — British Pound'},
  {code: 'NONE', symbol: '',  label: 'None — No currency'},
];

export const DatabaseProvider = ({children}) => children;

export const SettingsProvider = ({children}) => {
  const [currencyCode, setCurrencyCode] = useState('PKR');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('currency_code');
      if (saved !== null) {
        setCurrencyCode(saved);
      }
    } catch (e) {
      console.error('Settings load error:', e);
    } finally {
      setLoaded(true);
    }
  };

  const setCurrency = async code => {
    setCurrencyCode(code);
    try {
      await AsyncStorage.setItem('currency_code', code);
    } catch (e) {
      console.error('Settings save error:', e);
    }
  };

  const getCurrencySymbol = () => {
    const found = CURRENCIES.find(c => c.code === currencyCode);
    return found ? found.symbol : '';
  };

  // Format amount with currency symbol
  const formatMoney = amount => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    const num = Number(amount);
    const formatted = Number.isInteger(num)
      ? num.toLocaleString('en-US')
      : num.toFixed(2);
    const symbol = getCurrencySymbol();
    if (!symbol) {
      return formatted;
    }
    // Symbols that go before the number
    const prefix = ['$', '£', '₹', '¥'];
    if (prefix.includes(symbol)) {
      return `${symbol}${formatted}`;
    }
    // Symbols that go after with space (Rs., AED)
    return `${symbol} ${formatted}`;
  };

  return (
    <SettingsContext.Provider
      value={{currencyCode, setCurrency, formatMoney, getCurrencySymbol, loaded, CURRENCIES}}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return ctx;
};
