import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CategoryAccordion from "@/app/org/progress/[userId]/category-accordion";

type VideoProgress = {
  id: number;
  title: string;
  duration: number;
  max_watched_seconds: number;
  completed: boolean;
  percent: number;
};

const mockVideosPartial: VideoProgress[] = [
  {
    id: 1,
    title: "コンプライアンス研修 第1回",
    duration: 600,
    max_watched_seconds: 600,
    completed: true,
    percent: 100,
  },
  {
    id: 2,
    title: "コンプライアンス研修 第2回",
    duration: 900,
    max_watched_seconds: 450,
    completed: false,
    percent: 50,
  },
  {
    id: 3,
    title: "コンプライアンス研修 第3回",
    duration: 720,
    max_watched_seconds: 0,
    completed: false,
    percent: 0,
  },
  {
    id: 4,
    title: "情報セキュリティ基礎",
    duration: 1200,
    max_watched_seconds: 300,
    completed: false,
    percent: 25,
  },
];

const mockVideosAllCompleted: VideoProgress[] = [
  {
    id: 1,
    title: "新入社員研修 第1回",
    duration: 600,
    max_watched_seconds: 600,
    completed: true,
    percent: 100,
  },
  {
    id: 2,
    title: "新入社員研修 第2回",
    duration: 900,
    max_watched_seconds: 900,
    completed: true,
    percent: 100,
  },
  {
    id: 3,
    title: "新入社員研修 第3回",
    duration: 480,
    max_watched_seconds: 480,
    completed: true,
    percent: 100,
  },
];

/**
 * カテゴリアコーディオン（視聴進捗）
 *
 * 組織管理者がメンバーの視聴進捗を確認する画面で使用。
 * カテゴリ単位で動画リストを折りたたみ表示する。
 * 各動画の視聴進捗バー、完了ステータス、視聴時間を表示。
 */
const meta = {
  title: "Pages/カテゴリアコーディオン",
  component: CategoryAccordion,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto p-4 bg-slate-100 dark:bg-slate-950 min-h-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 開いた状態（一部完了） */
export const DefaultOpen: Story = {
  args: {
    name: "コンプライアンス研修",
    videos: mockVideosPartial,
    defaultOpen: true,
  },
};

/** 閉じた状態 */
export const Collapsed: Story = {
  args: {
    name: "コンプライアンス研修",
    videos: mockVideosPartial,
    defaultOpen: false,
  },
};

/** 全動画完了 */
export const AllCompleted: Story = {
  args: {
    name: "新入社員研修",
    videos: mockVideosAllCompleted,
    defaultOpen: true,
  },
};
