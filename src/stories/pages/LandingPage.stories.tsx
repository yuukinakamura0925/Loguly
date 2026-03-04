import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Home from "@/app/page";

/**
 * ランディングページ（トップページ）
 *
 * シンプルなロゴ・キャッチコピー・ログインボタンで構成される静的ページ。
 * Server Component だが、非同期処理やデータ取得がないためそのままレンダリング可能。
 */
const meta = {
  title: "Pages/ランディングページ",
  component: Home,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示 */
export const Default: Story = {};
