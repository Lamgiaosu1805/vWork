import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';
import { getPermissions } from '../../helpers/permissions';
import branchApi from '../../api/branchApi';
import { Menu, Plus } from 'lucide-react-native';

export default function BranchScreen() {
  const user = useSelector(s => s.auth.user);
  const perms = getPermissions(user);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ branch_name: '', branch_code: '' });

  const fetchBranches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await branchApi.getAll();
      setBranches(res.data?.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải danh sách chi nhánh' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBranches(true);
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ branch_name: '', branch_code: '' });
    setModalVisible(true);
  };

  const openEdit = branch => {
    setEditTarget(branch);
    setForm({ branch_name: branch.branch_name, branch_code: branch.branch_code ?? '' });
    setModalVisible(true);
  };

  const confirmDelete = branch => {
    Alert.alert(
      'Xoá chi nhánh',
      `Bạn có chắc muốn xoá chi nhánh "${branch.branch_name}"?\nCác phòng ban thuộc chi nhánh này sẽ bị ảnh hưởng.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await branchApi.delete(branch._id);
              Toast.show({ type: 'success', text1: 'Xoá chi nhánh thành công' });
              fetchBranches(true);
            } catch (e) {
              Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Xoá thất bại' });
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!form.branch_name.trim())
      return Toast.show({ type: 'error', text1: 'Vui lòng nhập tên chi nhánh' });
    if (!editTarget && !form.branch_code.trim())
      return Toast.show({ type: 'error', text1: 'Vui lòng nhập mã chi nhánh' });

    setSaving(true);
    try {
      if (editTarget) {
        await branchApi.update(editTarget._id, { branch_name: form.branch_name });
        Toast.show({ type: 'success', text1: 'Cập nhật chi nhánh thành công' });
      } else {
        await branchApi.create({
          branch_name: form.branch_name,
          branch_code: form.branch_code,
        });
        Toast.show({ type: 'success', text1: 'Thêm chi nhánh thành công' });
      }
      setModalVisible(false);
      fetchBranches(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name="business" size={20} color="#ED2E30" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.branchName} numberOfLines={1}>{item.branch_name}</Text>
          {item.branch_code ? (
            <View style={styles.codeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{item.branch_code}</Text>
              </View>
              {item.is_active === false && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Tạm dừng</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </View>
      {perms.showHrmMgmt && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil" size={14} color="#ED2E30" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash" size={14} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Chi nhánh"
        LeftIcon={Menu}
        onLeftPress={openDrawer}
        {...(perms.showHrmMgmt ? { RightIcon: Plus, onRightPress: openAdd } : {})}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ED2E30" />
        </View>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2E30" />}
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 60 }]}>
              <Ionicons name="business-outline" size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Chưa có chi nhánh nào</Text>
              {perms.showHrmMgmt && (
                <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.emptyAddText}>Thêm chi nhánh</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* ── Modal thêm / sửa ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlayInner}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editTarget ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Mã chi nhánh — chỉ khi tạo mới */}
              {!editTarget && (
                <>
                  <Text style={styles.fieldLabel}>Mã chi nhánh *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.branch_code}
                    onChangeText={v => setForm(prev => ({ ...prev, branch_code: v.toUpperCase() }))}
                    placeholder="VD: HN01"
                    autoCapitalize="characters"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Tên chi nhánh *</Text>
                </>
              )}
              {!!editTarget && <Text style={styles.fieldLabel}>Tên chi nhánh *</Text>}
              <TextInput
                style={[styles.input, !editTarget && { marginTop: 0 }]}
                value={form.branch_name}
                onChangeText={v => setForm(prev => ({ ...prev, branch_name: v }))}
                placeholder="Nhập tên chi nhánh"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnCancelText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.btnSaveText}>{editTarget ? 'Cập nhật' : 'Thêm mới'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { padding: 12, paddingBottom: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ED2E30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyAddText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  branchName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  codeBadge: { backgroundColor: '#FEE2E2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  codeText: { fontSize: 10, fontWeight: '800', color: '#ED2E30', fontFamily: 'monospace' },
  inactiveBadge: { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  inactiveBadgeText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  cardActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { backgroundColor: '#FEE2E2' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  overlayInner: { justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  btnSave: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ED2E30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
