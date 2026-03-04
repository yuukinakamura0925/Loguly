import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategorySection } from "@/app/dashboard/components/category-section";

const sampleVideos = [
  {
    id: 1,
    title: "研修動画1: はじめに",
    description: "基本的な使い方の説明",
    duration: 600,
  },
  {
    id: 2,
    title: "研修動画2: 基本操作",
    description: "操作方法の詳細",
    duration: 900,
  },
  {
    id: 3,
    title: "研修動画3: 応用編",
    description: null,
    duration: 1200,
  },
];

const sampleViewLogs = [
  {
    video_id: 1,
    max_watched_seconds: 600,
    completed: true,
  },
];

const meta = {
  title: "ダッシュボード/CategorySection",
  component: CategorySection,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[700px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategorySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultOpen: Story = {
  args: {
    name: "基礎研修",
    videos: sampleVideos,
    viewLogs: sampleViewLogs,
    progress: 33,
    defaultOpen: true,
  },
};

export const Collapsed: Story = {
  args: {
    name: "基礎研修",
    videos: sampleVideos,
    viewLogs: sampleViewLogs,
    progress: 33,
    defaultOpen: false,
  },
};
