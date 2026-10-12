import { useEffect } from 'react'

/** 设置各页面浏览器标签标题 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} - DN42 联合自治政府`
      : 'DN42 联合自治政府门户网站'
  }, [title])
}
