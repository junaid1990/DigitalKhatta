import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import RNPrint from 'react-native-print';
import Colors from '../utils/colors';
import {formatAmount, formatDate} from '../utils/format';
import {useDatabase} from '../context/DatabaseContext';

const BackupScreen = () => {
  const db = useDatabase();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const setMsg = msg => setStatus(msg);

  const handleExport = async () => {
    setLoading(true);
    setMsg('Preparing backup...');
    try {
      const json = await db.exportAllData();
      const filename = `digital-khatta-backup-${Date.now()}.json`;
      const path = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.writeFile(path, json, 'utf8');

      await Share.open({
        url: `file://${path}`,
        type: 'application/json',
        filename,
        title: 'Export Digital Khatta Backup',
      });
      setMsg('✅ Backup exported successfully');
    } catch (e) {
      if (e.message !== 'User did not share') {
        Alert.alert('Export Failed', e.message);
        setMsg('❌ Export failed');
      } else {
        setMsg('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      '⚠️ Restore Backup',
      'This will DELETE all current data and replace it with the backup. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes, Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setMsg('Picking file...');
            try {
              const result = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.allFiles],
              });
              setMsg('Reading backup...');
              const content = await RNFS.readFile(result.uri, 'utf8');
              setMsg('Restoring data...');
              await db.importAllData(content);
              setMsg('✅ Restore complete!');
              Alert.alert('Success', 'Data restored from backup');
            } catch (e) {
              if (DocumentPicker.isCancel(e)) {
                setMsg('');
              } else {
                Alert.alert('Restore Failed', e.message);
                setMsg('❌ Restore failed');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleFullPDF = async () => {
    setLoading(true);
    setMsg('Generating PDF report...');
    try {
      const [contacts, transactions, summary] = await Promise.all([
        db.getContacts(),
        db.getAllTransactions(),
        db.getSummary(),
      ]);

      const lena = Math.max(0, summary.totalTook - summary.totalGave);
      const dena = Math.max(0, summary.totalGave - summary.totalTook);

      const contactRows = contacts
        .map(c => {
          const bal = c.balance;
          const statusLabel =
            bal > 0 ? 'Lena Hai' : bal < 0 ? 'Dena Hai' : 'Barabar';
          const balClass = bal > 0 ? 'positive' : bal < 0 ? 'negative' : '';
          return `<tr>
            <td>${c.name}</td>
            <td>${c.type === 'customer' ? 'Customer' : 'Supplier'}</td>
            <td>${c.phone || '—'}</td>
            <td class="${balClass}">Rs. ${formatAmount(Math.abs(bal))}</td>
            <td class="${balClass}">${statusLabel}</td>
          </tr>`;
        })
        .join('');

      const txnRows = transactions
        .slice(0, 100)
        .map(t => {
          const isGave = t.type === 'gave';
          return `<tr>
            <td>${formatDate(t.date || t.created_at)}</td>
            <td>${t.contact_name}</td>
            <td class="${isGave ? 'negative' : 'positive'}">${isGave ? 'Gave' : 'Took'}</td>
            <td>${t.note || '—'}</td>
            <td class="${isGave ? 'negative' : 'positive'}">Rs. ${formatAmount(t.amount)}</td>
          </tr>`;
        })
        .join('');

      const dateStr = new Date().toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const html = `
<html>
<head><style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 13px; }
  h1 { color: #6C63FF; }
  h2 { color: #444; border-bottom: 2px solid #6C63FF; padding-bottom: 6px; margin-top: 30px; }
  .summary { display: flex; gap: 20px; margin: 16px 0; }
  .summary-box { padding: 12px 20px; border-radius: 8px; text-align: center; flex: 1; }
  .summary-box .label { font-size: 12px; color: #666; }
  .summary-box .val { font-size: 20px; font-weight: bold; margin-top: 4px; }
  .green-box { background: #e8fdf0; }
  .red-box { background: #fdeaea; }
  .grey-box { background: #f0f0f0; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  th { background: #6C63FF; color: white; padding: 8px 6px; text-align: left; }
  td { padding: 6px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f9f9f9; }
  .positive { color: #2ecc71; font-weight: 600; }
  .negative { color: #e74c3c; font-weight: 600; }
  footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
</style></head>
<body>
  <h1>📒 Digital Khatta — Full Report</h1>
  <p>Generated: ${dateStr}</p>

  <div class="summary">
    <div class="summary-box green-box">
      <div class="label">Total Lena Hai</div>
      <div class="val" style="color:#2ecc71">Rs. ${formatAmount(lena)}</div>
    </div>
    <div class="summary-box red-box">
      <div class="label">Total Dena Hai</div>
      <div class="val" style="color:#e74c3c">Rs. ${formatAmount(dena)}</div>
    </div>
    <div class="summary-box grey-box">
      <div class="label">Total Contacts</div>
      <div class="val">${contacts.length}</div>
    </div>
  </div>

  <h2>All Contacts</h2>
  <table>
    <tr><th>Name</th><th>Type</th><th>Phone</th><th>Balance</th><th>Status</th></tr>
    ${contactRows || '<tr><td colspan="5" style="text-align:center">No contacts</td></tr>'}
  </table>

  <h2>Last 100 Transactions</h2>
  <table>
    <tr><th>Date</th><th>Contact</th><th>Type</th><th>Note</th><th>Amount</th></tr>
    ${txnRows || '<tr><td colspan="5" style="text-align:center">No transactions</td></tr>'}
  </table>

  <footer>Digital Khatta v1.2 — Made with ❤️ for small businesses</footer>
</body>
</html>`;

      await RNPrint.print({html});
      setMsg('✅ PDF report generated');
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF: ' + e.message);
      setMsg('❌ Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const SectionCard = ({title, description, buttonLabel, buttonColor, onPress}) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{description}</Text>
      <TouchableOpacity
        style={[styles.cardButton, {backgroundColor: buttonColor}, loading && styles.disabledBtn]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.85}>
        <Text style={styles.cardButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {loading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
      {!loading && status !== '' && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <SectionCard
        title="📤 Backup Data"
        description="Export all your contacts and transactions as a JSON file. Share it via WhatsApp, email, or save to your phone."
        buttonLabel="📤 Export Backup File"
        buttonColor="#1565C0"
        onPress={handleExport}
      />

      <SectionCard
        title="📂 Restore Data"
        description="Restore from a previously exported backup file. WARNING: This will delete all current data before restoring."
        buttonLabel="📂 Choose Backup File"
        buttonColor="#E65100"
        onPress={handleRestore}
      />

      <SectionCard
        title="📊 Full PDF Report"
        description="Generate a complete PDF report with summary, all contacts, and last 100 transactions. Share or print it."
        buttonLabel="📊 Generate PDF Report"
        buttonColor="#1B5E20"
        onPress={handleFullPDF}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  scroll: {padding: 14, paddingBottom: 40},
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBar: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDesc: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabledBtn: {opacity: 0.5},
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BackupScreen;
