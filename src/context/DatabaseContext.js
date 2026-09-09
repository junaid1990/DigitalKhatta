import React, {createContext, useContext, useEffect, useRef} from 'react';
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DatabaseContext = createContext(null);

export const DatabaseProvider = ({children}) => {
  const dbRef = useRef(null);

  useEffect(() => {
    initDB();
    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  const getDB = async () => {
    if (!dbRef.current) {
      dbRef.current = await SQLite.openDatabase({
        name: 'digitalkhatta.db',
        location: 'default',
      });
      await createTables();
    }
    return dbRef.current;
  };

  const initDB = async () => {
    try {
      await getDB();
    } catch (e) {
      console.error('DB init error:', e);
    }
  };

  const createTables = async () => {
    const db = dbRef.current;
    // Enable foreign key support so CASCADE deletes work
    await db.executeSql('PRAGMA foreign_keys = ON');
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        type TEXT DEFAULT 'customer',
        created_at INTEGER DEFAULT (strftime('%s','now'))
      )
    `);
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('gave','took')),
        amount REAL NOT NULL,
        note TEXT,
        date INTEGER,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
  };

  const getContacts = async (type = null) => {
    const db = await getDB();
    let query = `
      SELECT
        c.id, c.name, c.phone, c.type, c.created_at,
        COALESCE(
          SUM(CASE WHEN t.type='took' THEN t.amount ELSE 0 END) -
          SUM(CASE WHEN t.type='gave' THEN t.amount ELSE 0 END),
          0
        ) AS balance
      FROM contacts c
      LEFT JOIN transactions t ON t.contact_id = c.id
    `;
    const params = [];
    if (type) {
      query += ' WHERE c.type = ?';
      params.push(type);
    }
    query += ' GROUP BY c.id ORDER BY c.name ASC';
    const [results] = await db.executeSql(query, params);
    const rows = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  };

  const addContact = async (name, phone, type) => {
    const db = await getDB();
    const [result] = await db.executeSql(
      'INSERT INTO contacts (name, phone, type) VALUES (?, ?, ?)',
      [name.trim(), phone ? phone.trim() : null, type || 'customer'],
    );
    return result.insertId;
  };

  const updateContact = async (id, name, phone, type) => {
    const db = await getDB();
    await db.executeSql(
      'UPDATE contacts SET name = ?, phone = ?, type = ? WHERE id = ?',
      [name.trim(), phone ? phone.trim() : null, type || 'customer', id],
    );
  };

  const deleteContact = async id => {
    const db = await getDB();
    // Enable foreign keys and also manually delete transactions
    // to guarantee cleanup even if CASCADE is not enforced
    await db.executeSql('PRAGMA foreign_keys = ON');
    await db.executeSql('DELETE FROM transactions WHERE contact_id = ?', [id]);
    await db.executeSql('DELETE FROM contacts WHERE id = ?', [id]);
  };

  const getTransactions = async contactId => {
    const db = await getDB();
    const [results] = await db.executeSql(
      `SELECT * FROM transactions WHERE contact_id = ?
       ORDER BY COALESCE(date, created_at) DESC`,
      [contactId],
    );
    const rows = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  };

  const getAllTransactions = async () => {
    const db = await getDB();
    const [results] = await db.executeSql(`
      SELECT t.*, c.name AS contact_name, c.type AS contact_type
      FROM transactions t
      JOIN contacts c ON c.id = t.contact_id
      ORDER BY COALESCE(t.date, t.created_at) DESC
    `);
    const rows = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  };

  const addTransaction = async (contactId, type, amount, note, date) => {
    const db = await getDB();
    const dateVal = date
      ? Math.floor(new Date(date).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const [result] = await db.executeSql(
      'INSERT INTO transactions (contact_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?)',
      [contactId, type, parseFloat(amount), note ? note.trim() : null, dateVal],
    );
    return result.insertId;
  };

  const updateTransaction = async (id, amount, note, date) => {
    const db = await getDB();
    const dateVal = date
      ? Math.floor(new Date(date).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    await db.executeSql(
      'UPDATE transactions SET amount = ?, note = ?, date = ? WHERE id = ?',
      [parseFloat(amount), note ? note.trim() : null, dateVal, id],
    );
  };

  const deleteTransaction = async id => {
    const db = await getDB();
    await db.executeSql('DELETE FROM transactions WHERE id = ?', [id]);
  };

  const getContactBalance = async contactId => {
    const db = await getDB();
    const [results] = await db.executeSql(
      `SELECT
        COALESCE(
          SUM(CASE WHEN type='took' THEN amount ELSE 0 END) -
          SUM(CASE WHEN type='gave' THEN amount ELSE 0 END),
          0
        ) AS balance
       FROM transactions WHERE contact_id = ?`,
      [contactId],
    );
    if (results.rows.length > 0) {
      return results.rows.item(0).balance;
    }
    return 0;
  };

  const exportAllData = async () => {
    const db = await getDB();
    const [cResults] = await db.executeSql('SELECT * FROM contacts');
    const [tResults] = await db.executeSql('SELECT * FROM transactions');

    const contacts = [];
    for (let i = 0; i < cResults.rows.length; i++) {
      contacts.push(cResults.rows.item(i));
    }
    const transactions = [];
    for (let i = 0; i < tResults.rows.length; i++) {
      transactions.push(tResults.rows.item(i));
    }

    return JSON.stringify({
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      contacts,
      transactions,
    });
  };

  // FIX: No db.transaction() wrapper — use plain executeSql one by one
  const importAllData = async jsonString => {
    const db = await getDB();
    const data = JSON.parse(jsonString);

    if (!data.contacts || !data.transactions) {
      throw new Error('Invalid backup file format');
    }

    // Step 1: delete all existing data
    await db.executeSql('DELETE FROM transactions');
    await db.executeSql('DELETE FROM contacts');

    // Step 2: restore contacts one by one
    for (const c of data.contacts) {
      await db.executeSql(
        'INSERT INTO contacts (id, name, phone, type, created_at) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.name, c.phone || null, c.type || 'customer', c.created_at],
      );
    }

    // Step 3: restore transactions one by one
    for (const t of data.transactions) {
      await db.executeSql(
        'INSERT INTO transactions (id, contact_id, type, amount, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.contact_id, t.type, t.amount, t.note || null, t.date || null, t.created_at],
      );
    }
  };

  // CORRECT: per-contact balance first, then sum positives/negatives
  const getSummary = async () => {
    const db = await getDB();

    // First check if any transactions exist at all
    const [countResult] = await db.executeSql(
      'SELECT COUNT(*) as cnt FROM transactions'
    );
    const count = countResult.rows.item(0).cnt;

    // If no transactions, return zeros immediately
    if (count === 0) {
      return {totalToReceive: 0, totalToPay: 0};
    }

    // Per-contact balance: positive = they owe you, negative = you owe them
    const [results] = await db.executeSql(`
      SELECT
        COALESCE(SUM(CASE WHEN bal > 0 THEN bal ELSE 0 END), 0) AS totalToReceive,
        COALESCE(SUM(CASE WHEN bal < 0 THEN ABS(bal) ELSE 0 END), 0) AS totalToPay
      FROM (
        SELECT
          contact_id,
          SUM(CASE WHEN type='took' THEN amount ELSE 0 END) -
          SUM(CASE WHEN type='gave' THEN amount ELSE 0 END) AS bal
        FROM transactions
        GROUP BY contact_id
      ) AS cb
    `);

    if (results.rows.length === 0) {
      return {totalToReceive: 0, totalToPay: 0};
    }

    const row = results.rows.item(0);
    return {
      totalToReceive: Number(row.totalToReceive) || 0,
      totalToPay: Number(row.totalToPay) || 0,
    };
  };

  return (
    <DatabaseContext.Provider
      value={{
        getContacts,
        addContact,
        updateContact,
        deleteContact,
        getTransactions,
        getAllTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getContactBalance,
        exportAllData,
        importAllData,
        getSummary,
      }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used inside DatabaseProvider');
  }
  return ctx;
};
