import type React from 'react'

export type NetworkSegmentedOption<T extends string | number> = {
  value: T
  label: React.ReactNode
}

export const createNetworkSegmentedOption = <T extends string | number>(
  value: T,
  icon: React.ReactNode,
  label: string,
): NetworkSegmentedOption<T> => ({
  value,
  label: (
    <span className="network-segmented-option">
      {icon}
      <span>{label}</span>
    </span>
  ),
})
