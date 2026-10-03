import Icon from '@ant-design/icons'

const BrainSvg = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5a3 3 0 0 0-5.8-1A4 4 0 0 0 3 10a4 4 0 0 0 0 7 4 4 0 0 0 5 4 3 3 0 0 0 4-3Zm0 0a3 3 0 0 1 5.8-1A4 4 0 0 1 21 10a4 4 0 0 1 0 7 4 4 0 0 1-5 4 3 3 0 0 1-4-3Z" />
    <path d="M6.2 4C6 6 7 7 8 7m9.8-3C18 6 17 7 16 7M3 10c2-1 4 0 4 2m14-2c-2-1-4 0-4 2M8 21c-1-2 0-4 2-4m6 4c1-2 0-4-2-4" />
  </svg>
)

export default function BrainIcon() {
  return <Icon component={BrainSvg} />
}
