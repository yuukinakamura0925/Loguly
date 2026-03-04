import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeToggle } from "@/components/theme-toggle";

const meta = {
  title: "共通コンポーネント/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
