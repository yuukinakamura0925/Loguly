/**
 * Supabase client mock for Storybook
 * Provides chainable query builder that returns empty results by default
 */

function createQueryBuilder() {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "is",
    "in",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
    "filter",
    "match",
    "not",
    "or",
    "contains",
    "containedBy",
    "textSearch",
  ];

  for (const method of chainMethods) {
    builder[method] = () => builder;
  }

  // Terminal methods return mock data
  builder.then = (resolve: (value: { data: null; error: null }) => void) =>
    resolve({ data: null, error: null });

  return builder;
}

export function createMockSupabaseClient() {
  return {
    from: () => createQueryBuilder(),
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "mock-user-id",
            email: "test@example.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.com/storage/${path}` },
        }),
      }),
    },
  };
}
