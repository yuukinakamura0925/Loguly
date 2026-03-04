import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchInput } from "@/components/ui/search-input";

const meta = {
  title: "UI/SearchInput",
  component: SearchInput,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomPlaceholder: Story = {
  args: {
    placeholder: "動画を検索...",
  },
};
