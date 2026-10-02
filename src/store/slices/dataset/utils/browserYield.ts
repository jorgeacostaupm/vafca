export const yieldToBrowser = () =>
  new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 0)
  })
