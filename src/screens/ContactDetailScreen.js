import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import RNPrint from 'react-native-print';
import Colors from '../utils/colors';
import {formatAmount, formatDate} from '../utils/format';
import {useDatabase} from '../context/DatabaseContext';
import {useSettings} from '../context/SettingsContext';

const ContactDetailScreen = ({route, navigation}) => {
  const {id, name} = route.params;
  const db = useDatabase();
  const {formatMoney} = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [txns, bal] = await Promise.all([
        db.getTransactions(id),
        db.getContactBalance(id),
      ]);
      setTransactions(txns);
      setBalance(bal);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [id, db]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const handleDeleteTransaction = txn => {
    Alert.alert('Delete Transaction', 'Remove this transaction?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.deleteTransaction(txn.id);
          await loadData();
        },
      },
    ]);
  };

  const handleExportPDF = async () => {
    try {
      const rows = transactions
        .map(t => {
          const dateStr = formatDate(t.date || t.created_at);
          const note = t.note || '—';
          const amtClass = t.type === 'took' ? 'positive' : 'negative';
          const prefix = t.type === 'took' ? '+' : '-';
          return `<tr>
            <td>${dateStr}</td>
            <td>${note}</td>
            <td class="${amtClass}">${prefix}Rs. ${formatAmount(t.amount)}</td>
          </tr>`;
        })
        .join('');

      const balClass = balance >= 0 ? 'positive' : 'negative';
      const balLabel =
        balance > 0
          ? `${name} ko lena hai`
          : balance < 0
          ? 'Aapko dena hai'
          : 'Barabar hai';
      const balText = `${balLabel}: ${formatMoney(Math.abs(balance))}`;
      const dateStr = new Date().toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const html = `
<html>
  <head><style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #6C63FF; margin-bottom: 4px; }
    h2 { color: #333; margin-top: 0; }
    .meta { color: #666; font-size: 14px; margin-bottom: 16px; }
    .balance { font-size: 18px; font-weight: bold; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #6C63FF; color: white; padding: 10px 8px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    .positive { color: #2ecc71; font-weight: 600; }
    .negative { color: #e74c3c; font-weight: 600; }
    footer { margin-top: 24px; color: #999; font-size: 12px; text-align: center; }
  </style></head>
  <body>
    <h1>📒 Digital Khatta</h1>
    <h2>Khatta: ${name}</h2>
    <p class="meta">Generated: ${dateStr}</p>
    <p class="balance ${balClass}">${balText}</p>
    <table>
      <tr><th>Date</th><th>Note</th><th>Amount</th></tr>
      ${rows || '<tr><td colspan="3" style="text-align:center;color:#999">No transactions</td></tr>'}
    </table>
    <footer>Total ${transactions.length} transactions — Digital Khatta v1.2</footer>
  </body>
</html>`;

      await RNPrint.print({html});
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF: ' + e.message);
    }
  };

  const renderTransaction = ({item}) => {
    const isGave = item.type === 'gave';
    return (
      <TouchableOpacity
        style={styles.txnCard}
        onLongPress={() => handleDeleteTransaction(item)}
        activeOpacity={0.75}>
        <View style={[styles.txnIcon, {backgroundColor: isGave ? '#3D1515' : '#0F2D1F'}]}>
          <Text style={[styles.txnIconText, {color: isGave ? Colors.red : Colors.green}]}>
            {isGave ? '↑' : '↓'}
          </Text>
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnNote}>{item.note || '(no note)'}</Text>
          <Text style={styles.txnDate}>
            {formatDate(item.date || item.created_at)}
          </Text>
        </View>
        <Text style={[styles.txnAmount, {color: isGave ? Colors.red : Colors.green}]}>
          {isGave ? '-' : '+'}{formatMoney(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  let balanceLabel = 'Barabar hai';
  let balanceColor = Colors.muted;
  if (balance > 0) {
    balanceLabel = `${name} ko lena hai`;
    balanceColor = Colors.green;
  } else if (balance < 0) {
    balanceLabel = 'Aapko dena hai';
    balanceColor = Colors.red;
  }

  const ListHeader = (
    <>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{balanceLabel}</Text>
        <Text style={[styles.balanceAmount, {color: balanceColor}]}>
          {formatMoney(Math.abs(balance))}
        </Text>
        <TouchableOpacity style={styles.pdfButton} onPress={handleExportPDF}>
          <Text style={styles.pdfButtonText}>📄 Export PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, {backgroundColor: '#3D1515', borderColor: Colors.red}]}
          onPress={() =>
            navigation.navigate('AddTransaction', {
              contactId: id,
              contactName: name,
              type: 'gave',
            })
          }>
          <Text style={[styles.actionBtnText, {color: Colors.red}]}>
            ↑ Diya (Gave)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, {backgroundColor: '#0F2D1F', borderColor: Colors.green}]}
          onPress={() =>
            navigation.navigate('AddTransaction', {
              contactId: id,
              contactName: name,
              type: 'took',
            })
          }>
          <Text style={[styles.actionBtnText, {color: Colors.green}]}>
            ↓ Liya (Took)
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Transactions</Text>
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Koi entry nahi</Text>
            <Text style={styles.emptyHint}>Use buttons above to add</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {paddingHorizontal: 14, paddingBottom: 30},
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    color: Colors.muted,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 16,
  },
  pdfButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pdfButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  txnInfo: {flex: 1},
  txnNote: {color: Colors.text, fontSize: 14, fontWeight: '500'},
  txnDate: {color: Colors.muted, fontSize: 12, marginTop: 2},
  txnAmount: {fontSize: 15, fontWeight: '700'},
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {fontSize: 40, marginBottom: 10},
  emptyText: {color: Colors.muted, fontSize: 16, fontWeight: '600'},
  emptyHint: {color: Colors.muted, fontSize: 13, opacity: 0.7, marginTop: 4},
});

export default ContactDetailScreen;
