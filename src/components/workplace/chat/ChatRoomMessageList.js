import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MessageBubble from "./MessageBubble";
import DateSeparator from "./DateSeparator";
import { isCurrentUser, resolveMessageSender } from "../../../utils/chatUtils";

const ChatRoomMessageList = ({
  flatListRef,
  timelineItems,
  currentUserKeys,
  handleMessageLongPress,
  loadingMore,
  hasMore,
  loadMore,
  endReachedDuringMomentumRef,
  messages,
}) => {
  return (
    <FlatList
      contentContainerStyle={{ paddingHorizontal: 12 }}
      ref={flatListRef}
      data={timelineItems}
      inverted
      keyExtractor={(item, index) => String(item?.key) + index.toString()}
      renderItem={({ item }) => {
        if (item.type === "separator") {
          return <DateSeparator label={item.label} />;
        }
        if (item.message?.type === "system") {
          return (
            <View style={styles.systemWrap}>
              <Text style={styles.systemText}>{item.message.content}</Text>
            </View>
          );
        }

        const sender = resolveMessageSender(item.message);

        const isMine = isCurrentUser(currentUserKeys, sender);

        return (
          <MessageBubble
            item={item.message}
            sender={sender}
            isMine={isMine}
            onLongPress={() => handleMessageLongPress(item.message)}
          />
        );
      }}
      onMomentumScrollBegin={() => {
        endReachedDuringMomentumRef.current = false;
      }}
      onEndReached={() => {
        if (endReachedDuringMomentumRef.current || loadingMore || !hasMore) {
          return;
        }

        endReachedDuringMomentumRef.current = true;

        loadMore();
      }}
      onEndReachedThreshold={0.2}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator />
          </View>
        ) : !hasMore && messages.length > 0 ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã tải toàn bộ tin nhắn</Text>
          </View>
        ) : null
      }
    />
  );
};

export default ChatRoomMessageList;

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    paddingVertical: 12,
  },

  footerText: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  systemWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },

  systemText: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
