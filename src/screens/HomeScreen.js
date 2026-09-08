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

const TABS = [
  {key: 'all', label: '📒 All'},
  {key: 'customer', label: '👤 Customer'},
  {key: 'supplier', label: '🏪 Supplier'},
];

const AVATAR_COLORS = [
  '#6C63FF', '#FF6B6B', '#2ECC71', '#F39C12',
  '#3498DB', '#9B59B6', '#1ABC9C', '#E74C3C',
];

const getAvatarColor = name => {
  if (!name) {return AVATAR_COLORS[0];}
  const code = name.charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const HomeScreen = ({navigation}) => {
  const db = useDatabase();
  const [contacts, setContacts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({totalTook: 0, totalGave: 0});

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
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
      const [data, sum] = await Promise.all([
        db.getContacts(type),
        db.getSummary(),
      ]);
      setContacts(data);
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
            loadData();
          },
        },
      ],
    );
  };

  const lenaHai = Math.max(0, summary.totalTook - summary.totalGave);
  const denaHai = Math.max(0, summary.totalGave - summary.totalTook);

  const renderContact = ({item}) => {
    const balance = item.balance;
    let balanceText = '—';
    let balanceColor = Colors.muted;
    if (balance > 0) {
      balanceText = `+Rs. ${formatAmount(balance)} lena hai`;
      balanceColor = Colors.green;
    } else if (balance < 0) {
      balanceText = `-Rs. ${formatAmount(Math.abs(balance))} dena hai`;
      balanceColor = Colors.red;
    }

    return (
      <TouchableOpacity
        style={styles.contactCard}
        onPress={() =>
          navigation.navigate('ContactDetail', {
            id: item.id,
            name: item.name,
          })
        }
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}>
        <View
          style={[
            styles.avatar,
            {backgroundColor: getAvatarColor(item.name)},
          ]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactType}>
            {item.type === 'customer' ? '👤 Customer' : '🏪 Supplier'}
          </Text>
        </View>
        <Text style={[styles.balance, {color: balanceColor}]}>
          {balanceText}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Lena Hai</Text>
          <Text style={[styles.summaryAmount, {color: Colors.green}]}>
            Rs. {formatAmount(lenaHai)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Dena Hai</Text>
          <Text style={[styles.summaryAmount, {color: Colors.red}]}>
            Rs. {formatAmount(denaHai)}
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
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or phone..."
          placeholderTextColor={Colors.muted}
        />
      </View>

      {/* Contact List */}
      {loading ? (
        <ActivityIndicator
          color={Colors.accent}
          size="large"
          style={styles.loader}
        />
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
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
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
                Tap + to add your first contact
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
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
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    padding: 6,
    marginLeft: 4,
  },
  headerBtnText: {
    fontSize: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: Colors.muted,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchWrapper: {
    marginHorizontal: 14,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 14,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactType: {
    color: Colors.muted,
    fontSize: 12,
  },
  balance: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: 130,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyHint: {
    color: Colors.muted,
    fontSize: 13,
    opacity: 0.7,
  },
  loader: {
    flex: 1,
    marginTop: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});

export default HomeScreen;
