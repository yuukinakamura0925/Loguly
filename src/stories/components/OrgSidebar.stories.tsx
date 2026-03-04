import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import OrgSidebar from "@/components/org-sidebar";

const meta = {
  title: "共通コンポーネント/OrgSidebar",
  component: OrgSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/org/members",
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
} satisfies Meta<typeof OrgSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    orgName: "テスト組織",
  },
};
