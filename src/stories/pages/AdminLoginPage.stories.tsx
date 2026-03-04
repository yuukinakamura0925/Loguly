import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AdminLoginPage from "@/app/admin-login/page";
import { createMockSupabaseClient } from "../../../.storybook/mocks/supabase";

/**
 * 管理者ログインページ
 *
 * プラットフォーム管理者・組織管理者専用のログインフォーム。
 * 一般メンバーがログインした場合はエラーメッセージを表示する。
 */
const meta = {
  title: "Pages/管理者ログイン",
  component: AdminLoginPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      createMockSupabaseClient();
      return <Story />;
    },
  ],
} satisfies Meta<typeof AdminLoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示（空のフォーム） */
export const Default: Story = {};
