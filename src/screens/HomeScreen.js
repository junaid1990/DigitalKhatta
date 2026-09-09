import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Colors from '../utils/colors';
import {formatAmount} from '../utils/format';
import {useDatabase} from '../context/DatabaseContext';
import {useSettings} from '../context/SettingsContext';

const TABS = [
  {key: 'all', label: 'All'},
  {key: 'customer', label: 'Customers'},
  {key: 'supplier', label: 'Suppliers'},
];

const AVATAR_COLORS = [
  '#6C63FF','#FF6B6B','#2ECC71','#F39C12',
  '#3498DB','#9B59B6','#1ABC9C','#E74C3C',
];

const getAvatarColor = name => {
  if (!name) {return AVATAR_COLORS[0];}
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};

const HomeScreen = ({navigation}) => {
  const db = useDatabase();
  const {formatMoney} = useSettings();
  const [contacts, setContacts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({totalToReceive: 0, totalToPay: 0});

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.headerBtnText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Backup')}>
            <Text style={styles.headerBtnText}>💾</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Help')}>
            <Text style={styles.headerBtnText}>❓</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const loadData = useCallback(async () => {
    try {
      const type = activeTab === 'all' ? null : activeTab;
      // Small delay ensures DB writes are fully committed before reading
      await new Promise(resolve => setTimeout(resolve, 100));
      const [data, sum] = await Promise.all([
        db.getContacts(type),
        db.getSummary(),
      ]);
      setContacts(data);
      // Always reset to 0 first then set new value to force UI update
      setSummary({totalToReceive: 0, totalToPay: 0});
      setSummary(sum);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, db]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFiltered(contacts);
    } else {
      setFiltered(
        contacts.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)),
        ),
      );
    }
  }, [search, contacts]);

  const handleDelete = contact => {
    Alert.alert(
      'Delete Contact',
      `Delete "${contact.name}" and all their transactions?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await db.deleteContact(contact.id);
            await loadData();
          },
        },
      ],
    );
  };

  const toReceive = Number(summary.totalToReceive) || 0;
  const toPay = Number(summary.totalToPay) || 0;

  const renderContact = ({item}) => {
    const balance = item.balance;
    let balanceText = 'Settled';
    let balanceColor = Colors.muted;
    let balanceBg = 'transparent';
    if (balance > 0) {
      balanceText = formatMoney(balance);
      balanceColor = Colors.green;
      balanceBg = '#0F2D1F';
    } else if (balance < 0) {
      balanceText = formatMoney(Math.abs(balance));
      balanceColor = Colors.red;
      balanceBg = '#3D1515';
    }

    return (
      <TouchableOpacity
        style={styles.contactCard}
        onPress={() =>
          navigation.navigate('ContactDetail', {id: item.id, name: item.name})
        }
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}>
        <View style={[styles.avatar, {backgroundColor: getAvatarColor(item.name)}]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <View style={styles.typeRow}>
            <Text style={styles.contactType}>
              {item.type === 'customer' ? '👤 Customer' : '🏪 Supplier'}
            </Text>
            {item.phone ? (
              <Text style={styles.contactPhone}>  •  {item.phone}</Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.balanceBadge, {backgroundColor: balanceBg}]}>
          <Text style={[styles.balanceText, {color: balanceColor}]}>
            {balance > 0 ? '+' : balance < 0 ? '-' : ''}{balanceText}
          </Text>
          {balance !== 0 && (
            <Text style={[styles.balanceSubText, {color: balanceColor}]}>
              {balance > 0 ? 'Take (Lena Hai)' : 'Give (Dena Hai)'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryGreen]}>
          <Text style={styles.summaryIcon}>💰</Text>
          <Text style={styles.summaryLabel}>Take (Lena Hai)</Text>
          <Text style={styles.summarySubLabel}>To Receive</Text>
          <Text style={[styles.summaryAmount, {color: Colors.green}]}>
            {formatMoney(toReceive)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryRed]}>
          <Text style={styles.summaryIcon}>💸</Text>
          <Text style={styles.summaryLabel}>Give (Dena Hai)</Text>
          <Text style={styles.summarySubLabel}>To Pay</Text>
          <Text style={[styles.summaryAmount, {color: Colors.red}]}>
            {formatMoney(toPay)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.muted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {!loading && (
        <Text style={styles.countText}>
          {filtered.length} {filtered.length === 1 ? 'contact' : 'contacts'}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator color={Colors.accent} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderContact}
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {setRefreshing(true); loadData();}}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>
                {search ? 'No contacts found' : 'No contacts yet'}
              </Text>
              <Text style={styles.emptyHint}>
                {search ? 'Try a different search' : 'Tap + to add your first contact'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddContact')}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.bg},
  headerButtons: {flexDirection: 'row', gap: 2},
  headerBtn: {padding: 6, marginLeft: 2},
  headerBtnText: {fontSize: 18},
  summaryRow: {flexDirection: 'row', margin: 14, gap: 10},
  summaryCard: {flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'center'},
  summaryGreen: {backgroundColor: '#0A1F14', borderColor: Colors.green + '40'},
  summaryRed: {backgroundColor: '#1F0A0A', borderColor: Colors.red + '40'},
  summaryIcon: {fontSize: 22, marginBottom: 4},
  summaryLabel: {color: Colors.text, fontSize: 12, fontWeight: '700', marginBottom: 1, textAlign: 'center'},
  summarySubLabel: {color: Colors.muted, fontSize: 10, marginBottom: 6},
  summaryAmount: {fontSize: 15, fontWeight: '800', textAlign: 'center'},
  tabs: {
    flexDirection: 'row', marginHorizontal: 14,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 4, marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  tab: {flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9},
  tabActive: {backgroundColor: Colors.accent},
  tabText: {color: Colors.muted, fontSize: 13, fontWeight: '600'},
  tabTextActive: {color: '#FFFFFF'},
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
  },
  searchIcon: {fontSize: 15, marginRight: 8},
  searchInput: {flex: 1, paddingVertical: 11, color: Colors.text, fontSize: 15},
  clearBtn: {padding: 4},
  clearText: {color: Colors.muted, fontSize: 14},
  countText: {color: Colors.muted, fontSize: 12, marginHorizontal: 16, marginBottom: 6},
  listContent: {paddingHorizontal: 14, paddingBottom: 90},
  emptyContainer: {flex: 1, paddingHorizontal: 14},
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  avatarText: {color: '#FFFFFF', fontWeight: '800', fontSize: 19},
  contactInfo: {flex: 1},
  contactName: {color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 3},
  typeRow: {flexDirection: 'row', alignItems: 'center'},
  contactType: {color: Colors.muted, fontSize: 12},
  contactPhone: {color: Colors.muted, fontSize: 12},
  balanceBadge: {borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'flex-end', minWidth: 90},
  balanceText: {fontSize: 12, fontWeight: '700'},
  balanceSubText: {fontSize: 9, marginTop: 1, opacity: 0.9},
  emptyState: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyIcon: {fontSize: 52, marginBottom: 14},
  emptyText: {color: Colors.muted, fontSize: 17, fontWeight: '600', marginBottom: 6},
  emptyHint: {color: Colors.muted, fontSize: 13, opacity: 0.7},
  loader: {flex: 1, marginTop: 60},
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: Colors.accent,
    shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 10,
  },
  fabText: {color: '#FFFFFF', fontSize: 30, fontWeight: '300', lineHeight: 34},
});

export default HomeScreen;
