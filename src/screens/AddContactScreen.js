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

const AddContactScreen = ({navigation}) => {
  const db = useDatabase();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('customer');
  const [saving, setSaving] = useState(false);

  const phoneRef = useRef(null);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a contact name');
      return;
    }
    setSaving(true);
    try {
      const newId = await db.addContact(name.trim(), phone.trim(), type);
      navigation.replace('ContactDetail', {id: newId, name: name.trim()});
    } catch (e) {
      Alert.alert('Error', 'Could not save contact: ' + e.message);
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        {/* Type Toggle */}
        <Text style={styles.sectionLabel}>Contact Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'customer' && styles.typeBtnActive]}
            onPress={() => setType('customer')}>
            <Text style={[styles.typeBtnText, type === 'customer' && styles.typeBtnTextActive]}>
              👤 Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'supplier' && styles.typeBtnActive]}
            onPress={() => setType('supplier')}>
            <Text style={[styles.typeBtnText, type === 'supplier' && styles.typeBtnTextActive]}>
              🏪 Supplier
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <Text style={styles.sectionLabel}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Contact name (required)"
          placeholderTextColor={Colors.muted}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />

        {/* Phone Input */}
        <Text style={styles.sectionLabel}>Phone (optional)</Text>
        <TextInput
          ref={phoneRef}
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 03001234567"
          placeholderTextColor={Colors.muted}
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.savingBtn]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Adding...' : 'Add Contact'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  scroll: {padding: 16, paddingBottom: 40},
  sectionLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  typeBtnText: {
    color: Colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: Colors.accent,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: Colors.accent,
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

export default AddContactScreen;
