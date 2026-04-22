import NodeLinkPanel from "@/components/nodelink/NodeLinkPanel";
import NodeLinkSelectorBase from "@/components/nodelink/NodeLinkSelectorBase";

export default function NodeLinkSelector() {
  return (
    <NodeLinkSelectorBase
      PanelComponent={NodeLinkPanel}
      downloadPrefix="Node-Link"
    />
  );
}
