import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

// Quay lại màn (từ chi tiết, tạo ticket...) thì tải lại những query vừa bị invalidate do có thao tác — chỉ những
// query đó, để quay về mà không đổi gì thì không tải lại cả danh sách nhiều trang. Bỏ qua lần focus đầu (query vừa tự tải).
const useRefetchStaleOnFocus = (queryKeys) => {
  const queryClient = useQueryClient();
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      queryKeys.forEach((queryKey) =>
        queryClient.refetchQueries({
          queryKey,
          type: "active",
          predicate: (query) => query.state.isInvalidated,
        }),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient]),
  );
};

export default useRefetchStaleOnFocus;
