import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>カードタイトル</CardTitle>
        </CardHeader>
        <CardContent>
          <p>カードのコンテンツがここに表示されます。動画の説明やメタデータなどを表示できます。</p>
        </CardContent>
      </>
    ),
  },
};

export const ContentOnly: Story = {
  args: {
    children: (
      <CardContent>
        <p>ヘッダーなしのカードコンテンツです。シンプルな情報表示に使用します。</p>
      </CardContent>
    ),
  },
};
