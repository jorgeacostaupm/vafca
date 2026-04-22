import type { ReactNode } from "react";
import ResizableContainer from "@/components/layout/ResizableContainer";

type ViewPanelTemplateProps = {
  children: (size: { width: number; height: number }) => ReactNode;
};

export default function ViewPanelTemplate({ children }: ViewPanelTemplateProps) {
  return <ResizableContainer>{({ width, height }) => children({ width, height })}</ResizableContainer>;
}
