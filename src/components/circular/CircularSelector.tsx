import CircularNodeLinkPanel from "@/components/circular/CircularNodeLinkPanel";
import NodeLinkSelectorBase from "@/components/nodelink/NodeLinkSelectorBase";

export default function CircularSelector() {
  return (
    <NodeLinkSelectorBase
      PanelComponent={CircularNodeLinkPanel}
      downloadPrefix="Circular"
    />
  );
}
