import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LogoutButton from "@/app/dashboard/logout-button";
import { createMockSupabaseClient } from "../../../.storybook/mocks/supabase";

/**
 * ログアウトボタン
 *
 * ダッシュボードのヘッダー等に配置されるログアウトボタン。
 * Supabase Auth の `signOut` を呼び出し、ログインページへリダイレクトする。
 */
const meta = {
  title: "Pages/ログアウトボタン",
  component: LogoutButton,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      createMockSupabaseClient();
      return (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof LogoutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示 */
export const Default: Story = {};
