import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VideoPlayer from "@/app/watch/[id]/video-player";
import { createMockSupabaseClient } from "../../../.storybook/mocks/supabase";

const mockVideo = {
  id: 1,
  title: "コンプライアンス研修 第1回 - 基礎編",
  description: "企業コンプライアンスの基礎を学ぶ研修動画です。法令遵守の重要性と日常業務における注意点を解説します。",
  duration: 600,
  cfVideoId: "mock-cf-video-id",
  categoryName: "コンプライアンス研修",
};

const mockVideoLong = {
  id: 2,
  title: "情報セキュリティ研修 - パスワード管理と二要素認証",
  description: "情報セキュリティの基本であるパスワード管理と二要素認証について解説します。",
  duration: 1800,
  cfVideoId: "mock-cf-video-id-2",
  categoryName: "情報セキュリティ",
};

/**
 * 動画プレイヤー
 *
 * スキップ制限付きの動画プレイヤーコンポーネント。
 * 未視聴区間へのシークを禁止し、90%視聴で完了扱いにする。
 * 30秒ごとに視聴進捗を Supabase へ自動保存する。
 *
 * 注意: Storybook 環境では実際の動画は再生されないが、
 * UI レイアウト（プログレスバー、動画情報、完了バッジ等）を確認できる。
 */
const meta = {
  title: "Pages/動画プレイヤー",
  component: VideoPlayer,
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      createMockSupabaseClient();
      return (
        <div className="max-w-4xl mx-auto bg-slate-100 dark:bg-slate-950 min-h-screen p-4">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 未視聴状態（進捗0%） */
export const Default: Story = {
  args: {
    video: mockVideo,
    initialProgress: {
      maxWatchedSeconds: 0,
      completed: false,
    },
    userId: "mock-user-id-001",
  },
};

/** 途中まで視聴済み（50%） */
export const HalfWatched: Story = {
  args: {
    video: mockVideo,
    initialProgress: {
      maxWatchedSeconds: 300,
      completed: false,
    },
    userId: "mock-user-id-001",
  },
};

/** 視聴完了状態 */
export const Completed: Story = {
  args: {
    video: mockVideo,
    initialProgress: {
      maxWatchedSeconds: 600,
      completed: true,
    },
    userId: "mock-user-id-001",
  },
};

/** 長時間動画（途中まで視聴） */
export const LongVideo: Story = {
  args: {
    video: mockVideoLong,
    initialProgress: {
      maxWatchedSeconds: 450,
      completed: false,
    },
    userId: "mock-user-id-001",
  },
};
