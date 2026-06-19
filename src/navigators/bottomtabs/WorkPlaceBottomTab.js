import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
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

      const seenBy = Array.isArray(lastMessage?.seenBy) ? lastMessage.seenBy : [];
      const isUnread = !seenBy.map(String).includes(String(user?._id ?? user?.id ?? ""));

      return isUnread ? count + 1 : count;
    }, 0);
  }, [activeConversationId, conversations, currentUserKeys, user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#ED2E30",
        tabBarInactiveTintColor: "gray",
        tabBarBadge:
          route.name === "ChatScreen" && unreadCount > 0 ? unreadCount : undefined,
        tabBarBadgeStyle:
          route.name === "ChatScreen"
            ? { backgroundColor: "#ED2E30", color: "#FFF", fontWeight: "700" }
            : undefined,
        tabBarIcon: ({ color, size }) => {
          let iconName = "home-outline";
          if (route.name === "WorkplaceDashboard")
            iconName = "business-outline";
          else if (route.name === "FeedScreen") iconName = "newspaper-outline";
          else if (route.name === "ChatScreen")
            iconName = "chatbubbles-outline";
          else if (route.name === "WeeklyReportScreen")
            iconName = "calendar-outline";
          else if (route.name === "InternalFilesScreen")
            iconName = "folder-open-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="WorkplaceDashboard"
        component={WorkplaceDashboardScreen}
        options={{ title: "Workplace" }}
      />
      <Tab.Screen
        name="FeedScreen"
        component={FeedScreen}
        options={{ title: "Bảng tin" }}
      />
      <Tab.Screen
        name="ChatScreen"
        component={ChatListScreen}
        options={{ title: "Chat" }}
      />
      <Tab.Screen
        name="WeeklyReportScreen"
        component={WeeklyReportScreen}
        options={{ title: "Báo cáo tuần" }}
      />
      <Tab.Screen
        name="InternalFilesScreen"
        component={InternalFilesScreen}
        options={{ title: "Ổ File" }}
      />
    </Tab.Navigator>
  );
}
