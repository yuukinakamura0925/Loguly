import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SignupForm from "@/app/invite/[token]/signup-form";
import { createMockSupabaseClient } from "../../../.storybook/mocks/supabase";

/**
 * サインアップフォーム（招待受諾）
 *
 * 招待リンクからアクセスした際に表示されるアカウント作成フォーム。
 * メールアドレスは招待情報から自動設定され変更不可。
 * Supabase Auth の `signUp` と Server Action `acceptInvitation` を使用。
 */
const meta = {
  title: "Pages/サインアップフォーム",
  component: SignupForm,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      createMockSupabaseClient();
      return (
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            アカウント作成
          </h1>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示（招待メールアドレス付き） */
export const Default: Story = {
  args: {
    email: "test@example.com",
    token: "abc123-mock-token",
  },
};

/** 別のメールアドレスでの招待 */
export const DifferentEmail: Story = {
  args: {
    email: "yamada.taro@company.co.jp",
    token: "xyz789-mock-token",
  },
};
