import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TICKET_APPROVAL_STATUS_CONFIG } from "../../constants";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPhone,
  formatShortDate,
} from "../../lib/ticketFormat";
import { Avatar, Pill } from "../TicketBadges";
import TicketAttachments from "../TicketAttachments";

export const Box = ({ title, right, children }) => (
  <View style={styles.box}>
    {(title || right) && (
      <View style={styles.boxHeader}>
        <Text style={styles.boxTitle}>{title}</Text>
        {right}
      </View>
    )}
    {children}
  </View>
);

const PersonRow = ({ label, person, extra, right }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {person ? (
      <>
        <Avatar id={person.id} name={person.name} size={28} />
        <Text style={styles.personName} numberOfLines={1}>
          {person.name}
        </Text>
      </>
    ) : (
      <Text style={[styles.personName, styles.muted]}>Chưa có</Text>
    )}
    <View style={{ flex: 1 }} />
    {!!extra && <Text style={styles.extra}>{extra}</Text>}
    {right}
  </View>
);

const KeyValue = ({ label, value }) => (
  <View style={styles.kv}>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text style={styles.kvValue}>{value || "—"}</Text>
  </View>
);

const fieldValue = (field, value) => {
  if (value === undefined || value === null || value === "") return "";
  if (field?.type === "money") return `${formatMoney(value)}đ`;
  if (field?.type === "date") return formatDate(value);
  return String(value);
};

