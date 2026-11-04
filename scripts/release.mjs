#!/usr/bin/env node
/**
 * One-command release for dsh-plugin-annotation.
 *
 *   node scripts/release.mjs patch        # 0.3.1 -> 0.3.2
 *   node scripts/release.mjs minor        # 0.3.1 -> 0.4.0
 *   node scripts/release.mjs major        # 0.3.1 -> 1.0.0
 *   node scripts/release.mjs 0.4.2        # explicit version
 *   node scripts/release.mjs patch --dry-run
 *
 * It bumps package.json, commits the release, pins that commit in the
 * plugin-market index under docs/, commits the index, and pushes both.
 * Nothing is published anywhere else: the market installs straight from the
 * pinned git commit, so pushing is the release.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const PACKAGE_FILE = join(ROOT, 'package.json')
const INDEX_FILE = join(ROOT, 'docs', 'index.json')
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/

/** Console line with a consistent prefix. */
function print(message) {
  console.log(`release: ${message}`)
}

/** Print a usage error and exit. */
function fail(message) {
  console.error(`release: ${message}`)
  process.exit(1)
}

/** Run git and return trimmed stdout. */
function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
}

/** Run git with the terminal attached (commits, pushes, hooks). */
function gitRun(...args) {
  execFileSync('git', args, { cwd: ROOT, stdio: 'inherit' })
}

/** The next version for a bump keyword or an explicit version. */
function resolveNext(from, spec) {
  if (SEMVER.test(spec)) return spec
  const match = SEMVER.exec(from)
  if (match === null) fail(`package.json version "${from}" is not semver`)
  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  if (spec === 'major') return `${major + 1}.0.0`
  if (spec === 'minor') return `${major}.${minor + 1}.0`
  if (spec === 'patch') return `${major}.${minor}.${patch + 1}`
  return fail(`expected patch, minor, major, or x.y.z — got "${spec}"`)
}

/** The repository's web URL, accepted from https or ssh remotes. */
function repoUrl() {
  let remote
  try {
    remote = git('remote', 'get-url', 'origin')
  } catch {
    fail('no "origin" remote is configured')
  }
  const ssh = /^git@([^:]+):(.+?)(?:\.git)?$/.exec(remote)
  if (ssh !== null) return `https://${ssh[1]}/${ssh[2]}`
  return remote.replace(/\.git$/, '')
}

const args = process.argv.slice(2).filter((arg) => arg !== '--dry-run')
const dryRun = process.argv.slice(2).includes('--dry-run')
if (args.length !== 1 || args[0].startsWith('-')) {
  fail('usage: node scripts/release.mjs <patch|minor|major|x.y.z> [--dry-run]')
}

const pkgText = readFileSync(PACKAGE_FILE, 'utf8')
const pkg = JSON.parse(pkgText)
const next = resolveNext(pkg.version, args[0])
if (next === pkg.version) fail(`version is already ${pkg.version}`)

const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
if (branch !== 'main') fail(`releases go from main; current branch is "${branch}"`)
if (git('status', '--porcelain') !== '') fail('working tree is not clean — commit or stash first')

const url = repoUrl()
const engines = pkg.engines?.dsh
print(`releasing ${pkg.version} -> ${next}${dryRun ? ' (dry run)' : ''}`)

if (dryRun) {
  print('would bump package.json, commit the release, then pin that commit in docs/index.json')
  process.exit(0)
}

// 1. Bump the manifest.
const bumped = pkgText.replace(/("version"\s*:\s*")[^"]+(")/, `$1${next}$2`)
if (bumped === pkgText) fail('could not rewrite the version field')
writeFileSync(PACKAGE_FILE, bumped)
gitRun('add', 'package.json')
gitRun('commit', '-m', `Release v${next}`)
const sha = git('rev-parse', 'HEAD')
print(`committed ${next} as ${sha.slice(0, 7)}`)

// 2. Pin that commit in the market index.
const index = JSON.parse(readFileSync(INDEX_FILE, 'utf8'))
const plugin = index.plugins.find((entry) => entry.name === pkg.name)
if (plugin === undefined) fail(`docs/index.json does not list "${pkg.name}"`)

plugin.versions = [
  {
    version: next,
    publishTimestamp: Math.floor(Date.now() / 1000),
    source: { type: 'git', url, commit: sha },
    ...(engines === undefined ? {} : { engines: { dsh: engines } }),
  },
  ...plugin.versions.filter((entry) => entry.version !== next),
]
writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`)
gitRun('add', 'docs/index.json')
gitRun('commit', '-m', `List ${next} in the market index`)
print('pinned it in docs/index.json')

// 3. Publish.
gitRun('push', 'origin', 'main')
print(`done — the market installs commit ${sha.slice(0, 7)} once Pages redeploys`)
print(`index: https://samuelraj-game.github.io/dsh-plugin-annotation/index.json`)
