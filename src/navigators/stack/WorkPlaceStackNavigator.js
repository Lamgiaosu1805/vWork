import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkPlaceBottomTab from "../bottomtabs/WorkPlaceBottomTab";
import WorkplaceFileViewerScreen from "../../screens/workplace/WorkplaceFileViewerScreen";
import CommentScreen from "../../screens/workplace/CommentScreen";
import ComposePostScreen from "../../screens/workplace/ComposePostScreen";
import AnnouncementsScreen from "../../screens/workplace/AnnouncementsScreen";
import ProfileScreen from "../../screens/workplace/ProfileScreen";
import ChatRoomScreen from "../../screens/workplace/chat/ChatRoomScreen";
import GroupChatSettingsScreen from "../../screens/workplace/chat/GroupChatSettingsScreen";
import GroupMembersListScreen from "../../screens/workplace/chat/GroupMembersListScreen";

const Stack = createNativeStackNavigator();

export default function WorkPlaceStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkPlaceBottomTab" component={WorkPlaceBottomTab} />
      <Stack.Screen
        name="WorkplaceFileViewerScreen"
        component={WorkplaceFileViewerScreen}
      />
      <Stack.Screen name="FeedCommentScreen" component={CommentScreen} />
      <Stack.Screen name="ComposePostScreen" component={ComposePostScreen} />
      <Stack.Screen
        name="AnnouncementsScreen"
        component={AnnouncementsScreen}
      />
      <Stack.Screen name="WorkplaceProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="ChatRoomScreen" component={ChatRoomScreen} />
      <Stack.Screen
        name="GroupChatSettingsScreen"
        component={GroupChatSettingsScreen}
      />
      <Stack.Screen
        name="GroupMembersListScreen"
        component={GroupMembersListScreen}
      />
    </Stack.Navigator>
  );
}
