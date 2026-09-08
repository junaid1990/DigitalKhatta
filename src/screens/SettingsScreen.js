import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Colors from '../utils/colors';
import {useSettings, CURRENCIES} from '../context/SettingsContext';

const SettingsScreen = () => {
  const {currencyCode, setCurrency, formatMoney} = useSettings();

  const handleSelect = currency => {
    Alert.alert(
      'Change Currency',
      `Switch to ${currency.label}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes, Change',
          onPress: () => setCurrency(currency.code),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Preview */}
      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Current format</Text>
        <Text style={styles.previewAmount}>{formatMoney(12500)}</Text>
        <Text style={styles.previewSub}>How amounts appear in the app</Text>
      </View>

      {/* Currency List */}
      <Text style={styles.sectionLabel}>Select Currency</Text>
      {CURRENCIES.map(currency => {
        const isSelected = currencyCode === currency.code;
        return (
          <TouchableOpacity
            key={currency.code}
            style={[styles.currencyRow, isSelected && styles.currencyRowActive]}
            onPress={() => handleSelect(currency)}
            activeOpacity={0.7}>
            <View style={[styles.symbolBadge, isSelected && styles.symbolBadgeActive]}>
              <Text style={[styles.symbolText, isSelected && styles.symbolTextActive]}>
                {currency.symbol || '—'}
              </Text>
            </View>
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyLabel, isSelected && styles.currencyLabelActive]}>
                {currency.label}
              </Text>
              <Text style={styles.currencyExample}>
                Example: {currency.symbol ? `${currency.symbol} 5,000` : '5,000'}
              </Text>
            </View>
            {isSelected && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          💡 This only changes how amounts are displayed. Your data is not affected.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  scroll: {padding: 14, paddingBottom: 40},

  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewAmount: {
    color: Colors.green,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewSub: {
    color: Colors.muted,
    fontSize: 12,
  },

  sectionLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  currencyRowActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  symbolBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symbolBadgeActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  symbolText: {
    color: Colors.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  symbolTextActive: {
    color: '#FFFFFF',
  },
  currencyInfo: {flex: 1},
  currencyLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyLabelActive: {
    color: Colors.accent,
  },
  currencyExample: {
    color: Colors.muted,
    fontSize: 12,
  },
  checkmark: {
    color: Colors.accent,
    fontSize: 20,
    fontWeight: '700',
  },

  note: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default SettingsScreen;
