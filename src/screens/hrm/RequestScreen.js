import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Header from '../../components/Header';
import { openDrawer } from '../../helpers/navigationRef';

const PRIMARY = '#ED2E30';

const LEAVE_TYPES = ['Nghỉ phép năm', 'Nghỉ ốm', 'Nghỉ không lương', 'Nghỉ thai sản', 'Nghỉ việc riêng'];
const LATE_TYPES  = ['Đi muộn', 'Về sớm', 'Đi muộn & Về sớm'];

const STATUS_CFG = {
    pending:  { label: 'Chờ duyệt', bg: '#FEF3C7', color: '#B45309' },
    approved: { label: 'Đã duyệt',  bg: '#D1FAE5', color: '#065F46' },
    rejected: { label: 'Từ chối',   bg: '#FEE2E2', color: '#B91C1C' },
};

const mockLeave = [
    { id: 1, type: 'Nghỉ phép năm', from: '02/05/2026', to: '03/05/2026', days: 2, reason: 'Du lịch gia đình', status: 'approved', submitted: '28/04/2026' },
    { id: 2, type: 'Nghỉ ốm',       from: '07/05/2026', to: '07/05/2026', days: 1, reason: 'Sốt cao',          status: 'approved', submitted: '07/05/2026' },
    { id: 3, type: 'Nghỉ việc riêng',from: '20/05/2026', to: '20/05/2026', days: 1, reason: 'Việc gia đình',   status: 'pending',  submitted: '12/05/2026' },
];

const mockLate = [
    { id: 1, type: 'Đi muộn', date: '04/05/2026', time: '08:45', reason: 'Kẹt xe',          status: 'approved', submitted: '04/05/2026' },
    { id: 2, type: 'Về sớm',  date: '08/05/2026', time: '12:30', reason: 'Đưa con đi khám', status: 'approved', submitted: '08/05/2026' },
    { id: 3, type: 'Đi muộn', date: '13/05/2026', time: '09:10', reason: 'Xe hỏng',          status: 'pending',  submitted: '13/05/2026' },
];

const mockOther = [
    { id: 1, title: 'Xin tăng ca',  content: 'Xin làm thêm thứ 7 tuần này',              status: 'approved', submitted: '10/05/2026' },
    { id: 2, title: 'Đổi ca làm',   content: 'Xin đổi ca sáng sang ca chiều ngày 15/05', status: 'pending',  submitted: '12/05/2026' },
];

// ─── Shared components ───────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
    return (
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}

