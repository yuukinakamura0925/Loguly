import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SettingsPage from "@/app/settings/page";
import { createMockSupabaseClient } from "../../../.storybook/mocks/supabase";

/**
 * アカウント設定ページ
 *
 * ユーザーのプロフィール（表示名）、パスワード変更、メールアドレス変更、
 * アカウント削除のフォームを含むクライアントコンポーネント。
 * Supabase Auth の `getUser` でユーザー情報を取得し、
 * Server Action でプロフィール更新・パスワード変更等を実行する。
 *
 * 注意: 初期表示時に Supabase からユーザー情報を取得するため、
 * モック環境では読み込み中の状態またはログインリダイレクトになる場合がある。
 */
const meta = {
  title: "Pages/アカウント設定",
  component: SettingsPage,
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
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示（モック環境では読み込み中状態） */
export const Default: Story = {};
