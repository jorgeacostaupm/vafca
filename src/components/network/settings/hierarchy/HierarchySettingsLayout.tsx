import type { HierarchySettingsLayoutProps } from "./hierarchySettingsTypes";

export default function HierarchySettingsLayout({
  preview,
  children,
}: HierarchySettingsLayoutProps) {
  return (
    <div className="network-settings-hierarchy">
      <div className="network-settings-hierarchy__preview">{preview}</div>
      <div className="network-settings-hierarchy__form">{children}</div>
    </div>
  );
}
