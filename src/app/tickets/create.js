import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  APPROVAL_DOCUMENT_KIND,
  TICKET_MAX_FILES,
  TICKET_MEDIA_KIND,
  TICKET_PRIMARY,
  TICKET_URGENCIES,
  TICKET_URGENCY_CONFIG,
} from "../../features/ticket/constants";
import useTicketMeta from "../../features/ticket/hooks/useTicketMeta";
import useCreateTicket from "../../features/ticket/hooks/useCreateTicket";
import OptionSelect from "../../features/ticket/components/OptionSelect";
import EmployeePicker from "../../features/ticket/components/EmployeePicker";
import TicketDateField from "../../features/ticket/components/TicketDateField";
import { InfoNote, SheetField, sheetInputStyle } from "../../features/ticket/components/TicketSheet";
import {
  AssignmentFields,
  EMPTY_ASSIGNMENT,
  assignmentPayloadOf,
} from "../../features/ticket/components/actions/AssignSheet";
import { AttachButtons, PickedFile } from "../../features/ticket/components/actions/SubmitInfoSheet";
import { pickTicketDocuments, pickTicketImages } from "../../features/ticket/lib/pickTicketFiles";
import {
  buildTitleFromPattern,
  errorMessageOf,
  fieldsForApp,
  toIsoDate,
  urgencyHint,
} from "../../features/ticket/lib/ticketFormat";

const DynamicField = ({ field, value, onChange }) => {
  if (field.type === "select") {
    return (
      <OptionSelect
        value={value || null}
        placeholder="Chọn"
        options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
        onChange={(next) => onChange(next ?? "")}
      />
    );
  }
  if (field.type === "date") {
    return (
      <TicketDateField
        value={value ? new Date(value) : null}
        clearable
        onChange={(date) => onChange(date ? toIsoDate(date) : "")}
      />
    );
  }
  const keyboard = { number: "numeric", money: "numeric", phone: "phone-pad" }[field.type] ?? "default";
  return (
    <TextInput
      value={value ?? ""}
      onChangeText={(text) => onChange(field.type === "money" ? text.replace(/\D/g, "") : text)}
      placeholder={field.placeholder || undefined}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboard}
      multiline={field.type === "textarea"}
      style={[
        sheetInputStyle,
        styles.whiteInput,
        field.type === "textarea" && { minHeight: 80, textAlignVertical: "top" },
      ]}
    />
  );
};

