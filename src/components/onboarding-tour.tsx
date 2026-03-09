"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/styles/onboarding-tour.css";

type Props = {
  role: "org_admin" | "member";
  onComplete: () => void;
};

// --- org_admin: デスクトップ（サイドバー表示） ---
const orgAdminDesktopSteps = [
  {
    popover: {
      title: "Loguly へようこそ！",
      description:
        "組織の管理画面へようこそ。<br/>動画の管理、メンバーの招待、視聴状況の確認ができます。<br/><br/>簡単にご案内しますので、ぜひ最後までご覧ください。",
    },
  },
  {
    element: "#sidebar-nav",
    popover: {
      title: "サイドバーナビゲーション",
      description:
        "左側のメニューから各機能にアクセスできます。<br/>主な機能は <b>動画プレビュー</b>・<b>メンバー管理</b>・<b>視聴進捗</b>・<b>設定</b> の4つです。",
    },
  },
  {
    element: "#nav-videos",
    popover: {
      title: "動画プレビュー",
      description:
        "組織に割り当てられた動画を一覧で確認できます。<br/><br/>各動画にはラベルを設定でき、「必須」「推奨」などの分類でメンバーに分かりやすく伝えられます。",
    },
  },
  {
    element: "#nav-members",
    popover: {
      title: "メンバー管理",
      description:
        "メンバーの招待・削除ができます。<br/><br/>招待リンクを生成してメンバーに共有すると、簡単にアカウントを作成してもらえます。メールでの招待も可能です。",
    },
  },
  {
    element: "#nav-progress",
    popover: {
      title: "視聴進捗",
      description:
        "メンバー全員の視聴状況を一覧で確認できます。<br/><br/>誰がどの動画をどこまで見たか、完了済みかどうかが一目でわかります。研修の進捗管理に便利です。",
    },
  },
  {
    element: "#nav-settings",
    popover: {
      title: "組織設定",
      description:
        "組織名の変更や、現在の動画ライセンス情報を確認できます。",
    },
  },
  {
    element: "#org-header-actions",
    popover: {
      title: "アカウント操作",
      description:
        "歯車アイコンからアカウント設定（表示名・アバター変更）にアクセスできます。<br/>ダークモードの切り替えやログアウトもここから行えます。",
    },
  },
];

// --- org_admin: モバイル（サイドバー非表示） ---
const orgAdminMobileSteps = [
  {
    popover: {
      title: "Loguly へようこそ！",
      description:
        "組織の管理画面へようこそ。<br/>動画の管理、メンバーの招待、視聴状況の確認ができます。<br/><br/>簡単にご案内しますので、ぜひ最後までご覧ください。",
    },
  },
  {
    element: "#mobile-menu-btn",
    popover: {
      title: "メニュー",
      description:
        "このボタンをタップするとメニューが開きます。<br/><br/><b>動画プレビュー</b>・<b>メンバー管理</b>・<b>視聴進捗</b>・<b>設定</b> の4つの機能にアクセスできます。",
    },
  },
  {
    element: "#org-header-actions",
    popover: {
      title: "アカウント操作",
      description:
        "歯車アイコンからアカウント設定（表示名・アバター変更）にアクセスできます。<br/>ダークモードの切り替えやログアウトもここから行えます。",
    },
  },
];

// --- member: 共通（デスクトップ・モバイル両対応） ---
const memberSteps = [
  {
    popover: {
      title: "Loguly へようこそ！",
      description:
        "学習ダッシュボードへようこそ。<br/>ここでは研修動画を視聴し、学習の進捗を確認できます。<br/><br/>使い方を簡単にご案内します。",
    },
  },
  {
    element: "#progress-overview",
    popover: {
      title: "学習進捗",
      description:
        "あなたの全体的な学習進捗がここに表示されます。<br/><br/>視聴済みの動画数と、全体の完了率（%）がひと目でわかります。すべての動画を視聴して100%を目指しましょう！",
    },
  },
  {
    element: "#category-section",
    popover: {
      title: "カテゴリ別の動画一覧",
      description:
        "動画はカテゴリごとにまとめられています。<br/><br/>カテゴリをタップすると動画の一覧が展開されます。各動画の視聴状況（未視聴・視聴中・完了）も確認できます。",
    },
  },
  {
    element: "#dashboard-header-actions",
    popover: {
      title: "アカウント設定",
      description:
        "歯車アイコンから表示名やアバター画像の変更ができます。<br/>ダークモードの切り替えやログアウトもここから行えます。",
    },
  },
];

export default function OnboardingTour({ role, onComplete }: Props) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const isMobile = window.innerWidth < 1024;

      let steps;
      if (role === "org_admin") {
        steps = isMobile ? orgAdminMobileSteps : orgAdminDesktopSteps;
      } else {
        steps = memberSteps;
      }

      // 要素が存在するステップのみフィルタ（elementなしのウェルカムステップは常に含む）
      const validSteps = steps.filter(
        (s) => !("element" in s) || document.querySelector(s.element!)
      );
      if (validSteps.length === 0) {
        onComplete();
        return;
      }

      const d = driver({
        showProgress: true,
        animate: true,
        nextBtnText: "次へ",
        prevBtnText: "前へ",
        doneBtnText: "はじめる",
        progressText: "{{current}} / {{total}}",
        steps: validSteps,
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 12,
        onDestroyStarted: () => {
          onComplete();
          d.destroy();
        },
      });

      d.drive();
    }, 600);

    return () => clearTimeout(timeout);
  }, [role, onComplete]);

  return null;
}
