import { useState } from 'react'
import { shallowEqual } from 'react-redux'

// ponytail: shallow comparison covers flat settings; nested drafts supply their own comparator.
export function useSettingsDraft<T extends object>(
  applied: T,
  isEqual: (first: T, second: T) => boolean = shallowEqual,
) {
  const [state, setState] = useState({ baseline: applied, value: applied })
  const changedExternally = !isEqual(state.baseline, applied)
  const value = changedExternally ? applied : state.value

  // Reset during render so restored settings are visible immediately and old drafts cannot return.
  if (changedExternally) setState({ baseline: applied, value: applied })

  return {
    value,
    hasChanges: !isEqual(value, applied),
    set: (next: T) => setState({ baseline: applied, value: next }),
    patch: (changes: Partial<T>) => setState(current => ({
      baseline: applied,
      value: { ...(isEqual(current.baseline, applied) ? current.value : applied), ...changes },
    })),
    reset: () => setState({ baseline: applied, value: applied }),
  }
}
