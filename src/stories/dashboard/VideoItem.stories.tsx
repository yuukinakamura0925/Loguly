import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VideoItem } from "@/app/dashboard/components/video-item";

const meta = {
  title: "ダッシュボード/VideoItem",
  component: VideoItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    id: 1,
    title: "研修動画1: はじめに",
    description: "基本的な使い方の説明",
    duration: 600,
    status: "pending",
    progress: 0,
  },
};

export const InProgress: Story = {
  args: {
    id: 2,
    title: "研修動画2: 基本操作",
    description: "操作方法の詳細",
    duration: 900,
    status: "in-progress",
    progress: 45,
  },
};

export const Completed: Story = {
  args: {
    id: 3,
    title: "研修動画3: 応用編",
    description: "応用的な内容の解説",
    duration: 1200,
    status: "completed",
    progress: 100,
  },
};
