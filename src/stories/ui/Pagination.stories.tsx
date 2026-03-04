import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pagination } from "@/components/ui/pagination";

const meta = {
  title: "UI/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    baseUrl: "/admin/videos",
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    baseUrl: "/admin/videos",
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    baseUrl: "/admin/videos",
  },
};

export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    baseUrl: "/admin/videos",
  },
};
