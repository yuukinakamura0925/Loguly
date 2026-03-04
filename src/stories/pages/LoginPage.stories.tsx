import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import LoginPage from "@/app/login/page";
import { createMockSupabaseClient } from "../../../.storybook/mocks/supabase";

// Supabase client をモック化するデコレータ
const withSupabaseMock = () => {
  const mockClient = createMockSupabaseClient();

  // @ts-expect-error -- Storybook 環境でモジュールレベルの createClient を差し替え
  globalThis.__STORYBOOK_SUPABASE_MOCK__ = mockClient;

  return mockClient;
};

/**
 * メンバーログインページ
 *
 * メールアドレスとパスワードによるログインフォーム。
 * Supabase Auth の `signInWithPassword` を使用。
 * 管理者アカウントでログインした場合はエラーメッセージを表示する。
 */
const meta = {
  title: "Pages/メンバーログイン",
  component: LoginPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      withSupabaseMock();
      return <Story />;
    },
  ],
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示（空のフォーム） */
export const Default: Story = {};

/** エラー表示状態 */
export const WithError: Story = {
  play: async ({ canvasElement }) => {
    const { getByRole } = await import("@testing-library/dom");
    const { userEvent } = await import("@testing-library/user-event");

    const user = userEvent.setup();

    const emailInput = canvasElement.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = canvasElement.querySelector('input[type="password"]') as HTMLInputElement;

    if (emailInput && passwordInput) {
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
    }
  },
};
