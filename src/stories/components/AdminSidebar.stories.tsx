import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AdminSidebar from "@/components/admin-sidebar";

const meta = {
  title: "共通コンポーネント/AdminSidebar",
  component: AdminSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/admin",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
