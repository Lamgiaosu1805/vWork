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
import positionApi from '../../api/positionApi';

const DEPT_TYPE_OPTIONS = [
  { value: 'holding',    label: 'Tập đoàn' },
  { value: 'board',      label: 'Ban' },
  { value: 'division',   label: 'Khối' },
  { value: 'department', label: 'Phòng ban' },
  { value: 'branch',     label: 'Chi nhánh (TTKD)' },
];

const TYPE_STYLE = {
  holding:    { bg: '#FEE2E2', color: '#B91C1C' },
  board:      { bg: '#EDE9FE', color: '#6D28D9' },
  division:   { bg: '#DBEAFE', color: '#1D4ED8' },
  department: { bg: '#DCFCE7', color: '#15803D' },
  branch:     { bg: '#FFEDD5', color: '#C2410C' },
};

const INDENT_PER_DEPTH = 16;

// ── Inline select dropdown ────────────────────────────────────────────────────
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
            <Text style={styles.selectItemTextMuted}>— Không chọn —</Text>
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

// ── Node trong cây tổ chức (đệ quy) ─────────────────────────────────────────
const TreeNode = ({ node, depth = 0, canManage, onEdit, onDelete }) => {
  const ts = TYPE_STYLE[node.type] ?? TYPE_STYLE.department;
  const typeLabel = DEPT_TYPE_OPTIONS.find(o => o.value === node.type)?.label ?? node.type;
  const paddingLeft = 12 + depth * INDENT_PER_DEPTH;

  return (
    <>
      <View style={[styles.nodeRow, { paddingLeft }]}>
        {depth > 0 && <View style={styles.indentLine} />}
        <View style={styles.nodeInfo}>
          <View style={[styles.codeChip, { backgroundColor: ts.bg }]}>
            <Text style={[styles.codeText, { color: ts.color }]}>{node.department_code}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.nodeName} numberOfLines={2}>{node.department_name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: ts.bg }]}>
                <Text style={[styles.typeBadgeText, { color: ts.color }]}>{typeLabel}</Text>
              </View>
              {node.address ? (
                <Text style={styles.addressText} numberOfLines={1}>📍 {node.address}</Text>
              ) : null}
            </View>
          </View>
        </View>
        {canManage && (
          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(node)}>
              <Ionicons name="pencil" size={13} color="#ED2E30" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => onDelete(node)}>
              <Ionicons name="trash" size={13} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {(node.children ?? []).map(child => (
        <TreeNode
          key={child._id}
          node={child}
          depth={depth + 1}
          canManage={canManage}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

// ── Tab chức vụ ───────────────────────────────────────────────────────────────
const PositionTab = ({ canManage }) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [saving, setSaving]             = useState(false);
  const [form, setForm] = useState({ position_name: '', description: '' });

  const fetchPositions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await positionApi.getAll();
      setPositions(res.data?.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải danh sách chức vụ' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPositions(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ position_name: '', description: '' });
    setModalVisible(true);
  };

  const openEdit = (pos) => {
    setEditTarget(pos);
    setForm({ position_name: pos.position_name, description: pos.description || '' });
    setModalVisible(true);
  };

  const confirmDelete = (pos) => {
    Alert.alert(
      'Xoá chức vụ',
      `Bạn có chắc muốn xoá chức vụ "${pos.position_name}"?\nKhông thể xoá nếu đang có nhân viên đảm nhiệm.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá', style: 'destructive',
          onPress: async () => {
            try {
              await positionApi.delete(pos._id);
              Toast.show({ type: 'success', text1: 'Xoá chức vụ thành công' });
              fetchPositions(true);
            } catch (e) {
              Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Xoá thất bại' });
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!form.position_name.trim())
      return Toast.show({ type: 'error', text1: 'Vui lòng nhập tên chức vụ' });

    setSaving(true);
    try {
      if (editTarget) {
        await positionApi.update(editTarget._id, form);
        Toast.show({ type: 'success', text1: 'Cập nhật chức vụ thành công' });
      } else {
        await positionApi.create(form);
        Toast.show({ type: 'success', text1: 'Thêm chức vụ thành công' });
      }
      setModalVisible(false);
      fetchPositions(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ED2E30" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchPositions(true); setRefreshing(false); }} tintColor="#ED2E30" />}
      >
        {canManage && (
          <TouchableOpacity style={styles.addPositionBtn} onPress={openAdd}>
            <Ionicons name="add-circle-outline" size={18} color="#ED2E30" />
            <Text style={styles.addPositionBtnText}>Thêm chức vụ mới</Text>
          </TouchableOpacity>
        )}

        {positions.length === 0 ? (
          <View style={[styles.center, { paddingTop: 40 }]}>
            <Ionicons name="medal-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có chức vụ nào</Text>
            <Text style={styles.emptySubtitle}>Thêm chức vụ để gán cho nhân viên khi tạo hồ sơ</Text>
          </View>
        ) : (
          <View style={styles.treeCard}>
            {positions.map((pos, idx) => (
              <View key={pos._id} style={[styles.positionRow, idx === 0 && { borderTopWidth: 0 }]}>
                <View style={styles.positionInfo}>
                  <Text style={styles.positionName}>{pos.position_name}</Text>
                  {pos.description ? (
                    <Text style={styles.positionDesc} numberOfLines={2}>{pos.description}</Text>
                  ) : (
                    <Text style={styles.positionDescEmpty}>Chưa có mô tả</Text>
                  )}
                </View>
                {canManage && (
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(pos)}>
                      <Ionicons name="pencil" size={13} color="#ED2E30" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => confirmDelete(pos)}>
                      <Ionicons name="trash" size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal thêm / sửa chức vụ */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlayInner}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editTarget ? 'Sửa chức vụ' : 'Thêm chức vụ'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Tên chức vụ *</Text>
              <TextInput
                style={styles.input}
                value={form.position_name}
                onChangeText={v => setForm(prev => ({ ...prev, position_name: v }))}
                placeholder="VD: Tổng giám đốc"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Mô tả</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={form.description}
                onChangeText={v => setForm(prev => ({ ...prev, description: v }))}
                placeholder="Mô tả ngắn về chức vụ (tuỳ chọn)"
                placeholderTextColor="#9CA3AF"
                multiline
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
    </>
  );
};

// ── Màn hình chính ────────────────────────────────────────────────────────────
export default function DepartmentScreen() {
  const user = useSelector(s => s.auth.user);
  const perms = getPermissions(user);

  const [activeTab, setActiveTab] = useState('structure');
  const [treeData, setTreeData] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'department', parent_id: '', department_name: '', department_code: '', address: '',
  });

  const fetchTree = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        departmentApi.getAll(),
        departmentApi.getAll({ flat: true }),
      ]);
      setTreeData(treeRes.data?.data ?? []);
      setFlatList(flatRes.data?.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể tải danh sách phòng ban' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTree(true);
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ type: 'department', parent_id: '', department_name: '', department_code: '', address: '' });
    setModalVisible(true);
  };

  const openEdit = node => {
    setEditTarget(node);
    setForm({
      type: node.type ?? 'department',
      parent_id: node.parent?._id ?? '',
      department_name: node.department_name,
      department_code: node.department_code ?? '',
      address: node.address ?? '',
    });
    setModalVisible(true);
  };

  const confirmDelete = node => {
    Alert.alert(
      'Xoá',
      `Bạn có chắc muốn xoá "${node.department_name}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá', style: 'destructive',
          onPress: async () => {
            try {
              await departmentApi.delete(node._id);
              Toast.show({ type: 'success', text1: 'Xoá thành công' });
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
    if (!form.type) return Toast.show({ type: 'error', text1: 'Vui lòng chọn loại' });
    if (!form.department_name.trim()) return Toast.show({ type: 'error', text1: 'Vui lòng nhập tên' });
    if (!editTarget && !form.department_code.trim()) return Toast.show({ type: 'error', text1: 'Vui lòng nhập mã' });

    setSaving(true);
    try {
      if (editTarget) {
        await departmentApi.update(editTarget._id, {
          department_name: form.department_name,
          type: form.type,
          address: form.address,
          parent_id: form.parent_id || null,
        });
        Toast.show({ type: 'success', text1: 'Cập nhật thành công' });
      } else {
        await departmentApi.create({
          department_name: form.department_name,
          department_code: form.department_code,
          type: form.type,
          address: form.address,
          ...(form.parent_id ? { parent_id: form.parent_id } : {}),
        });
        Toast.show({ type: 'success', text1: 'Thêm mới thành công' });
      }
      setModalVisible(false);
      fetchTree(true);
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message ?? 'Có lỗi xảy ra' });
    } finally {
      setSaving(false);
    }
  };

  const parentSelectOptions = flatList
    .filter(d => !editTarget || d._id !== editTarget._id)
    .map(d => ({ value: d._id, label: `${d.department_name} (${d.department_code})` }));

  const showAddOnHeader = perms.showHrmMgmt && activeTab === 'structure';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Cơ cấu & Chức vụ"
        leftIconName="menu"
        onLeftPress={openDrawer}
        {...(showAddOnHeader ? { rightIconName: 'add', onRightPress: openAdd } : {})}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'structure' && styles.tabBtnActive]}
          onPress={() => setActiveTab('structure')}
        >
          <Ionicons name="git-branch-outline" size={15} color={activeTab === 'structure' ? '#ED2E30' : '#9CA3AF'} />
          <Text style={[styles.tabBtnText, activeTab === 'structure' && styles.tabBtnTextActive]}>
            Cơ cấu tổ chức
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'positions' && styles.tabBtnActive]}
          onPress={() => setActiveTab('positions')}
        >
          <Ionicons name="medal-outline" size={15} color={activeTab === 'positions' ? '#ED2E30' : '#9CA3AF'} />
          <Text style={[styles.tabBtnText, activeTab === 'positions' && styles.tabBtnTextActive]}>
            Chức vụ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab: Cơ cấu tổ chức */}
      {activeTab === 'structure' && (
        loading ? (
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
                <Text style={styles.emptyTitle}>Chưa có cơ cấu tổ chức</Text>
                <Text style={styles.emptySubtitle}>Chạy seed script hoặc thêm node đầu tiên</Text>
              </View>
            ) : (
              <View style={styles.treeCard}>
                {treeData.map(root => (
                  <TreeNode
                    key={root._id}
                    node={root}
                    depth={0}
                    canManage={perms.showHrmMgmt}
                    onEdit={openEdit}
                    onDelete={confirmDelete}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* Tab: Chức vụ */}
      {activeTab === 'positions' && (
        <PositionTab canManage={perms.showHrmMgmt} />
      )}

      {/* Modal thêm / sửa node tổ chức */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlayInner}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editTarget ? 'Chỉnh sửa' : 'Thêm node tổ chức'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.fieldLabel}>Loại *</Text>
                <InlineSelect
                  label="loại"
                  value={form.type}
                  options={DEPT_TYPE_OPTIONS}
                  onSelect={v => setForm(prev => ({ ...prev, type: v }))}
                />

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Thuộc (để trống nếu là node gốc)</Text>
                <InlineSelect
                  label="node cha"
                  value={form.parent_id}
                  options={parentSelectOptions}
                  placeholder="— Không có (node gốc) —"
                  onSelect={v => setForm(prev => ({ ...prev, parent_id: v }))}
                />

                {!editTarget && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Mã *</Text>
                    <TextInput
                      style={styles.input}
                      value={form.department_code}
                      onChangeText={v => setForm(prev => ({ ...prev, department_code: v.toUpperCase() }))}
                      placeholder="VD: K-MKT"
                      autoCapitalize="characters"
                      placeholderTextColor="#9CA3AF"
                    />
                  </>
                )}

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Tên *</Text>
                <TextInput
                  style={styles.input}
                  value={form.department_name}
                  onChangeText={v => setForm(prev => ({ ...prev, department_name: v }))}
                  placeholder="Nhập tên"
                  placeholderTextColor="#9CA3AF"
                />

                {form.type === 'branch' && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Địa chỉ</Text>
                    <TextInput
                      style={styles.input}
                      value={form.address}
                      onChangeText={v => setForm(prev => ({ ...prev, address: v }))}
                      placeholder="VD: Hà Nội"
                      placeholderTextColor="#9CA3AF"
                    />
                  </>
                )}

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

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
  },
  tabBtnActive: { borderBottomColor: '#ED2E30' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabBtnTextActive: { color: '#ED2E30' },

  treeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  // Tree node
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  indentLine: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: '50%',
    width: 1,
    backgroundColor: '#D1D5DB',
  },
  nodeInfo: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  nameBlock: { flex: 1 },
  nodeName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  codeChip: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 2 },
  codeText: { fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  typeBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  addressText: { fontSize: 10, color: '#9CA3AF' },
  rowActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDanger: { backgroundColor: '#FEE2E2' },

  // Position list
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  positionInfo: { flex: 1 },
  positionName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  positionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  positionDescEmpty: { fontSize: 12, color: '#D1D5DB', marginTop: 2, fontStyle: 'italic' },

  addPositionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  addPositionBtnText: { fontSize: 13, fontWeight: '600', color: '#ED2E30' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  overlayInner: { justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32,
    maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },

  // InlineSelect
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
  },
  selectBtnDisabled: { backgroundColor: '#F9FAFB', opacity: 0.6 },
  selectBtnText: { fontSize: 14, color: '#111827', flex: 1, marginRight: 8 },
  selectPlaceholder: { color: '#9CA3AF' },
  selectList: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    marginTop: 4, backgroundColor: '#fff', maxHeight: 200,
  },
  selectItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  selectItemActive: { backgroundColor: '#FFF0F0' },
  selectItemText: { fontSize: 13, color: '#374151', flex: 1, marginRight: 4 },
  selectItemTextActive: { color: '#ED2E30', fontWeight: '600' },
  selectItemTextMuted: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },

  // Input
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#111827', backgroundColor: '#fff',
  },

  // Buttons
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  btnSave: {
    flex: 2, paddingVertical: 12, borderRadius: 8,
    backgroundColor: '#ED2E30', alignItems: 'center', justifyContent: 'center',
  },
  btnSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
