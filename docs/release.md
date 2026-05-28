# Release Checklist

1. Confirm npm package ownership for `kkauto-skill`.
2. Run `npm install`.
3. Run `npm run typecheck`.
4. Run `npm test`.
5. Run `npm run build`.
6. Run `npm pack --dry-run` and inspect files.
7. Confirm README and docs contain no real tokens.
8. Confirm `package.json` has no `postinstall` script.
9. Publish with npm provenance when available.
10. Verify `npx kkauto-skill@latest --help` after publish.
