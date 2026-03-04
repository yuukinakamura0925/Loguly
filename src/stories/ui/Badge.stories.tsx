import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    children: "デフォルト",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "完了",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "注意",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "エラー",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    children: "情報",
  },
};
