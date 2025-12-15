/**
 * Versjonsinformasjon for samiske.no
 * Genereres automatisk ved hver build
 */

export interface VersionInfo {
  version: string
  buildTime: string
  gitCommit?: string
  gitBranch?: string
}

export function getVersionInfo(): VersionInfo {
  // Hent versjon fra package.json
  const packageVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'

  // Build timestamp (settes ved build-tid)
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()

  // Git informasjon fra Vercel
  const gitCommit = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  const gitBranch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF

  return {
    version: packageVersion,
    buildTime,
    gitCommit: gitCommit?.substring(0, 7), // Kort SHA
    gitBranch
  }
}

export function formatVersionString(): string {
  const { version, buildTime, gitCommit } = getVersionInfo()
  const date = new Date(buildTime)

  const formattedDate = date.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const formattedTime = date.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit'
  })

  let versionString = `v${version} (${formattedDate} ${formattedTime})`

  if (gitCommit) {
    versionString += ` • ${gitCommit}`
  }

  return versionString
}
