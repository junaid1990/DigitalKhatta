import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Colors from '../utils/colors';
import {useDatabase} from '../context/DatabaseContext';

const getTodayString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const AddTransactionScreen = ({route, navigation}) => {
  const {contactId, contactName, type} = route.params;
  const db = useDatabase();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saving, setSaving] = useState(false);

  const noteRef = useRef(null);
  const dateRef = useRef(null);

  const isGave = type === 'gave';
  const accentColor = isGave ? Colors.red : Colors.green;
  const bannerBg = isGave ? '#3D1515' : '#0F2D1F';
  const bannerText = isGave
    ? `You gave to ${contactName}`
    : `You received from ${contactName}`;

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid Date', 'Date must be in YYYY-MM-DD format');
      return;
    }
    setSaving(true);
    try {
      await db.addTransaction(contactId, type, numAmount, note, date || getTodayString());
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save transaction: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Banner */}
        <View style={[styles.banner, {backgroundColor: bannerBg, borderColor: accentColor}]}>
          <Text style={[styles.bannerText, {color: accentColor}]}>
            {bannerText}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.amountWrapper}>
          <Text style={[styles.currencyLabel, {color: accentColor}]}>Rs.</Text>
          <TextInput
            style={[styles.amountInput, {color: accentColor}]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.border}
            returnKeyType="next"
            onSubmitEditing={() => noteRef.current?.focus()}
            autoFocus
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, {backgroundColor: accentColor + '40'}]} />

        {/* Note Input */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <TextInput
            ref={noteRef}
            style={styles.fieldInput}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Rent, Goods, Loan..."
            placeholderTextColor={Colors.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="next"
            onSubmitEditing={() => dateRef.current?.focus()}
          />
        </View>

        {/* Date Input */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            ref={dateRef}
            style={styles.fieldInput}
            value={date}
            onChangeText={setDate}
            placeholder="2024-01-15"
            placeholderTextColor={Colors.muted}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, {backgroundColor: accentColor}, saving && styles.savingBtn]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isGave ? '💸 Save — Diya' : '💰 Save — Liya'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  scroll: {padding: 16, paddingBottom: 40},
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currencyLabel: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 20,
    marginHorizontal: 16,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  savingBtn: {opacity: 0.7},
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default AddTransactionScreen;
