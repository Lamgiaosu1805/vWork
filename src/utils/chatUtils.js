import dayjs from "dayjs";

const resolveConversationId = (conversation) => conversation?._id ?? null;

const resolveMessageId = (message) =>
  message?._id ?? message?.clientMessageId ?? null;

const resolveSenderId = (message) => message?.senderId ?? null;

const resolveMessageText = (message) => message?.content ?? "";

const resolveTimestamp = (item) => {
  const value =
    item?.lastMessage?.createdAt ??
    item?.lastMessage?.updatedAt ??
    item?.createdAt ??
    item?.updatedAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

const sortMessages = (messages = []) =>
  [...messages].sort((a, b) => resolveTimestamp(a) - resolveTimestamp(b));

const sortConversations = (conversations = []) =>
  [...conversations].sort((a, b) => resolveTimestamp(b) - resolveTimestamp(a));

const isCurrentUser = (currentUserKeys, userInfo) => {
  if (!userInfo) return false;

  const senderKeys = [userInfo?._id, userInfo?.id_account]
    .filter(Boolean)
    .map(String);

  return senderKeys.some((key) => currentUserKeys.includes(key));
};

const getCurrentUserKeys = (user) =>
  [
    user?.userInfo?._id,
    user?.userInfo?.id_account,
    user?.id_account,
    user?.account?.id,
    user?.account?.user_id,
    user?.user_id,
    user?._id,
    user?.id,
  ]
    .filter(Boolean)
    .map(String);

const resolveConversationTitle = (conversation, currentUserKeys) => {
  if (!conversation) return "Cuộc trò chuyện";

  if (conversation?.display_name) return conversation.display_name;
  if (conversation?.name) return conversation.name;

  return "Cuộc trò chuyện";
};

const resolveMessageDayKey = (message) => {
  const value = message?.createdAt;
  return value ? dayjs(value).format("YYYY-MM-DD") : null;
};

const resolveDayLabel = (dateValue) => {
  if (!dateValue) return "";

  const messageDate = dayjs(dateValue);
  const today = dayjs().startOf("day");
  const diffDays = today.diff(messageDate.startOf("day"), "day");

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays === 2) return "Hôm kia";
  if (diffDays > 2 && diffDays < 7) {
    const weekday = messageDate.day();
    const labels = ["CN", "TH 2", "TH 3", "TH 4", "TH 5", "TH 6", "TH 7"];
    return labels[weekday] ?? messageDate.format("DD/MM/YYYY");
  }

  return messageDate.format("DD/MM/YYYY");
};

const buildTimelineItems = (messages = []) => {
  const timeline = [];
  messages.forEach((message, index) => {
    const dayKey = resolveMessageDayKey(message);
    const dayLabel = resolveDayLabel(message?.createdAt);
    const nextDayKey = resolveMessageDayKey(messages[index + 1]);

    timeline.push({
      type: "message",
      key: resolveMessageId(message),
      message,
    });

    if (dayKey && dayKey !== nextDayKey && dayLabel) {
      timeline.push({
        type: "separator",
        key: `separator_${dayKey}`,
        label: dayLabel,
      });
    }
  });

  return timeline;
};

const resolveMessageSender = (message) => message?.senderId ?? null;

const makeClientMessageId = () =>
  `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const resolveConversationAccountId = (conversation, currentUserKeys = []) => {
  if (!conversation) return null;

  if (conversation.accountId) return conversation.accountId;
  if (conversation.userInfo) {
    return (
      conversation.userInfo.id_account ?? conversation.userInfo._id ?? null
    );
  }

  // participants/members arrays
  const members = conversation.members ?? conversation.participants ?? [];
  if (!Array.isArray(members) || members.length === 0) {
    return conversation._id ?? null;
  }

  if (Array.isArray(currentUserKeys) && currentUserKeys.length > 0) {
    const other = members.find((m) => !isCurrentUser(currentUserKeys, m));
    return (
      other?.id_account ??
      other?._id ??
      other?.userInfo?._id ??
      conversation._id ??
      null
    );
  }

  const first = members[0];
  return first?.id_account ?? first?._id ?? conversation._id ?? null;
};

const resolveGroupAvatars = (conversation) => {
  const members = Array.isArray(conversation?.members)
    ? conversation.members
    : [];
  return members
    .filter((member) => member?._id)
    .slice(0, 4)
    .map((member) => ({
      id: String(member._id),
      filename: member.avatar,
      name: member.full_name,
      cacheKey: member.updatedAt ?? conversation?.updatedAt,
    }));
};

export {
  resolveConversationId,
  resolveMessageId,
  resolveMessageText,
  resolveSenderId,
  sortMessages,
  sortConversations,
  isCurrentUser,
  getCurrentUserKeys,
  resolveConversationTitle,
  buildTimelineItems,
  resolveMessageSender,
  makeClientMessageId,
  resolveConversationAccountId,
  resolveDayLabel,
  resolveMessageDayKey,
  resolveGroupAvatars,
};