const TicketInfoTab = ({ ticket, onAddCollaborator, onRemoveCollaborator, onVerifyApproval, onOpenTicket }) => {
  const { assignment, approval, customer, capabilities = {} } = ticket;
  const templateFields = ticket.template?.fields ?? [];
  const customEntries = Object.entries(ticket.customFields ?? {}).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );
  const ticketFiles = (ticket.attachments ?? []).filter((file) => !file.messageId);
  const approvalCfg = TICKET_APPROVAL_STATUS_CONFIG[approval?.status];

  return (
    <View style={{ gap: 10 }}>
      {ticket.resolution && (
        <Box title={ticket.status === "resolved" ? "Kết quả xử lý" : `Kết quả: ${ticket.resolution.label}`}>
          {!!ticket.resolution.actionTaken && (
            <Text style={styles.body}>{ticket.resolution.actionTaken}</Text>
          )}
          {!!ticket.resolution.note && (
            <Text style={[styles.body, styles.muted]}>Ghi chú: {ticket.resolution.note}</Text>
          )}
          {ticket.followUp?.checkAt && (
            <KeyValue
              label="Hẹn kiểm tra"
              value={`${formatShortDate(ticket.followUp.checkAt)}${ticket.followUp.note ? ` – ${ticket.followUp.note}` : ""}`}
            />
          )}
          {ticket.duplicateOfTicket && (
            <TouchableOpacity onPress={() => onOpenTicket(ticket.duplicateOfTicket.id)}>
              <Text style={styles.link}>
                Trùng với {ticket.duplicateOfTicket.code} · {ticket.duplicateOfTicket.title}
              </Text>
            </TouchableOpacity>
          )}
        </Box>
      )}

      {ticket.status === "on_hold" && ticket.hold && (
        <Box title="Đang tạm hoãn">
          <Text style={styles.body}>{ticket.hold.reason}</Text>
          {ticket.hold.resumeAt && (
            <KeyValue label="Dự kiến tiếp tục" value={formatDate(ticket.hold.resumeAt)} />
          )}
        </Box>
      )}

      <Box title="Mô tả">
        <Text style={[styles.body, !ticket.description && styles.muted]}>
          {ticket.description || "Không có mô tả"}
        </Text>
        {customEntries.map(([key, value]) => {
          const field = templateFields.find((item) => item.key === key);
          return <KeyValue key={key} label={field?.label ?? key} value={fieldValue(field, value)} />;
        })}
      </Box>

      {(customer || ticket.relatedEmployee) && (
        <Box title={customer ? "Khách hàng" : "Nhân sự liên quan"}>
          <View style={styles.customerRow}>
            <Avatar
              id={customer?.phone ?? ticket.relatedEmployee?.id}
              name={customer?.name || customer?.phone || ticket.relatedEmployee?.name}
              size={36}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>
                {customer ? customer.name || "Khách chưa có tên" : ticket.relatedEmployee.name}
              </Text>
              <Text style={styles.extra}>
                {customer
                  ? [customer.phone && formatPhone(customer.phone), customer.appCode?.toUpperCase()]
                      .filter(Boolean)
                      .join(" · ")
                  : ticket.relatedEmployee.departmentNames?.join(", ")}
              </Text>
            </View>
            {!!customer?.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${customer.phone}`)}
              >
                <Ionicons name="call-outline" size={18} color="#059669" />
              </TouchableOpacity>
            )}
          </View>
        </Box>
      )}

      <Box title="Người liên quan">
        <PersonRow label="Người tạo" person={ticket.createdBy} />
        {assignment?.mode === "department" && !assignment.owner && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Giao cho</Text>
            <Text style={styles.personName}>{assignment.department?.name ?? "Phòng ban"}</Text>
          </View>
        )}
        {assignment?.mode === "members" && !assignment.owner && assignment.members?.length > 0 && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Giao cho</Text>
            <Text style={[styles.personName, { flex: 1 }]} numberOfLines={2}>
              {assignment.members.map((member) => member.name).join(", ")}
            </Text>
          </View>
        )}
        <PersonRow
          label="Chủ trì"
          person={assignment?.owner}
          extra={assignment?.department?.name}
        />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Phối hợp</Text>
          <View style={styles.collabList}>
            {(assignment?.collaborators ?? []).length === 0 && (
              <Text style={[styles.personName, styles.muted]}>Chưa có</Text>
            )}
            {(assignment?.collaborators ?? []).map((person) => (
              <TouchableOpacity
                key={person.id}
                style={styles.collabChip}
                disabled={!capabilities.manageCollaborators}
                onLongPress={() => onRemoveCollaborator(person)}
              >
                <Avatar id={person.id} name={person.name} size={22} />
                <Text style={styles.collabName} numberOfLines={1}>
                  {person.name}
                </Text>
                {capabilities.manageCollaborators && (
                  <TouchableOpacity hitSlop={8} onPress={() => onRemoveCollaborator(person)}>
                    <Ionicons name="close" size={14} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {capabilities.manageCollaborators && (
            <TouchableOpacity style={styles.addBtn} onPress={onAddCollaborator}>
              <Text style={styles.addText}>+ Thêm</Text>
            </TouchableOpacity>
          )}
        </View>
      </Box>

      {approval?.required && (
        <Box
          title="Tờ trình phê duyệt"
          right={approvalCfg ? <Pill {...approvalCfg} /> : null}
        >
          {approval.reference ? (
            <>
              <KeyValue label="Số tờ trình" value={approval.reference.number} />
              <KeyValue label="Ngày" value={formatDate(approval.reference.date)} />
              <KeyValue label="Người ký" value={approval.reference.signer} />
            </>
          ) : (
            <Text style={[styles.body, styles.muted]}>Người tạo chưa nộp tờ trình.</Text>
          )}
          {!!approval.note && <Text style={[styles.body, styles.muted]}>{approval.note}</Text>}
          {capabilities.verifyApproval && (
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={[styles.approvalBtn, styles.approvalReject]}
                onPress={() => onVerifyApproval(false)}
              >
                <Text style={styles.approvalRejectText}>Trả về người tạo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approvalBtn, styles.approvalAccept]}
                onPress={() => onVerifyApproval(true)}
              >
                <Text style={styles.approvalAcceptText}>Xác nhận hợp lệ</Text>
              </TouchableOpacity>
            </View>
          )}
        </Box>
      )}

      {ticket.related?.length > 0 && (
        <Box title={`Ticket liên quan · ${ticket.related.length}`}>
          {ticket.related.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => onOpenTicket(item.id)}>
              <Text style={styles.link} numberOfLines={1}>
                {item.code} · {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Box>
      )}

      <Box title={`Tệp đính kèm · ${ticketFiles.length}`}>
        {ticketFiles.length === 0 ? (
          <Text style={[styles.body, styles.muted]}>Chưa có tệp nào</Text>
        ) : (
          <TicketAttachments ticketId={ticket.id} files={ticketFiles} maxWidth={300} />
        )}
      </Box>

      <Text style={styles.footnote}>
        Tạo {formatDateTime(ticket.createdAt)} · Cập nhật {formatDateTime(ticket.lastActivityAt)}
      </Text>
    </View>
  );
};

export default TicketInfoTab;

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#101828",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  boxHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  boxTitle: { fontSize: 13, fontWeight: "700", color: "#374151", flex: 1 },
  body: { fontSize: 14, lineHeight: 21, color: "#374151" },
  muted: { color: "#9CA3AF" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 32 },
  rowLabel: { width: 76, fontSize: 12, color: "#6B7280" },
  personName: { fontSize: 13, fontWeight: "600", color: "#1A1D26", flexShrink: 1 },
  extra: { fontSize: 12, color: "#6B7280" },
  kv: { flexDirection: "row", gap: 10 },
  kvLabel: { width: 110, fontSize: 12, color: "#6B7280", paddingTop: 1 },
  kvValue: { flex: 1, fontSize: 13, color: "#1A1D26", fontWeight: "500" },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  collabList: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  collabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 3,
    paddingRight: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    maxWidth: 160,
  },
  collabName: { fontSize: 12, fontWeight: "600", color: "#374151", flexShrink: 1 },
  addBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    justifyContent: "center",
  },
  addText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  approvalActions: { flexDirection: "row", gap: 8, marginTop: 2 },
  approvalBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  approvalReject: { borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FFFFFF" },
  approvalRejectText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
  approvalAccept: { backgroundColor: "#15803D" },
  approvalAcceptText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  link: { fontSize: 13, fontWeight: "600", color: "#E64A19" },
  footnote: { fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 4 },
});
