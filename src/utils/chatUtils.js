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

export {
  resolveConversationId,
  resolveMessageId,
  resolveMessageText,
  resolveSenderId,
  sortMessages,
  sortConversations,
  isCurrentUser,
  getCurrentUserKeys,
};
