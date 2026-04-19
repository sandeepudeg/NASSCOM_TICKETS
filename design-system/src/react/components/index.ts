// Export all custom components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input, TextArea } from './Input';
export type { InputProps } from './Input';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Navigation, NavItem, NavLink, Breadcrumb, BreadcrumbItem } from './Navigation';
export type { NavigationProps, NavItemProps, NavLinkProps, BreadcrumbProps, BreadcrumbItemProps } from './Navigation';

export { Container } from './Container';
export type { ContainerProps } from './Container';

export { Grid, GridItem } from './Grid';
export type { GridProps, GridItemProps } from './Grid';

export { Stack } from './Stack';
export type { StackProps } from './Stack';

export { Flex } from './Flex';
export type { FlexProps } from './Flex';

export { Alert } from './Alert';
export type { AlertProps } from './Alert';

export { toast, msg } from './Toast';
export type { ToastOptions, MessageOptions } from './Toast';

export { Loading, SkeletonLoading as Skeleton } from './Loading';
export type { LoadingProps, SkeletonLoadingProps as SkeletonProps } from './Loading';

export { Badge, StatusBadge } from './Badge';
export type { BadgeProps, StatusBadgeProps } from './Badge';

// Re-export commonly used Ant Design components with consistent naming
export {
  Space,
  Row,
  Col,
  Grid as AntdGrid, // Rename to avoid conflict with our Grid
  Layout,
  Menu,
  Breadcrumb as AntdBreadcrumb, // Rename to avoid conflict with our Breadcrumb
  Pagination,
  Steps,
  AutoComplete,
  Cascader,
  Checkbox,
  DatePicker,
  Form,
  InputNumber,
  Mentions,
  Radio,
  Rate,
  Select,
  Slider,
  Switch,
  TimePicker,
  Transfer,
  TreeSelect,
  Upload,
  Avatar,
  Badge as AntdBadge, // Rename to avoid conflict with our Badge
  Calendar,
  Carousel,
  Collapse,
  Descriptions,
  Empty,
  Image,
  List,
  Popover,
  Segmented,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Tree,
  Alert as AntdAlert, // Rename to avoid conflict with our Alert
  Drawer,
  message,
  Modal as AntdModal, // Rename to avoid conflict with our Modal
  notification,
  Popconfirm,
  Progress,
  Result,
  Skeleton as AntdSkeleton,
  Spin,
  Anchor,
  BackTop,
  ConfigProvider,
  Divider,
  FloatButton,
  QRCode,
  Watermark,
  Tour,
  Typography,
} from 'antd';

// Export Ant Design types
export type {
  SpaceProps,
  RowProps,
  ColProps,
  LayoutProps,
  MenuProps,
  BreadcrumbProps as AntdBreadcrumbProps, // Rename to avoid conflict with our Breadcrumb
  PaginationProps,
  StepsProps,
  AutoCompleteProps,
  CascaderProps,
  CheckboxProps,
  DatePickerProps,
  FormProps,
  InputNumberProps,
  MentionsProps,
  RadioProps,
  RateProps,
  SelectProps,
  SwitchProps,
  TimePickerProps,
  TransferProps,
  TreeSelectProps,
  UploadProps,
  AvatarProps,
  BadgeProps as AntdBadgeProps,
  CalendarProps,
  CarouselProps,
  CollapseProps,
  DescriptionsProps,
  EmptyProps,
  ImageProps,
  ListProps,
  PopoverProps,
  SegmentedProps,
  StatisticProps,
  TableProps,
  TabsProps,
  TagProps,
  TimelineProps,
  TooltipProps,
  TreeProps,
  AlertProps as AntdAlertProps,
  DrawerProps,
  ModalProps as AntdModalProps,
  PopconfirmProps,
  ProgressProps,
  ResultProps,
  SkeletonProps as AntdSkeletonProps,
  SpinProps,
  AnchorProps,
  ConfigProviderProps,
  DividerProps,
  FloatButtonProps,
  QRCodeProps,
  WatermarkProps,
  TourProps,
  TypographyProps,
} from 'antd';