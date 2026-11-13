import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import useTicketDepartments from "../../hooks/useTicketDepartments";
import EmployeePicker from "../EmployeePicker";
import OptionSelect from "../OptionSelect";
import TicketSheet, { InfoNote, SheetField } from "../TicketSheet";

export const EMPTY_ASSIGNMENT = { mode: "none", departmentId: null, members: [], ownerId: null };

// Khớp TicketAssignmentFields của web: "Phòng ban" chỉ cho ban lãnh đạo (canAssignDepartment); trưởng bộ phận
// chỉ giao cho người trong phòng mình. Chủ trì chỉ chọn khi giao từ 2 người trở lên.
export const AssignmentFields = ({ value, onChange, me }) => {
  const canDepartment = Boolean(me?.canAssignDepartment);
  const { departments } = useTicketDepartments({ enabled: canDepartment && value.mode === "department" });
  const modes = [
    { key: "none", label: "Chưa giao" },
    canDepartment && { key: "department", label: "Phòng ban" },
    { key: "members", label: "Người cụ thể" },
  ].filter(Boolean);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <>
      <SheetField label="Giao việc">
        <View style={styles.segment}>
          {modes.map((mode) => {
            const active = value.mode === mode.key;
            return (
              <TouchableOpacity
                key={mode.key}
                style={[styles.segmentItem, active && styles.segmentActive]}
                onPress={() => set({ mode: mode.key })}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{mode.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SheetField>

      {value.mode === "none" && (
        <View style={styles.noneBox}>
          <Ionicons name="globe-outline" size={20} color="#6B7280" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noneTitle}>Không giao</Text>
            <Text style={styles.noneDesc}>Người có quyền xử lý đều nhận được ticket.</Text>
          </View>
        </View>
      )}

      {value.mode === "department" && (
        <SheetField label="Phòng ban" required>
          <OptionSelect
            value={value.departmentId}
            placeholder="Chọn phòng ban"
            allowClear={false}
            options={departments.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(departmentId) => set({ departmentId })}
          />
        </SheetField>
      )}

      {value.mode === "members" && (
        <>
          <SheetField label="Người được giao" required>
            <EmployeePicker
              assignable
              value={value.members}
              onChange={(members) =>
                set({
                  members,
                  ownerId: members.some((item) => item.id === value.ownerId) ? value.ownerId : null,
                })
              }
            />
          </SheetField>
          {!canDepartment && (
            <InfoNote>
              Bạn chỉ giao được cho người trong phòng mình. Muốn nhờ phòng khác, hãy tạo ticket để bên đó
              tự nhận.
            </InfoNote>
          )}
          {value.members.length > 1 && (
            <SheetField
              label="Chủ trì (không bắt buộc)"
              hint="Bỏ trống: người đầu tiên bấm Nhận sẽ là chủ trì, những người còn lại là phối hợp."
            >
              <OptionSelect
                value={value.ownerId}
                placeholder="Để người nhận trước làm chủ trì"
                options={value.members.map((item) => ({ value: item.id, label: item.name }))}
                onChange={(ownerId) => set({ ownerId })}
              />
            </SheetField>
          )}
        </>
      )}
    </>
  );
};

export const assignmentPayloadOf = (value) => {
  if (value.mode === "department") return { mode: "department", departmentId: value.departmentId };
  if (value.mode === "members") {
    return {
      mode: "members",
      memberIds: value.members.map((item) => item.id),
      ownerId: value.members.length > 1 ? value.ownerId : null,
    };
  }
  return { mode: "none" };
};

export const isAssignmentComplete = (value) =>
  (value.mode === "department" && Boolean(value.departmentId)) ||
  (value.mode === "members" && value.members.length > 0);

const initialOf = (ticket) => {
  const assignment = ticket?.assignment;
  if (assignment?.mode === "department" && assignment.department) {
    return { ...EMPTY_ASSIGNMENT, mode: "department", departmentId: assignment.department.id };
  }
  if (assignment?.mode === "members") {
    return {
      ...EMPTY_ASSIGNMENT,
      mode: "members",
      members: assignment.members ?? [],
      ownerId: assignment.owner?.id ?? null,
    };
  }
  return EMPTY_ASSIGNMENT;
};

const AssignSheet = ({ visible, onClose, ticket, meta }) => {
  const [value, setValue] = useState(EMPTY_ASSIGNMENT);
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setValue(initialOf(ticket));
    setError("");
  }, [visible]);

  const complete = isAssignmentComplete(value);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="people-outline"
      title="Giao việc"
      subtitle={ticket?.code}
      submitLabel="Giao việc"
      onSubmit={() => run("assign", assignmentPayloadOf(value), onClose)}
      submitting={isPending}
      submitDisabled={!complete}
      error={error || (value.mode === "none" ? "Vui lòng chọn người / phòng ban được giao" : "")}
      fullHeight={value.mode === "members"}
    >
      <AssignmentFields value={value} onChange={setValue} me={meta?.me} />
    </TicketSheet>
  );
};

export default AssignSheet;

const styles = StyleSheet.create({
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 12, backgroundColor: "#E9ECF1" },
  segmentItem: { flex: 1, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  segmentTextActive: { color: "#1A1D26" },
  noneBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  noneTitle: { fontSize: 14, fontWeight: "700", color: "#1A1D26" },
  noneDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