export default function CreateTicketScreen() {
  const insets = useSafeAreaInsets();
  const { meta, isLoading } = useTicketMeta();
  const { mutateAsync, isPending } = useCreateTicket();

  const [productId, setProductId] = useState(null);
  const [typeValue, setTypeValue] = useState(null);
  const [customFields, setCustomFields] = useState({});
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [relatedEmployee, setRelatedEmployee] = useState([]);
  const [files, setFiles] = useState([]);
  const [approvalRef, setApprovalRef] = useState({ number: "", date: null, signer: "" });
  const [assignment, setAssignment] = useState(EMPTY_ASSIGNMENT);
  const [submitted, setSubmitted] = useState(false);

  const products = meta?.products ?? [];
  const categories = meta?.categories ?? [];
  const templates = meta?.templates ?? [];
  const product = products.find((item) => item.id === productId);
  // Sản phẩm nội bộ vWork (CRM/HRM/Workplace) không gắn app khách → ticket hỗ trợ nhân sự, không phải khách
  const isInternal = Boolean(product) && !product.appCode;
  const [typeKind, typeId] = typeValue ? typeValue.split(":") : [];
  const template = typeKind === "tpl" ? templates.find((item) => item.id === typeId) : null;
  const categoryId = template?.categoryId ?? (typeKind === "cat" ? typeId : null);
  const templateFields = fieldsForApp(template?.fields, product?.appCode);
  // Chọn mẫu thì mức khẩn cố định theo mẫu
  const effectiveUrgency = template ? template.defaultUrgency || "normal" : urgency;
  const docs = (template?.requiredDocuments ?? []).filter((doc) => doc.kind !== TICKET_MEDIA_KIND);
  const mediaRequired = Boolean(
    template?.requiredDocuments?.some((doc) => doc.kind === TICKET_MEDIA_KIND && doc.required),
  );
  const needsApprovalUpload =
    Boolean(template?.requiresApproval) && !docs.some((doc) => doc.kind === APPROVAL_DOCUMENT_KIND);
  const docKinds = [...docs.map((doc) => doc.kind), ...(needsApprovalUpload ? [APPROVAL_DOCUMENT_KIND] : [])];
  const freeFiles = files.filter((file) => !docKinds.includes(file.kind));
  const showAssign = Boolean(meta?.me?.canAssignDepartment || meta?.me?.canAssignMember);

  const productGroups = useMemo(
    () =>
      products.reduce((acc, item) => {
        const group = item.group || "Khác";
        (acc[group] = acc[group] ?? []).push(item);
        return acc;
      }, {}),
    [products],
  );

  // Một ô "Vấn đề" gồm cả loại lẫn mẫu: mẫu thụt vào ngay dưới loại của nó
  const typeOptions = useMemo(
    () =>
      categories.flatMap((category) => [
        { value: `cat:${category.id}`, label: category.name, header: true },
        ...templates
          .filter((item) => item.categoryId === category.id)
          .map((item) => ({
            value: `tpl:${item.id}`,
            label: item.name,
            sublabel: category.name,
            indent: true,
          })),
      ]),
    [categories, templates],
  );

  const autoTitle = buildTitleFromPattern(template?.titlePattern, {
    productName: product?.name,
    customer: isInternal ? { name: relatedEmployee[0]?.name } : customer,
    customFields,
  });
  const effectiveTitle = titleTouched ? title : autoTitle || title;

  const handleProduct = (id) => {
    setProductId(id);
    const nextApp = products.find((item) => item.id === id)?.appCode;
    // Trường của mẫu bị ẩn với sản phẩm mới thì bỏ giá trị đã nhập, kẻo bị gửi đi dù không còn thấy
    const visible = new Set(fieldsForApp(template?.fields, nextApp).map((field) => field.key));
    setCustomFields((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => visible.has(key))),
    );
  };

  const handleType = (value) => {
    setTypeValue(value);
    setCustomFields({});
    setApprovalRef({ number: "", date: null, signer: "" });
    setFiles((current) => current.filter((file) => file.kind === TICKET_MEDIA_KIND || file.kind === "other"));
  };

  const pick = async (kind, source) => {
    if (files.length >= TICKET_MAX_FILES) {
      Toast.show({ type: "error", text1: `Tối đa ${TICKET_MAX_FILES} tệp mỗi ticket` });
      return;
    }
    const picked = source === "image" ? await pickTicketImages({ kind }) : await pickTicketDocuments({ kind });
    setFiles((current) => [...current, ...picked].slice(0, TICKET_MAX_FILES));
  };

  const removeFile = (uri) => setFiles((current) => current.filter((file) => file.uri !== uri));

  const errors = {
    product: !productId && "Vui lòng chọn sản phẩm",
    type: !typeValue && "Vui lòng chọn vấn đề",
    title: !effectiveTitle.trim() && "Vui lòng nhập tiêu đề",
    fields: templateFields.some((field) => field.required && !String(customFields[field.key] ?? "").trim()),
    // Tờ trình đi theo đường riêng (thiếu thì ticket quay về cho người tạo bổ sung) nên không chặn — khớp web
    docs: docs.some(
      (doc) =>
        doc.required && doc.kind !== APPROVAL_DOCUMENT_KIND && !files.some((file) => file.kind === doc.kind),
    ),
    media: mediaRequired && !files.some((file) => file.kind === TICKET_MEDIA_KIND),
    assignment:
      (assignment.mode === "department" && !assignment.departmentId) ||
      (assignment.mode === "members" && assignment.members.length === 0),
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = async () => {
    setSubmitted(true);
    if (hasError) {
      Toast.show({ type: "error", text1: "Vui lòng điền đủ các mục bắt buộc" });
      return;
    }
    const hasCustomer = !isInternal && (customer.phone.trim() || customer.name.trim());
    const payload = {
      title: effectiveTitle.trim(),
      description: description.trim(),
      productId,
      categoryId,
      templateId: template?.id ?? null,
      customFields,
      urgency: effectiveUrgency,
      customer: hasCustomer
        ? {
            customerId: null,
            appCode: product?.appCode ?? null,
            phone: customer.phone.trim() || null,
            name: customer.name.trim() || null,
            externalId: null,
          }
        : null,
      relatedEmployeeId: isInternal ? (relatedEmployee[0]?.id ?? null) : null,
      assignment: showAssign ? assignmentPayloadOf(assignment) : undefined,
      relatedTicketIds: [],
      approvalReference: approvalRef.number.trim()
        ? {
            number: approvalRef.number.trim(),
            date: toIsoDate(approvalRef.date),
            signer: approvalRef.signer.trim(),
          }
        : null,
    };
    try {
      const created = await mutateAsync({ payload, files });
      Toast.show({ type: "success", text1: `Đã tạo ticket ${created?.code ?? ""}`.trim() });
      if (created?.id) router.replace({ pathname: "/tickets/[id]", params: { id: created.id } });
      else router.back();
    } catch (err) {
      Toast.show({ type: "error", text1: errorMessageOf(err, "Tạo ticket thất bại") });
    }
  };

  const errorText = (message) =>
    submitted && message ? <Text style={styles.errorText}>{message}</Text> : null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo ticket</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={TICKET_PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            <SheetField label="Sản phẩm" required>
              {Object.entries(productGroups).map(([group, items]) => (
                <View key={group} style={{ gap: 6 }}>
                  {Object.keys(productGroups).length > 1 && <Text style={styles.groupLabel}>{group}</Text>}
                  <View style={styles.chipRow}>
                    {items.map((item) => {
                      const active = item.id === productId;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => handleProduct(item.id)}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              {errorText(errors.product)}
            </SheetField>

            <SheetField label="Vấn đề" required>
              <OptionSelect
                value={typeValue}
                placeholder="Chọn loại yêu cầu hoặc mẫu"
                allowClear={false}
                options={typeOptions}
                onChange={handleType}
              />
              {errorText(errors.type)}
            </SheetField>

            {!!template?.guidance && <InfoNote>{template.guidance}</InfoNote>}

            {templateFields.map((field) => (
              <SheetField key={field.key} label={field.label} required={field.required} hint={field.help || undefined}>
                <DynamicField
                  field={field}
                  value={customFields[field.key]}
                  onChange={(value) => setCustomFields((current) => ({ ...current, [field.key]: value }))}
                />
                {errorText(
                  field.required && !String(customFields[field.key] ?? "").trim() && `Vui lòng nhập ${field.label.toLowerCase()}`,
                )}
              </SheetField>
            ))}

            <SheetField label="Tiêu đề" required>
              <TextInput
                value={effectiveTitle}
                onChangeText={(text) => {
                  setTitle(text);
                  setTitleTouched(true);
                }}
                placeholder="Tóm tắt vấn đề trong một câu"
                placeholderTextColor="#9CA3AF"
                style={[sheetInputStyle, styles.whiteInput]}
              />
              {errorText(errors.title)}
            </SheetField>

            <SheetField label="Mô tả">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Thời điểm, số tiền, khách đã làm gì…"
                placeholderTextColor="#9CA3AF"
                multiline
                style={[sheetInputStyle, styles.whiteInput, { minHeight: 88, textAlignVertical: "top" }]}
              />
            </SheetField>

            <SheetField
              label="Mức khẩn"
              hint={urgencyHint(
                TICKET_URGENCY_CONFIG[effectiveUrgency]?.description ?? "",
                effectiveUrgency,
                meta?.policy,
              )}
            >
              <View style={styles.urgencyRow}>
                {TICKET_URGENCIES.map((key) => {
                  const cfg = TICKET_URGENCY_CONFIG[key];
                  const active = key === effectiveUrgency;
                  return (
                    <TouchableOpacity
                      key={key}
                      disabled={Boolean(template)}
                      style={[
                        styles.urgency,
                        active && { backgroundColor: cfg.bg, borderColor: cfg.color },
                        template && !active && { opacity: 0.5 },
                      ]}
                      onPress={() => setUrgency(key)}
                    >
                      <Text style={[styles.urgencyText, active && { color: cfg.color }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {template && <Text style={styles.lockedText}>Mức khẩn theo mẫu đã chọn</Text>}
            </SheetField>

            {product && !isInternal && (
              <SheetField label="Khách hàng">
                <View style={styles.customerRow}>
                  <TextInput
                    value={customer.phone}
                    onChangeText={(phone) => setCustomer((current) => ({ ...current, phone }))}
                    placeholder="SĐT khách"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    style={[sheetInputStyle, styles.whiteInput, { flex: 1 }]}
                  />
                  <TextInput
                    value={customer.name}
                    onChangeText={(name) => setCustomer((current) => ({ ...current, name }))}
                    placeholder="Tên khách"
                    placeholderTextColor="#9CA3AF"
                    style={[sheetInputStyle, styles.whiteInput, { flex: 1.3 }]}
                  />
                </View>
              </SheetField>
            )}

            {isInternal && (
              <SheetField label="Nhân sự liên quan" hint="Người cần được hỗ trợ (nếu không phải bạn)">
                <EmployeePicker multiple={false} value={relatedEmployee} onChange={setRelatedEmployee} />
              </SheetField>
            )}

            {(docs.length > 0 || template?.requiresApproval) && (
              <SheetField label="Giấy tờ theo mẫu">
                {docs.map((doc) => {
                  const docFiles = files.filter((file) => file.kind === doc.kind);
                  return (
                    <View key={doc.kind} style={styles.docBox}>
                      <View style={styles.docHeader}>
                        <Ionicons
                          name={docFiles.length ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={docFiles.length ? "#15803D" : "#9CA3AF"}
                        />
                        <Text style={styles.docLabel}>
                          {doc.label}
                          {doc.required && doc.kind !== APPROVAL_DOCUMENT_KIND && (
                            <Text style={styles.required}> *</Text>
                          )}
                          {doc.sensitive && <Text style={styles.sensitive}> (nhạy cảm)</Text>}
                        </Text>
                      </View>
                      {docFiles.map((file) => (
                        <PickedFile key={file.uri} file={file} onRemove={() => removeFile(file.uri)} />
                      ))}
                      <AttachButtons compact onPick={(source) => pick(doc.kind, source)} />
                    </View>
                  );
                })}

                {template?.requiresApproval && (
                  <View style={styles.docBox}>
                    <View style={styles.docHeader}>
                      <Ionicons name="document-text-outline" size={20} color="#1D4ED8" />
                      <Text style={styles.docLabel}>Tờ trình phê duyệt</Text>
                    </View>
                    <Text style={styles.lockedText}>
                      Mẫu này cần tờ trình. Chưa có thì vẫn gửi được, người xử lý sẽ yêu cầu bạn bổ sung sau.
                    </Text>
                    <TextInput
                      value={approvalRef.number}
                      onChangeText={(number) => setApprovalRef((current) => ({ ...current, number }))}
                      placeholder="Số tờ trình, VD: TT-1025/2026"
                      placeholderTextColor="#9CA3AF"
                      style={[sheetInputStyle, styles.whiteInput]}
                    />
                    <View style={styles.customerRow}>
                      <View style={{ flex: 1 }}>
                        <TicketDateField
                          value={approvalRef.date}
                          placeholder="Ngày ký"
                          onChange={(date) => setApprovalRef((current) => ({ ...current, date }))}
                        />
                      </View>
                      <TextInput
                        value={approvalRef.signer}
                        onChangeText={(signer) => setApprovalRef((current) => ({ ...current, signer }))}
                        placeholder="Người ký"
                        placeholderTextColor="#9CA3AF"
                        style={[sheetInputStyle, styles.whiteInput, { flex: 1 }]}
                      />
                    </View>
                    {needsApprovalUpload && (
                      <>
                        {files
                          .filter((file) => file.kind === APPROVAL_DOCUMENT_KIND)
                          .map((file) => (
                            <PickedFile key={file.uri} file={file} onRemove={() => removeFile(file.uri)} />
                          ))}
                        <AttachButtons compact onPick={(source) => pick(APPROVAL_DOCUMENT_KIND, source)} />
                      </>
                    )}
                  </View>
                )}
                {errorText(errors.docs && "Vui lòng tải đủ giấy tờ bắt buộc")}
              </SheetField>
            )}

            <SheetField
              label="Ảnh / video lỗi, tài liệu khác"
              required={mediaRequired}
              hint={`Tối đa ${TICKET_MAX_FILES} tệp, mỗi tệp không quá 25MB`}
            >
              {freeFiles.map((file) => (
                <PickedFile key={file.uri} file={file} onRemove={() => removeFile(file.uri)} />
              ))}
              <View style={styles.attachRow}>
                <TouchableOpacity style={styles.attachBtn} onPress={() => pick(TICKET_MEDIA_KIND, "image")}>
                  <Ionicons name="image-outline" size={16} color="#BF360C" />
                  <Text style={styles.attachText}>Ảnh / video</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachBtn} onPress={() => pick("other", "file")}>
                  <Ionicons name="attach" size={16} color="#BF360C" />
                  <Text style={styles.attachText}>Tài liệu</Text>
                </TouchableOpacity>
              </View>
              {errorText(errors.media && "Vui lòng đính kèm ảnh / video lỗi")}
            </SheetField>

            {showAssign && (
              <View style={styles.assignBox}>
                <AssignmentFields value={assignment} onChange={setAssignment} me={meta?.me} />
                {assignment.mode === "none" && (
                  <Text style={styles.lockedText}>Để trống: người có quyền xử lý đều nhận được ticket</Text>
                )}
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <TouchableOpacity style={styles.submitBtn} disabled={isPending} onPress={submit}>
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Gửi ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: "#1A1D26" },
  form: { padding: 16, paddingBottom: 40, gap: 16 },
  groupLabel: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#FFF3EE", borderColor: TICKET_PRIMARY },
  chipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: "#BF360C" },
  whiteInput: { backgroundColor: "#FFFFFF" },
  urgencyRow: { flexDirection: "row", gap: 6 },
  urgency: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  urgencyText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  lockedText: { fontSize: 12, color: "#6B7280" },
  customerRow: { flexDirection: "row", gap: 8 },
  docBox: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  docHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  docLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: "#1A1D26" },
  required: { color: "#DC2626" },
  sensitive: { fontSize: 11, color: "#6B7280", fontWeight: "400" },
  attachRow: { flexDirection: "row", gap: 8 },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFF3EE",
  },
  attachText: { fontSize: 13, fontWeight: "700", color: "#BF360C" },
  assignBox: { gap: 12, padding: 12, borderRadius: 14, backgroundColor: "#FFFFFF" },
  errorText: { fontSize: 12, color: "#DC2626" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TICKET_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: TICKET_PRIMARY,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  submitText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
