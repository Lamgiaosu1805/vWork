import React, { useState } from "react";
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
import { resolveDisplayName } from "../../../hooks/workplace/useNicknameMap";
import SwipeToReplyMessage from "./SwipeToReplyMessage";
import ReactionModal from "./ReactionModal";

const getMessageSenderKey = (message) => {
  const sender = resolveMessageSender(message);
  return sender?._id ?? sender?.accountId ?? sender?.id ?? null;
};

const isGroupableItem = (item) =>
  !!item && item.type !== "separator" && item.message?.type !== "system";

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
  onPressImage,
  nicknameMap,
  conversation,
  user,
  onPressReplyPreview,
  onReply,
  onPressTagName,
}) => {
  const [modalReact, setModalReact] = useState({
    visiable: false,
    reactions: [],
  });
  const isGroup = conversation?.type === "group";

  const handleReactionSummary = (reactions) => {
    setModalReact({
      visiable: true,
      reactions,
    });
  };

  return (
    <>
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 12 }}
        ref={flatListRef}
        data={timelineItems}
        inverted
        keyExtractor={(item, index) => String(item?.key) + index.toString()}
        renderItem={({ item, index }) => {
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
          const senderKey = getMessageSenderKey(item.message);

          const belowItem = timelineItems[index - 1];
          const aboveItem = timelineItems[index + 1];

          const isLastInGroup =
            !isGroupableItem(belowItem) ||
            getMessageSenderKey(belowItem.message) !== senderKey;

          const isFirstInGroup =
            !isGroupableItem(aboveItem) ||
            getMessageSenderKey(aboveItem.message) !== senderKey;

          const showSenderName = !!isGroup && !isMine && isFirstInGroup;
          const displayName = showSenderName
            ? resolveDisplayName(
                nicknameMap,
                sender?._id,
                sender?.full_name ?? "Thành Viên",
              )
            : null;

          return (
            <MessageBubble
              item={item.message}
              sender={sender}
              isMine={isMine}
              onLongPress={(snapshot) => handleMessageLongPress(snapshot)}
              onPressImage={onPressImage}
              showAvatar={isLastInGroup}
              isLastInGroup={isLastInGroup}
              showSenderName={showSenderName}
              displayName={displayName}
              onPressReplyPreview={onPressReplyPreview}
              userInfo={user}
              nicknameMap={nicknameMap}
              onPressTagName={onPressTagName}
              onReply={onReply}
              onPressReactionSummary={(reactions) =>
                handleReactionSummary(reactions)
              }
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
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex?.({
              index: info.index,
              viewPosition: 0.5,
              animated: true,
            });
          }, 100);
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

      <ReactionModal
        modalVisible={modalReact.visiable}
        onClose={() => setModalReact({ visiable: false, reactions: [] })}
        reactions={modalReact.reactions}
      />
    </>
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
