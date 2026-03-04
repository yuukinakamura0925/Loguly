import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "@/components/ui/textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
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
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "テキストを入力してください",
    rows: 4,
  },
};

export const WithLabel: Story = {
  args: {
    label: "説明",
    id: "description",
    placeholder: "動画の説明を入力してください",
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: "説明",
    id: "description-error",
    placeholder: "動画の説明を入力してください",
    rows: 4,
    error: "説明は必須です",
  },
};
