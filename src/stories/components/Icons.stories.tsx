import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  ChevronRightIcon,
  UsersIcon,
  BuildingIcon,
  TagIcon,
  VideoIcon,
  KeyIcon,
  ArrowLeftIcon,
  ClockIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  SettingsIcon,
} from "@/components/icons";

const icons = [
  { name: "PlusIcon", Icon: PlusIcon },
  { name: "PencilIcon", Icon: PencilIcon },
  { name: "TrashIcon", Icon: TrashIcon },
  { name: "CheckIcon", Icon: CheckIcon },
  { name: "XIcon", Icon: XIcon },
  { name: "ChevronRightIcon", Icon: ChevronRightIcon },
  { name: "UsersIcon", Icon: UsersIcon },
  { name: "BuildingIcon", Icon: BuildingIcon },
  { name: "TagIcon", Icon: TagIcon },
  { name: "VideoIcon", Icon: VideoIcon },
  { name: "KeyIcon", Icon: KeyIcon },
  { name: "ArrowLeftIcon", Icon: ArrowLeftIcon },
  { name: "ClockIcon", Icon: ClockIcon },
  { name: "FolderIcon", Icon: FolderIcon },
  { name: "ChevronDownIcon", Icon: ChevronDownIcon },
  { name: "ChevronUpIcon", Icon: ChevronUpIcon },
  { name: "CheckCircleIcon", Icon: CheckCircleIcon },
  { name: "SettingsIcon", Icon: SettingsIcon },
];

const meta = {
  title: "共通コンポーネント/Icons",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-6">
      {icons.map(({ name, Icon }) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <Icon className="w-6 h-6 text-da-gray-800" />
          <span className="text-xs text-da-gray-600">{name}</span>
        </div>
      ))}
    </div>
  ),
};
