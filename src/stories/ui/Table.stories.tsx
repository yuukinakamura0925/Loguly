import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>田中 太郎</TableCell>
            <TableCell>tanaka@example.com</TableCell>
            <TableCell>管理者</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>鈴木 花子</TableCell>
            <TableCell>suzuki@example.com</TableCell>
            <TableCell>メンバー</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>佐藤 次郎</TableCell>
            <TableCell>sato@example.com</TableCell>
            <TableCell>メンバー</TableCell>
          </TableRow>
        </TableBody>
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty colSpan={3} message="データがありません" />
        </TableBody>
      </>
    ),
  },
};
