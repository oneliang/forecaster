import { Link, useLocation } from 'react-router-dom'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': '仪表板',
  '/projects': '项目管理',
}

export default function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const crumbs: { label: string; path: string }[] = []
  let currentPath = ''

  for (const segment of segments) {
    currentPath += `/${segment}`
    const label = ROUTE_LABELS[currentPath]
    if (label) {
      crumbs.push({ label, path: currentPath })
    } else if (currentPath.startsWith('/projects/')) {
      // For project detail, label will be set by parent (project name)
      // We just show the path segment as "项目详情" for now
      crumbs.push({ label: '项目详情', path: currentPath })
    }
  }

  if (crumbs.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link to="/dashboard" className="text-[#999] hover:text-[#667eea]">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#c5cae9] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          {i === crumbs.length - 1 ? (
            <span className="text-[#333] font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-[#999] hover:text-[#667eea]">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}
