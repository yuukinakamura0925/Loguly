import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "動画管理",
  },
};

export const WithDescription: Story = {
  args: {
    title: "動画管理",
    description: "アップロードされた動画の一覧と管理を行います",
  },
};

export const WithAction: Story = {
  args: {
    title: "動画管理",
    description: "アップロードされた動画の一覧と管理を行います",
    action: <Button>新規追加</Button>,
  },
};
