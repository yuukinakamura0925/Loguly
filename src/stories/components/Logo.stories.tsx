import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "@/components/logo";

const meta = {
  title: "共通コンポーネント/Logo",
  component: Logo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="bg-da-blue-900 p-8 rounded-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: "sm",
    showText: true,
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    showText: true,
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    showText: true,
  },
};

export const WithText: Story = {
  args: {
    size: "md",
    showText: true,
  },
};

export const WithoutText: Story = {
  args: {
    size: "md",
    showText: false,
  },
};
