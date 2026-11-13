import React, { useEffect, useState } from "react";
import useTicketActionRunner from "../../hooks/useTicketActionRunner";
import EmployeePicker from "../EmployeePicker";
import TicketSheet, { SheetField } from "../TicketSheet";

const CollaboratorSheet = ({ visible, onClose, ticket }) => {
  const [picked, setPicked] = useState([]);
  const { run, isPending, error, setError } = useTicketActionRunner(ticket);

  useEffect(() => {
    if (!visible) return;
    setPicked([]);
    setError("");
  }, [visible]);

  const excludeIds = [
    ticket?.assignment?.owner?.id,
    ...(ticket?.assignment?.collaborators ?? []).map((item) => item.id),
  ].filter(Boolean);

  return (
    <TicketSheet
      visible={visible}
      onClose={onClose}
      icon="person-add-outline"
      iconColor="#059669"
      iconBg="#ECFDF5"
      title="Thêm người phối hợp"
      subtitle={ticket?.code}
      submitLabel="Thêm"
      onSubmit={() => run("collaborators", { employeeId: picked[0]?.id }, onClose)}
      submitting={isPending}
      submitDisabled={picked.length === 0}
      error={error}
      fullHeight
    >
      <SheetField
        label="Người phối hợp"
        required
        hint="Mời được người ở bất kỳ phòng ban nào. Người phối hợp có quyền xử lý như chủ trì."
      >
        <EmployeePicker multiple={false} value={picked} onChange={setPicked} excludeIds={excludeIds} />
      </SheetField>
    </TicketSheet>
  );
};

export default CollaboratorSheet;
