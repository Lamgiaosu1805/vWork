import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
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
import departmentApi from '../../api/departmentApi';
import branchApi from '../../api/branchApi';

// ── Inline select dropdown (tránh lỗi z-index khi Dropdown trong Modal) ──────
const InlineSelect = ({ label, value, options, onSelect, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <TouchableOpacity
        style={[styles.selectBtn, disabled && styles.selectBtnDisabled]}
        onPress={() => !disabled && setOpen(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectBtnText, !selected && styles.selectPlaceholder]} numberOfLines={1}>
          {selected ? selected.label : (placeholder ?? `Chọn ${label}`)}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </TouchableOpacity>
      {open && (
        <View style={styles.selectList}>
          <TouchableOpacity
            style={styles.selectItem}
            onPress={() => { onSelect(''); setOpen(false); }}
          >
            <Text style={styles.selectItemTextMuted}>-- Không chọn --</Text>
          </TouchableOpacity>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.selectItem, opt.value === value && styles.selectItemActive]}
              onPress={() => { onSelect(opt.value); setOpen(false); }}
            >
              <Text style={[styles.selectItemText, opt.value === value && styles.selectItemTextActive]}>
                {opt.label}
              </Text>
              {opt.value === value && <Ionicons name="checkmark" size={16} color="#ED2E30" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ── Hàng phòng ban ────────────────────────────────────────────────────────────
const DeptRow = ({ dept, indent, canManage, onEdit, onDelete }) => (
  <View style={[styles.deptRow, indent && styles.deptRowIndent]}>
    {indent && <View style={styles.indentLine} />}
    <View style={styles.deptInfo}>
      <View style={[styles.codeChip, indent && styles.codeChipChild]}>
        <Text style={[styles.codeText, indent && styles.codeTextChild]}>{dept.department_code}</Text>
      </View>
      <Text style={[styles.deptName, indent && styles.deptNameChild]} numberOfLines={2}>
        {dept.department_name}
      </Text>
      {!indent && (
        <View style={styles.rootBadge}>
          <Text style={styles.rootBadgeText}>Khối gốc</Text>
        </View>
      )}
    </View>
    {canManage && (
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(dept)}>
          <Ionicons name="pencil" size={13} color="#ED2E30" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => onDelete(dept)}>
          <Ionicons name="trash" size={13} color="#DC2626" />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// ── Màn hình chính ────────────────────────────────────────────────────────────
export default function DepartmentScreen() {
  const user = useSelector(s => s.auth.user);
  const perms = getPermissions(user);

  const [treeData, setTreeData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    department_name: '',
    department_code: '',
    branch_id: '',
    parent_id: '',
  });

  const fetchTree = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await departmentApi.getAll();
      setTreeData(res.data?.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải danh sách phòng ban' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await branchApi.getAll();
      setBranches(res.data?.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTree();
    fetchBranches();
  }, []);

  // Load các phòng ban gốc của chi nhánh khi đổi branch_id trong form
  useEffect(() => {
    if (!form.branch_id) {
      setParentOptions([]);
      return;
    }
    departmentApi
      .getAll({ flat: true, branch_id: form.branch_id })
      .then(res => {
        const all = res.data?.data ?? [];
        setParentOptions(all.filter(d => !d.parent));
      })
      .catch(() => {});
  }, [form.branch_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTree(true);
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ department_name: '', department_code: '', branch_id: '', parent_id: '' });
    setParentOptions([]);
    setModalVisible(true);
  };

  const openEdit = dept => {
    setEditTarget(dept);
    setForm({
      department_name: dept.department_name,
      department_code: dept.department_code ?? '',
      branch_id: dept.branch?._id ?? '',
      parent_id: dept.parent?._id ?? '',
    });
    setModalVisible(true);
  };

  const confirmDelete = dept => {
    Alert.alert(
      'Xoá phòng ban',
      `Bạn có chắc muốn xoá "${dept.department_name}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await departmentApi.delete(dept._id);
              Toast.show({ type: 'success', text1: 'Xoá phòng ban thành công' });
              fetchTree(true);
            } catch (e) {
              Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Xoá thất bại' });
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!form.branch_id)
      return Toast.show({ type: 'error', text1: 'Vui lòng chọn chi nhánh' });
    if (!form.department_name.trim())
      return Toast.show({ type: 'error', text1: 'Vui lòng nhập tên phòng ban' });
    if (!editTarget && !form.department_code.trim())
      return Toast.show({ type: 'error', text1: 'Vui lòng nhập mã phòng ban' });

    setSaving(true);
    try {
      if (editTarget) {
        await departmentApi.update(editTarget._id, {
          department_name: form.department_name,
          branch_id: form.branch_id,
          ...(form.parent_id ? { parent_id: form.parent_id } : { parent_id: null }),
        });
        Toast.show({ type: 'success', text1: 'Cập nhật phòng ban thành công' });
      } else {
        await departmentApi.create({
          department_name: form.department_name,
          department_code: form.department_code,
          branch_id: form.branch_id,
          ...(form.parent_id ? { parent_id: form.parent_id } : {}),
        });
        Toast.show({ type: 'success', text1: 'Thêm phòng ban thành công' });
      }
      setModalVisible(false);
      fetchTree(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = key =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const renderSection = (group, key, isUnassigned = false) => {
    const branchName = group.branch?.branch_name ?? 'Chưa phân chi nhánh';
    const branchCode = group.branch?.branch_code;
    const total = group.departments.reduce((n, d) => n + 1 + (d.children?.length ?? 0), 0);
    const isCollapsed = collapsed[key];

    return (
      <View key={key} style={[styles.section, isUnassigned && styles.sectionWarning]}>
        <TouchableOpacity
          style={[styles.sectionHeader, isUnassigned && styles.sectionHeaderWarning]}
          onPress={() => toggleSection(key)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isUnassigned ? 'warning' : 'business'}
            size={15}
            color={isUnassigned ? '#D97706' : '#ED2E30'}
          />
          <Text style={[styles.sectionTitle, isUnassigned && styles.sectionTitleWarning]} numberOfLines={1}>
            {branchName}
          </Text>
          {!isUnassigned && branchCode && (
            <View style={styles.branchCodeBadge}>
              <Text style={styles.branchCodeText}>{branchCode}</Text>
            </View>
          )}
          {isUnassigned && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>Cần gán chi nhánh</Text>
            </View>
          )}
          <View style={[styles.countBadge, isUnassigned && styles.countBadgeWarning]}>
            <Text style={styles.countText}>{total}</Text>
          </View>
          <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={15} color="#6B7280" />
        </TouchableOpacity>

        {!isCollapsed &&
          group.departments.map(dept => (
            <React.Fragment key={dept._id}>
              <DeptRow
                dept={dept}
                indent={false}
                canManage={perms.showHrmMgmt}
                onEdit={openEdit}
                onDelete={confirmDelete}
              />
              {(dept.children ?? []).map(child => (
                <DeptRow
                  key={child._id}
                  dept={child}
                  indent
                  canManage={perms.showHrmMgmt}
                  onEdit={openEdit}
                  onDelete={confirmDelete}
                />
              ))}
            </React.Fragment>
          ))}
      </View>
    );
  };

  const assigned = treeData.filter(g => g.branch);
  const unassigned = treeData.filter(g => !g.branch);

  const branchSelectOptions = branches.map(b => ({
    label: `${b.branch_name}${b.branch_code ? ` (${b.branch_code})` : ''}`,
    value: b._id,
  }));

  const parentSelectOptions = parentOptions.map(d => ({
    label: d.department_name,
    value: d._id,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Khối / Phòng ban"
        leftIconName="menu"
        onLeftPress={openDrawer}
        {...(perms.showHrmMgmt ? { rightIconName: 'add', onRightPress: openAdd } : {})}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ED2E30" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED2E30" />}
        >
          {treeData.length === 0 ? (
            <View style={[styles.center, { paddingTop: 60 }]}>
              <Ionicons name="business-outline" size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Chưa có phòng ban nào</Text>
              <Text style={styles.emptySubtitle}>Tạo phòng ban đầu tiên để bắt đầu quản lý</Text>
            </View>
          ) : (
            <>
              {assigned.map(g => renderSection(g, g.branch._id ?? g.branch.branch_code))}
              {unassigned.map((g, i) => renderSection(g, `unassigned-${i}`, true))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Modal thêm / sửa ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlayInner}>
            <View style={styles.modal}>
              {/* Header modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editTarget ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Chi nhánh */}
                <Text style={styles.fieldLabel}>Chi nhánh *</Text>
                <InlineSelect
                  label="chi nhánh"
                  value={form.branch_id}
                  options={branchSelectOptions}
                  placeholder="Chọn chi nhánh"
                  onSelect={v => setForm(prev => ({ ...prev, branch_id: v, parent_id: '' }))}
                />

                {/* Khối cha */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Khối cha (để trống nếu là Khối gốc)</Text>
                <InlineSelect
                  label="khối cha"
                  value={form.parent_id}
                  options={parentSelectOptions}
                  disabled={!form.branch_id}
                  placeholder={form.branch_id ? 'Không có (là Khối gốc)' : 'Chọn chi nhánh trước'}
                  onSelect={v => setForm(prev => ({ ...prev, parent_id: v }))}
                />

                {/* Mã phòng ban — chỉ khi tạo mới */}
                {!editTarget && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Mã phòng ban *</Text>
                    <TextInput
                      style={styles.input}
                      value={form.department_code}
                      onChangeText={v => setForm(prev => ({ ...prev, department_code: v.toUpperCase() }))}
                      placeholder="VD: KD01"
                      autoCapitalize="characters"
                      placeholderTextColor="#9CA3AF"
                    />
                  </>
                )}

                {/* Tên phòng ban */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Tên phòng ban *</Text>
                <TextInput
                  style={styles.input}
                  value={form.department_name}
                  onChangeText={v => setForm(prev => ({ ...prev, department_name: v }))}
                  placeholder="Nhập tên phòng ban"
                  placeholderTextColor="#9CA3AF"
                />

                {/* Buttons */}
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
              </ScrollView>
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
  scrollContent: { padding: 12, paddingBottom: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },

  // Section (chi nhánh)
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionWarning: { borderColor: '#FCD34D' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#F9FAFB',
  },
  sectionHeaderWarning: { backgroundColor: '#FFFBEB' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
  sectionTitleWarning: { color: '#92400E' },
  branchCodeBadge: { backgroundColor: '#FEE2E2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  branchCodeText: { fontSize: 10, fontWeight: '800', color: '#ED2E30', fontFamily: 'monospace' },
  warningBadge: { backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  warningBadgeText: { fontSize: 10, fontWeight: '600', color: '#92400E' },
  countBadge: { backgroundColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  countBadgeWarning: { backgroundColor: '#FDE68A' },
  countText: { fontSize: 11, fontWeight: '700', color: '#374151' },

  // Dept row
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  deptRowIndent: { paddingLeft: 28, backgroundColor: '#FAFAFA' },
  indentLine: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: '50%',
    width: 1,
    backgroundColor: '#D1D5DB',
  },
  deptInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  codeChip: {
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  codeChipChild: { backgroundColor: '#F3F4F6' },
  codeText: { fontSize: 10, fontWeight: '800', color: '#ED2E30', fontFamily: 'monospace' },
  codeTextChild: { color: '#6B7280' },
  deptName: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
  deptNameChild: { fontWeight: '500', color: '#374151' },
  rootBadge: { backgroundColor: '#EFF6FF', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  rootBadgeText: { fontSize: 9, fontWeight: '700', color: '#1D4ED8' },
  rowActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
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
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },

  // InlineSelect
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  selectBtnDisabled: { backgroundColor: '#F9FAFB', opacity: 0.6 },
  selectBtnText: { fontSize: 14, color: '#111827', flex: 1, marginRight: 8 },
  selectPlaceholder: { color: '#9CA3AF' },
  selectList: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 180,
    overflow: 'scroll',
  },
  selectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectItemActive: { backgroundColor: '#FFF0F0' },
  selectItemText: { fontSize: 13, color: '#374151' },
  selectItemTextActive: { color: '#ED2E30', fontWeight: '600' },
  selectItemTextMuted: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },

  // TextInput
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

  // Buttons
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
