import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import InviteForm from "@/app/org/members/invite-form";

/**
 * 招待フォーム（組織管理者用）
 *
 * 組織管理者がメンバーを招待するためのフォーム。
 * メールアドレスとロール（メンバー/組織管理者）を指定して招待を作成する。
 * 招待作成後は招待リンクをコピーできる画面に切り替わる。
 * Server Action `createInvitation` を使用。
 */
const meta = {
  title: "Pages/招待フォーム",
  component: InviteForm,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg mx-auto">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InviteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示（招待入力フォーム） */
export const Default: Story = {
  args: {
    onClose: fn(),
  },
};