function SectionLabel({ children }) {
    return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Field({ label, children }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

function StyledInput({ placeholder, value, onChangeText, multiline, keyboardType }) {
    return (
        <TextInput
            style={[styles.input, multiline && styles.inputMulti]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            keyboardType={keyboardType}
        />
    );
}

function TypeSelector({ options, value, onSelect }) {
    return (
        <View style={styles.typeList}>
            {options.map((opt) => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.typeChip, value === opt && styles.typeChipActive]}
                    onPress={() => onSelect(opt)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.typeChipText, value === opt && styles.typeChipTextActive]}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function SubmitButton({ label, onPress }) {
    return (
        <TouchableOpacity style={styles.submitBtn} onPress={onPress} activeOpacity={0.8}>
            <Ionicons name="send-outline" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>{label}</Text>
        </TouchableOpacity>
    );
}

function HistoryCard({ children }) {
    return <View style={styles.historyCard}>{children}</View>;
}

function HistoryMeta({ left, right, status }) {
    return (
        <View style={styles.historyMeta}>
            <Text style={styles.historyMetaText}>{left}</Text>
            <View style={styles.historyMetaRight}>
                {right && <Text style={styles.historyMetaText}>{right}</Text>}
                <StatusBadge status={status} />
            </View>
        </View>
    );
}

// ─── Tab: Xin nghỉ phép ──────────────────────────────────────────────────────

function LeaveTab() {
    const [form, setForm] = useState({ type: '', from: '', to: '', reason: '' });
    const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = () => {
        if (!form.type || !form.from || !form.to || !form.reason.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }
        Toast.show({ type: 'success', text1: 'Gửi yêu cầu nghỉ phép thành công!' });
        setForm({ type: '', from: '', to: '', reason: '' });
    };

    return (
        <>
            <View style={styles.formCard}>
                <SectionLabel>Tạo yêu cầu nghỉ phép</SectionLabel>
                <Field label="Loại nghỉ phép">
                    <TypeSelector options={LEAVE_TYPES} value={form.type} onSelect={set('type')} />
                </Field>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Field label="Từ ngày">
                            <StyledInput placeholder="DD/MM/YYYY" value={form.from} onChangeText={set('from')} />
                        </Field>
                    </View>
                    <View style={styles.rowSpacer} />
                    <View style={{ flex: 1 }}>
                        <Field label="Đến ngày">
                            <StyledInput placeholder="DD/MM/YYYY" value={form.to} onChangeText={set('to')} />
                        </Field>
                    </View>
                </View>
                <Field label="Lý do">
                    <StyledInput placeholder="Nhập lý do xin nghỉ..." value={form.reason} onChangeText={set('reason')} multiline />
                </Field>
                <SubmitButton label="Gửi yêu cầu" onPress={handleSubmit} />
            </View>

            <SectionLabel>Lịch sử yêu cầu</SectionLabel>
            {mockLeave.map((r) => (
                <HistoryCard key={r.id}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyType}>{r.type}</Text>
                        <StatusBadge status={r.status} />
                    </View>
                    <Text style={styles.historyBody}>{r.from} → {r.to} · {r.days} ngày</Text>
                    <Text style={styles.historyReason} numberOfLines={2}>{r.reason}</Text>
                    <HistoryMeta left={`Ngày gửi: ${r.submitted}`} />
                </HistoryCard>
            ))}
        </>
    );
}

// ─── Tab: Đi muộn / Về sớm ───────────────────────────────────────────────────

function LateTab() {
    const [form, setForm] = useState({ type: '', date: '', time: '', reason: '' });
    const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = () => {
        if (!form.type || !form.date || !form.time.trim() || !form.reason.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }
        Toast.show({ type: 'success', text1: 'Gửi giải trình thành công!' });
        setForm({ type: '', date: '', time: '', reason: '' });
    };

    return (
        <>
            <View style={styles.formCard}>
                <SectionLabel>Giải trình đi muộn / về sớm</SectionLabel>
                <Field label="Loại">
                    <TypeSelector options={LATE_TYPES} value={form.type} onSelect={set('type')} />
                </Field>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Field label="Ngày">
                            <StyledInput placeholder="DD/MM/YYYY" value={form.date} onChangeText={set('date')} />
                        </Field>
                    </View>
                    <View style={styles.rowSpacer} />
                    <View style={{ flex: 1 }}>
                        <Field label="Giờ thực tế">
                            <StyledInput placeholder="VD: 08:45" value={form.time} onChangeText={set('time')} />
                        </Field>
                    </View>
                </View>
                <Field label="Lý do">
                    <StyledInput placeholder="Nhập lý do..." value={form.reason} onChangeText={set('reason')} multiline />
                </Field>
                <SubmitButton label="Gửi giải trình" onPress={handleSubmit} />
            </View>

            <SectionLabel>Lịch sử giải trình</SectionLabel>
            {mockLate.map((r) => (
                <HistoryCard key={r.id}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyType}>{r.type}</Text>
                        <StatusBadge status={r.status} />
                    </View>
                    <Text style={styles.historyBody}>{r.date} · {r.time}</Text>
                    <Text style={styles.historyReason} numberOfLines={2}>{r.reason}</Text>
                    <HistoryMeta left={`Ngày gửi: ${r.submitted}`} />
                </HistoryCard>
            ))}
        </>
    );
}

// ─── Tab: Yêu cầu khác ───────────────────────────────────────────────────────

function OtherTab() {
    const [form, setForm] = useState({ title: '', content: '' });
    const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = () => {
        if (!form.title.trim() || !form.content.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }
        Toast.show({ type: 'success', text1: 'Gửi yêu cầu thành công!' });
        setForm({ title: '', content: '' });
    };

    return (
        <>
            <View style={styles.formCard}>
                <SectionLabel>Tạo yêu cầu khác</SectionLabel>
                <Field label="Tiêu đề yêu cầu">
                    <StyledInput placeholder="VD: Xin tăng ca, Đổi ca làm..." value={form.title} onChangeText={set('title')} />
                </Field>
                <Field label="Nội dung">
                    <StyledInput placeholder="Mô tả chi tiết yêu cầu..." value={form.content} onChangeText={set('content')} multiline />
                </Field>
                <SubmitButton label="Gửi yêu cầu" onPress={handleSubmit} />
            </View>

            <SectionLabel>Lịch sử yêu cầu</SectionLabel>
            {mockOther.map((r) => (
                <HistoryCard key={r.id}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyType}>{r.title}</Text>
                        <StatusBadge status={r.status} />
                    </View>
                    <Text style={styles.historyReason} numberOfLines={3}>{r.content}</Text>
                    <HistoryMeta left={`Ngày gửi: ${r.submitted}`} />
                </HistoryCard>
            ))}
        </>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const TABS = [
    { label: 'Xin nghỉ phép',      component: LeaveTab },
    { label: 'Đi muộn / Về sớm',   component: LateTab  },
    { label: 'Yêu cầu khác',       component: OtherTab },
];

export default function RequestScreen() {
    const [activeTab, setActiveTab] = useState(0);
    const ActiveTab = TABS[activeTab].component;

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <Header
                title="Gửi yêu cầu"
                leftIconName="menu"
                onLeftPress={openDrawer}
            />

            {/* Tab bar */}
            <View style={styles.tabBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarInner}>
                    {TABS.map((t, i) => (
                        <TouchableOpacity
                            key={t.label}
                            style={[styles.tabItem, activeTab === i && styles.tabItemActive]}
                            onPress={() => setActiveTab(i)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <ActiveTab />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#F5F6FA' },
    scroll:     { padding: 16, paddingBottom: 40 },

    // Tab bar
    tabBar:      { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    tabBarInner: { paddingHorizontal: 12, paddingVertical: 4, gap: 4 },
    tabItem:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
    tabItemActive: { backgroundColor: '#FEF2F2' },
    tabLabel:    { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    tabLabelActive: { color: PRIMARY },

    // Form
    formCard: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', padding: 16, marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 14,
    },

    field:      { marginBottom: 12 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },

    input: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    },
    inputMulti: { height: 90, textAlignVertical: 'top' },

    row:        { flexDirection: 'row' },
    rowSpacer:  { width: 10 },

    typeList:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
        borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
    },
    typeChipActive:     { borderColor: PRIMARY, backgroundColor: '#FEF2F2' },
    typeChipText:       { fontSize: 13, color: '#374151', fontWeight: '500' },
    typeChipTextActive: { color: PRIMARY, fontWeight: '700' },

    submitBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: PRIMARY, borderRadius: 8,
        paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start',
        marginTop: 4,
    },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // History cards
    historyCard: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', padding: 14, marginBottom: 10,
    },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    historyType:   { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
    historyBody:   { fontSize: 13, color: '#374151', marginBottom: 4 },
    historyReason: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
    historyMeta:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    historyMetaText: { fontSize: 12, color: '#9CA3AF' },
    historyMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    // Badge
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '700' },
});
