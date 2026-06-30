import { useCallback } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import WorkplaceDashboardScreen from "../../screens/workplace/WorkplaceDashboardScreen";
import WeeklyReportScreen from "../../screens/workplace/WeeklyReportScreen";
import InternalFilesScreen from "../../screens/workplace/InternalFilesScreen";
import FeedScreen from "../../screens/workplace/FeedScreen";
import ChatListScreen from "../../screens/workplace/chat/ChatListScreen";
import {
  getCurrentUserKeys,
  isCurrentUser,
  resolveConversationId,
} from "../../utils/chatUtils";
import CustomBottomTab from "./CustomBottomTab";

const Tab = createBottomTabNavigator();

export default function WorkPlaceBottomTab() {
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
    (routeName) => {
      if (routeName === "ChatScreen") return unreadCount;
      return 0;
    },
    [unreadCount],
  );

  return (
    <Tab.Navigator
      initialRouteName="WorkplaceDashboard"
      tabBar={(props) => <CustomBottomTab {...props} getBadge={getBadge} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="WorkplaceDashboard"
        component={WorkplaceDashboardScreen}
      />
      <Tab.Screen name="FeedScreen" component={FeedScreen} />
      <Tab.Screen name="ChatScreen" component={ChatListScreen} />
      <Tab.Screen name="WeeklyReportScreen" component={WeeklyReportScreen} />
      <Tab.Screen name="InternalFilesScreen" component={InternalFilesScreen} />
    </Tab.Navigator>
  );
}
