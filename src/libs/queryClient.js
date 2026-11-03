import { QueryClient } from "@tanstack/react-query";

// Singleton để code ngoài component (handler push FCM...) invalidate được cache TanStack Query
export const queryClient = new QueryClient();

export default queryClient;
