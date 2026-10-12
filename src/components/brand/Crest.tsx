interface CrestProps {
  size?: number;
  className?: string;
}

/** 政府徽标：盾形 + 网络节点拓扑
 *  配色适配 GOV.UK 黑色页头：白色描线 + 黄色焦点节点。 */
export function Crest({ size = 40, className }: CrestProps) {
  return (
    <svg width={size} height={size * (72 / 64)} viewBox='0 0 64 72' role='img' aria-label='DN42 联合自治政府徽标' className={className}>
      <path d='M32 3 57 12v26c0 15-10.5 24.5-25 30C17.5 62.5 7 53 7 38V12Z' fill='none' stroke='#ffffff' strokeWidth='2.5' />
      <path d='M32 8.5 52 16v22c0 12.6-8.8 20.6-20 25.3C20.8 58.6 12 50.6 12 38V16Z' fill='none' stroke='#ffffff' strokeOpacity='.5' />
      <g stroke='#ffdd00' strokeWidth='2' fill='none'>
        <path d='M32 22 21 34m11-12 11 12M21 34l11 12m11-12-11 12' />
      </g>
      <g fill='#ffdd00'>
        <circle cx='32' cy='22' r='3.2' />
        <circle cx='21' cy='34' r='3.2' />
        <circle cx='43' cy='34' r='3.2' />
        <circle cx='32' cy='46' r='3.2' />
      </g>
    </svg>
  );
}
