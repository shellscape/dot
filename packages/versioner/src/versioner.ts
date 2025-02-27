import 'source-map-support';

import { dirname, join, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

import { getLog } from '@dot/log';
import parser from 'conventional-commits-parser';
import chalk from 'chalk';
import execa from 'execa';
import semver from 'semver';
import writePackage from 'write-pkg';
import yargs from 'yargs-parser';

const argv = yargs(process.argv.slice(2));
const {
  commitScopes = true,
  dry: dryRun,
  publish: doPublish,
  push: doPush,
  shortName: shortNameOverride,
  tag: doTag
} = argv;
const log = getLog({ brand: '@dot', name: '\u001b[1D/versioner' });
const parserOptions = {
  noteKeywords: ['BREAKING CHANGE', 'Breaking Change']
};
const reBreaking = new RegExp(`(${parserOptions.noteKeywords.join(')|(')})`);

type Commit = parser.Commit<string | number | symbol>;

interface BreakingCommit {
  breaking: boolean;
}

interface Notes {
  breaking: string[];
  features: string[];
  fixes: string[];
  updates: string[];
}

interface RepoPackage {
  [key: string]: any;
  name: string;
  version: string;
}

const commitChanges = async (cwd: string, shortName: string, version: string) => {
  const commitMessage = commitScopes
    ? `chore(release): ${shortName} v${version}`
    : `chore(release): v${version}`;

  if (dryRun) {
    log.warn(chalk`{yellow Skipping Git Commit}: ${commitMessage}`);
    return;
  }

  log.info(chalk`{blue Committing} CHANGELOG.md, package.json`);
  let params = ['add', cwd];
  await execa('git', params);

  params = ['commit', '--m', commitMessage];
  await execa('git', params);
};

const getCommits = async (shortName: string) => {
  const tagPattern = commitScopes ? `${shortName}-v*` : 'v*';

  log.info(chalk`{blue Gathering Commits for tags:} ${tagPattern}`);

  let params = ['tag', '--list', tagPattern, '--sort', '-v:refname'];

  const { stdout: tags } = await execa('git', params);
  const [latestTag] = tags.split('\n');

  log.info(chalk`{blue Last Release Tag}: ${latestTag || '<none>'}`);

  params = ['--no-pager', 'log', `${latestTag}..HEAD`, '--format=%B%n-hash-%n%H🐒💨🙊'];
  const individuals = `(([\\w-]+,)+)?${shortName}((,[\\w-]+)+)?`;
  const scopeExpression = commitScopes ? `\\((${individuals}|\\*)\\)` : '(.+)';
  const rePlugin = new RegExp(`^[\\w\\!]+${scopeExpression}`, 'i');
  let { stdout } = await execa('git', params);

  if (!stdout) {
    if (latestTag) params.splice(2, 1, `${latestTag}`);
    else params.splice(2, 1, 'HEAD');
    ({ stdout } = await execa('git', params));
  }

  const commits = stdout
    .split('🐒💨🙊')
    .filter((commit: string) => {
      const chunk = commit.trim();
      return chunk && rePlugin.test(chunk);
    })
    .map((commit) => {
      const node = parser.sync(commit, {
        // eslint-disable-next-line no-useless-escape
        headerPattern: /^(\w*)(?:\(([\w\$\.\-\*, ]*)\))?\:\s?(.*)$/
      });
      const body = (node.body || node.footer) as string;

      (node as unknown as BreakingCommit).breaking =
        reBreaking.test(body) || /!:/.test(node.header as string);

      return node;
    });

  return commits;
};

const getNewVersion = (version: string, commits: Commit[]): string | null => {
  log.info(chalk`{blue Determining New Version}`);
  const intersection = process.argv.filter((arg) =>
    ['--major', '--minor', '--patch'].includes(arg)
  );
  if (intersection.length) {
    // we found an edge case in the typescript-eslint plguin
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return semver.inc(version, intersection[0].substring(2) as semver.ReleaseType);
  }

  const types = new Set(commits.map(({ type }) => type));
  const breaking = commits.some((commit) => !!commit.breaking);
  const level = breaking ? 'major' : types.has('feat') || types.has('feature') ? 'minor' : 'patch';

  return semver.inc(version, level);
};

const getRepoUrls = async () => {
  try {
    const { stdout: remoteUrl } = await execa('git', ['config', '--get', 'remote.origin.url']);
    const match = remoteUrl.match(
      /(?:https:\/\/github\.com\/|git@github\.com:)(?<owner>[^/]+)\/(?<repo>[^.]+)(?:\.git)?/
    );
    if (!match?.groups) return null;
    const { owner, repo } = match.groups;
    return {
      commit: `https://github.com/${owner}/${repo}/commit`,
      // Note: github has a redirect from /issues to /pull for pull requests
      issue: `https://github.com/${owner}/${repo}/issues`
    };
  } catch (error) {
    return null;
  }
};

const publish = async (cwd: string) => {
  if (dryRun || doPublish === false) {
    log.warn(chalk`{yellow Skipping Publish}`);
    return;
  }

  log.info(chalk`\n{cyan Publishing to NPM}`);

  await execa('pnpm', ['publish', '--no-git-checks'], { cwd, stdio: 'inherit' });
};

const pull = async () => {
  if (dryRun || doPush === false) {
    log.warn(chalk`{yellow Skipping Git Pull and Rebase}`);
    return;
  }

  log.info(chalk`{blue Pulling Latest Changes from Remote and Rebasing}`);

  const { stdout: branches } = await execa('git', ['branch']);
  const main = branches.includes('main') ? 'main' : 'master';

  await execa('git', ['pull', 'origin', main, '--no-edit']);
  await execa('git', ['rebase', '--autostash']);
};

const push = async () => {
  if (dryRun || doPush === false) {
    log.warn(chalk`{yellow Skipping Git Push}`);
    return;
  }

  const { stdout: branches } = await execa('git', ['branch']);
  const main = branches.includes('main') ? 'main' : 'master';
  const params = ['push', 'origin', `HEAD:${main}`];

  log.info(chalk`{blue Pushing Release and Tags}`);
  await execa('git', params);
  await execa('git', [...params, '--tags']);
};

const tag = async (cwd: string, shortName: string, version: string) => {
  const prefix = commitScopes ? `${shortName}-` : '';
  const tagName = `${prefix}v${version}`;

  if (dryRun || doTag === false) {
    log.warn(chalk`{yellow Skipping Git Tag}: ${tagName}`);
    return;
  }

  log.info(chalk`\n{blue Tagging} {grey ${tagName}}`);
  await execa('git', ['tag', tagName], { cwd, stdio: 'inherit' });
};

const updateChangelog = async (
  commits: Commit[],
  cwd: string,
  targetName: string,
  shortName: string,
  version: string
) => {
  log.info(chalk`{blue Gathering Changes}`);

  const title = `# ${targetName} ChangeLog`;
  const [date] = new Date().toISOString().split('T');
  const logPath = join(cwd, 'CHANGELOG.md');
  const logFile = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '';
  const oldNotes = logFile.startsWith(title) ? logFile.slice(title.length).trim() : logFile;
  const notes: Notes = { breaking: [], features: [], fixes: [], updates: [] };
  const individuals = `(([\\w-]+,)+)?${shortName}((,[\\w-]+)+)?`;
  const reScope = new RegExp(`^[\\w\\!]+\\((${individuals}|\\*)\\)`, 'i');
  const reIssue = /\(#\d+\)/;
  const repoUrls = await getRepoUrls();

  for (const { breaking, hash, header, type } of commits) {
    const ref = header?.match(reIssue)?.[0] || `(${hash?.substring(0, 7)})`;
    const cleaned = header?.trim().replace(reScope, '$1').replace(ref, '').trim();
    const [, hashMark = '', linkRef] = ref.match(/\(([#])?(.+?)\)/)!;

    const link = repoUrls
      ? `([${hashMark}${linkRef}](${
          reIssue.test(ref) ? repoUrls.issue : repoUrls.commit
        }/${linkRef}))`
      : ref;
    const message = `${cleaned} ${link}`;

    if (breaking) {
      notes.breaking.push(message);
    } else if (type === 'fix') {
      notes.fixes.push(message);
    } else if (type === 'feat' || type === 'feature') {
      notes.features.push(message);
    } else {
      notes.updates.push(message);
    }
  }

  const parts = [
    `## v${version}`,
    `_${date}_`,
    notes.breaking.length ? `### Breaking Changes\n\n- ${notes.breaking.join('\n- ')}`.trim() : '',
    notes.fixes.length ? `### Bugfixes\n\n- ${notes.fixes.join('\n- ')}`.trim() : '',
    notes.features.length ? `### Features\n\n- ${notes.features.join('\n- ')}`.trim() : '',
    notes.updates.length ? `### Updates\n\n- ${notes.updates.join('\n- ')}`.trim() : ''
  ].filter(Boolean);

  const newLog = parts.join('\n\n');

  if (dryRun) {
    log.info(chalk`{blue New ChangeLog}:\n${newLog}`);
    return;
  }

  log.info(chalk`{blue Updating} CHANGELOG.md`);
  const content = [title, newLog, oldNotes].filter(Boolean).join('\n\n');
  writeFileSync(logPath, content, 'utf-8');
};

const updatePackage = async (cwd: string, pkg: RepoPackage, version: string) => {
  if (dryRun) {
    log.warn(chalk`{yellow Skipping package.json Update}`);
    return;
  }

  log.info(chalk`{blue Updating} package.json`);
  // eslint-disable-next-line no-param-reassign
  pkg.version = version;
  await writePackage(cwd, pkg);
};

(async () => {
  try {
    const cwd = argv.target;
    const stripScope: string[] = argv.stripScope?.split(',') || ['^@.+/'];

    const { name: targetName }: { name: string } = await import(join(cwd, 'package.json'));
    const shortName =
      shortNameOverride ||
      stripScope.reduce((prev, strip) => prev.replace(new RegExp(strip), ''), targetName);
    const parentDirName = dirname(resolve(cwd, '..'));

    if (!cwd || !existsSync(cwd)) {
      throw new RangeError(`Could not find directory for package: ${targetName} → ${cwd}`);
    }

    const pkgPath = join(cwd, 'package.json');
    const { default: pkg }: RepoPackage = await import(pkgPath);

    if (!pkg?.version) {
      throw new RangeError(`${pkgPath} doesn't contain a "version" property. please add one.`);
    }

    if (dryRun) {
      log.warn(chalk`{magenta DRY RUN}: No files will be modified`);
    }

    const from = chalk` from {grey ${parentDirName}/${targetName}}`;
    log.info(chalk`{cyan Releasing \`${targetName}\`}${from}\n`);
    log.info(chalk`{blue Target Short Name}: ${shortName}`);

    if (argv.stripScope)
      log.info(chalk`{blue Modifying Target Commit Scope} with: ${stripScope.toString()}`);

    const commits = await getCommits(shortName);

    if (!commits.length) {
      log.info(chalk`\n{red No Commits Found}. Did you mean to publish ${targetName}?`);
      return;
    }

    log.info(chalk`{blue Found} {bold ${commits.length}} Commits\n`);

    const newVersion = getNewVersion(pkg.version, commits) as string;

    log.info(chalk`{blue New Version}: ${newVersion}\n`);

    await updatePackage(cwd, pkg, newVersion);
    updateChangelog(commits, cwd, targetName, shortName, newVersion);
    await commitChanges(cwd, shortName, newVersion);
    // Note: We want to pull here in case there's an error, so nothing gets published
    await pull();
    await publish(cwd);
    await tag(cwd, shortName, newVersion);
    await push();
  } catch (e) {
    log.error(e);
    process.exit(1);
  }
})();
