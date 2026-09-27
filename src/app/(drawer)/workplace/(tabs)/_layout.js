import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Tabs } from "expo-router";
import CustomBottomTab from "../../../../navigators/bottomtabs/CustomBottomTab";
import {
  getCurrentUserKeys,
  isCurrentUser,
  resolveConversationId,
} from "../../../../utils/chatUtils";

export default function WorkplaceTabsLayout() {
  const user = useSelector((state) => state.auth.user);
  const conversations = useSelector((state) => state.chat.conversations);
  const activeConversationId = useSelector(
    (state) => state.chat.activeConversationId,
  );

  const currentUserKeys = useMemo(() => getCurrentUserKeys(user), [user]);

  const unreadCount = useMemo(() => {
    return (conversations ?? []).reduce((count, conversation) => {
      const conversationId = resolveConversationId(conversation);
      if (!conversationId) return count;
      if (
        activeConversationId &&
        String(activeConversationId) === String(conversationId)
      ) {
        return count;
      }

      const lastMessage = conversation?.lastMessage ?? null;
      if (!lastMessage) return count;

      const sender = lastMessage?.senderId;
      if (isCurrentUser(currentUserKeys, sender)) return count;

      const seenBy = Array.isArray(lastMessage?.seenBy)
        ? lastMessage.seenBy
        : [];
      const isUnread = !seenBy
        .map(String)
        .includes(String(user?._id ?? user?.id ?? ""));

      return isUnread ? count + 1 : count;
    }, 0);
  }, [activeConversationId, conversations, currentUserKeys, user]);

  const getBadge = useCallback(
    (routeName) => (routeName === "chat" ? unreadCount : 0),
    [unreadCount],
  );

  return (
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <CustomBottomTab {...props} getBadge={getBadge} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="weekly-report" />
      <Tabs.Screen name="internal-files" />
    </Tabs>
  );
}
