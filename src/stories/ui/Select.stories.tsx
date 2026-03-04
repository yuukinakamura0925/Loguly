import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "@/components/ui/select";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <option value="">選択してください</option>
        <option value="1">オプション1</option>
        <option value="2">オプション2</option>
        <option value="3">オプション3</option>
      </>
    ),
  },
};

export const WithLabel: Story = {
  args: {
    label: "カテゴリ",
    id: "category",
    children: (
      <>
        <option value="">選択してください</option>
        <option value="1">オプション1</option>
        <option value="2">オプション2</option>
        <option value="3">オプション3</option>
      </>
    ),
  },
};

export const WithError: Story = {
  args: {
    label: "カテゴリ",
    id: "category-error",
    error: "カテゴリを選択してください",
    children: (
      <>
        <option value="">選択してください</option>
        <option value="1">オプション1</option>
        <option value="2">オプション2</option>
        <option value="3">オプション3</option>
      </>
    ),
  },
};
