/**
 * query-client.js
 * -----------------------------------------------------------------------------
 * Single shared TanStack React Query client for the app. Imported by the
 * QueryClientProvider at the root and by AuthContext (which clears its cache on
 * auth changes), so it must be one stable instance.
 */
import { QueryClient } from '@tanstack/react-query';


// App-wide query defaults: don't refetch just because the window regained focus,
// and retry a failed query at most once before surfacing the error.
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});