import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Colors from '../utils/colors';

const TOPICS = [
  {
    title: '📒 What is Digital Khatta?',
    body: 'Digital Khatta is a personal ledger app for Pakistani small businesses. It lets you track money given to and received from your customers and suppliers — all offline, stored on your phone. No internet needed, no account required.',
  },
  {
    title: '👤 Customers vs 🏪 Suppliers',
    body: 'Customers are people who buy from you. Suppliers are people or businesses you buy from. You can track both separately using the tabs on the home screen.',
  },
  {
    title: '➕ How to Add a Contact',
    body: 'Tap the + button on the home screen. Choose whether they are a Customer or Supplier. Enter their name (required) and phone number (optional). Tap "Add Contact" and their Khatta opens automatically.',
  },
  {
    title: '💸 Diya (Gave) — You gave money or goods',
    body: 'Tap "↑ Diya (Gave)" on a contact\'s page when you gave money or delivered goods to them. This means they now owe YOU. The amount is shown in red with a minus sign.',
  },
  {
    title: '💰 Liya (Took) — You received money or goods',
    body: 'Tap "↓ Liya (Took)" on a contact\'s page when you received money or goods from them. This reduces what they owe you (or increases what you owe them).',
  },
  {
    title: '📊 Understanding the Balance',
    body: 'GREEN balance means "Lena Hai" — they owe you money. RED balance means "Dena Hai" — you owe them money. "—" means you are even (Barabar). The home screen shows your total Lena Hai and Dena Hai at the top.',
  },
  {
    title: '📄 Export PDF for a Contact',
    body: 'Open any contact\'s Khatta and tap "📄 Export PDF". This will open a print/share dialog with a PDF showing all transactions and the current balance for that contact.',
  },
  {
    title: '💾 How to Backup',
    body: 'Go to Backup & Restore from the 💾 icon on the home screen. Tap "📤 Export Backup File". Choose WhatsApp, Gmail, Google Drive, or any app to save your backup. The backup is a .json file with all your data.',
  },
  {
    title: '📂 How to Restore',
    body: 'Go to Backup & Restore and tap "📂 Choose Backup File". Select the .json backup file from your phone storage. IMPORTANT: This will erase all current data and replace it with the backup. Always export a new backup before restoring.',
  },
  {
    title: '🔒 Is My Data Safe?',
    body: 'Yes. All data is stored only on your phone — there is no cloud, no server, and no account. No one else can see your data. If you uninstall the app, your data will be lost unless you created a backup first.',
  },
  {
    title: '💡 Tips',
    body: '• Long press any contact or transaction to delete it.\n• Use the search bar to find contacts by name or phone.\n• Add a note to every transaction for easy tracking.\n• Take a backup weekly using WhatsApp or Google Drive.\n• Pull down on the contact list to refresh balances.',
  },
];

const HelpCard = ({title, body}) => {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setOpen(!open)}
      activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </View>
      {open && <Text style={styles.cardBody}>{body}</Text>}
    </TouchableOpacity>
  );
};

const HelpScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>
        Tap any topic to read more.
      </Text>

      {TOPICS.map((topic, i) => (
        <HelpCard key={i} title={topic.title} body={topic.body} />
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Digital Khatta v1.2 — Made with ❤️ for small businesses
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  scroll: {padding: 14, paddingBottom: 40},
  intro: {
    color: Colors.muted,
    fontSize: 14,
    marginBottom: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  chevron: {
    color: Colors.muted,
    fontSize: 22,
    fontWeight: '300',
    transform: [{rotate: '0deg'}],
  },
  chevronOpen: {
    transform: [{rotate: '90deg'}],
  },
  cardBody: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default HelpScreen;
