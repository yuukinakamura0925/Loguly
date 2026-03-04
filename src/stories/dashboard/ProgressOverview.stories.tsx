import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressOverview } from "@/app/dashboard/components/progress-overview";

const meta = {
  title: "ダッシュボード/ProgressOverview",
  component: ProgressOverview,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ZeroProgress: Story = {
  args: {
    watchedSeconds: 0,
    totalSeconds: 3600,
    completedVideos: 0,
    totalVideos: 10,
  },
};

export const HalfProgress: Story = {
  args: {
    watchedSeconds: 1800,
    totalSeconds: 3600,
    completedVideos: 5,
    totalVideos: 10,
  },
};

export const Complete: Story = {
  args: {
    watchedSeconds: 3600,
    totalSeconds: 3600,
    completedVideos: 10,
    totalVideos: 10,
  },
};
