// ============================================================
// Storybook の Story ファイル
// ============================================================
// - 1ファイル = 1コンポーネントのカタログページ
// - ファイル名は必ず *.stories.tsx にする（自動で検出される）
// - 構成は大きく2つ:
//     ① meta (default export) = ページ全体の設定
//     ② Story (named export)  = propsの各バリエーション

// --- 型のインポート ---
// Meta:     metaの型（コンポーネント全体の設定）
// StoryObj: 各Storyの型
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// fn(): Actionsパネルにイベントログを表示するためのモック関数
// onClick等に渡しておくと、クリック時に「onClick called」とログが出る
import { fn } from "storybook/test";

// Storyの対象コンポーネント
import { Button } from "@/components/ui/button";

// ============================================================
// ① meta（default export）= このページ全体の設定
// ============================================================
// ここの設定は下の全Storyに共通で適用される
const meta = {

  // サイドバーの表示名。「/」で階層になる
  // "UI/ボタン" → サイドバーで UI > ボタン と表示
  title: "UI/ボタン",

  // 対象コンポーネント。指定すると:
  // - Controlsパネルにpropsが自動で出る
  // - Docsタブにpropsテーブルが生成される
  component: Button,

  parameters: {
    // レイアウト:
    //   'centered'   → 画面中央（ボタン等の小さいUI向き）
    //   'padded'     → 余白付き（テーブル等の幅広UI向き）
    //   'fullscreen' → 余白なし（ページ全体のレイアウト確認向き）
    layout: "centered",
  },

  // 'autodocs' → Docsタブを自動生成（全Storyの一覧+propsテーブル）
  tags: ["autodocs"],

  // 全Storyに共通で渡すデフォルトprops
  // 各Storyのargsとマージされる（各Story側が優先）
  args: {
    onClick: fn(),
  },

// satisfies で型チェック。間違ったprop名を書くとTSエラーになる
} satisfies Meta<typeof Button>;

// ↓ default export は必須。Storybookがこれを読んでページを構築する
export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// ② 各Story（named export）= propsの1バリエーション
// ============================================================
// - export const 名前: Story で定義
// - この「名前」がサイドバーのサブ項目になる
// - args にpropsを書くだけ。Controlsパネルでリアルタイム変更もできる

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "プライマリボタン",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "セカンダリボタン",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "ゴーストボタン",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "削除する",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "小さいボタン",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "大きいボタン",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "読み込み中...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "無効なボタン",
  },
};

// ============================================================
// まとめ: 新コンポーネントのStoryを作る時は
// ============================================================
// 1. このファイルをコピー
// 2. import を差し替え
// 3. meta の title と component を変更
// 4. 各Story の args を書き換え
// これだけ。
