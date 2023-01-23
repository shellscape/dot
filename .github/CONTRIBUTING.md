## Contributing

We 💛 contributions! The rules for contributing to this org are few:

1. Don't be a jerk
1. Search issues before opening a new one
1. Lint and run tests locally before submitting a PR
1. Adhere to the code style the org has chosen


## Before Committing

1. Use at least Node.js v18 or higher. [NVM](https://github.com/creationix/nvm) can be handy for switching between Node versions.
1. Lint your changes via `pnpm lint`. Fix any errors and warnings before committing.
1. Test your changes via `pnpm -r test`. Only Pull Requests with passing tests will be accepted.

### Commits

Commits in this repository are expected to follow the [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/). Since commits are used to generate CHANGELOGs for the packages in this repository and control version-release flows, each commit that affects a particular package must have a scope matching that pacakge's name. e.g. `fix(batman): broken riddle` will match the `@dot/batman` a package located at `packages/batman` in the repository.

To affect multiple packages in one commit, use a comma to delimit package names in the commit scope. e.g. `fix(batman,robin): batcave permissions.`

### Pull Requests

Pull Requests should ideally be limited to affect one package, but there may be situations where more than one package needs changes. PR merges should use _Squash Merge_.

### Adding Dependencies

Much like `yarn`, `pnpm add {dependency-name}` will add a dependency to a package.

However, because this is a monorepo, dependencies aren't frequently added to the repo root. Instead, move to the target package directory and run `pnpm add` there. e.g.

```console
cd packages/batman
pnpm add del-cli --save-dev
```

If the rare need arises to add or update a dependency in all packages in the repository, a recursive add may be performed. e.g.

```console
$ pnpm add typescript --recursive
```

To add a package to the repo root, use the `-D -W` flags, which instruct `pnpm` to save to `devDependencies` and target the "workspace root." Root packages should always be installed to `devDependencies`.

## Package Scripts

All packages in this monorepo share the same set of scripts, and similar functionality between packages can be expected.

Scripts can be run from the respective `packages/*` directories using `pnpm {script name}`, or from the monorepo root directory using `pnpm {script-name} --filter {package-name}` to target specific packages.
