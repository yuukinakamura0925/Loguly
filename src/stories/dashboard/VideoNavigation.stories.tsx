import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VideoNavigation from "@/app/watch/[id]/video-navigation";

const meta = {
  title: "ダッシュボード/VideoNavigation",
  component: VideoNavigation,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VideoNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBoth: Story = {
  args: {
    categoryName: "基礎研修",
    prevVideo: { id: 1, title: "研修動画1: はじめに" },
    nextVideo: { id: 3, title: "研修動画3: 応用編" },
  },
};

export const FirstVideo: Story = {
  args: {
    categoryName: "基礎研修",
    prevVideo: null,
    nextVideo: { id: 2, title: "研修動画2: 基本操作" },
  },
};

export const LastVideo: Story = {
  args: {
    categoryName: "基礎研修",
    prevVideo: { id: 2, title: "研修動画2: 基本操作" },
    nextVideo: null,
  },
};
