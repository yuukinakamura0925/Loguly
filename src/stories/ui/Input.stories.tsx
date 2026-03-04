import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
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
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "テキストを入力してください",
  },
};

export const WithLabel: Story = {
  args: {
    label: "メールアドレス",
    id: "email",
    type: "email",
    placeholder: "example@example.com",
  },
};

export const WithError: Story = {
  args: {
    label: "メールアドレス",
    id: "email-error",
    type: "email",
    placeholder: "example@example.com",
    error: "有効なメールアドレスを入力してください",
  },
};

export const Disabled: Story = {
  args: {
    label: "無効な入力",
    id: "disabled-input",
    placeholder: "入力できません",
    disabled: true,
  },
};
