# dsh-plugin-annotation

Select a passage in a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) response, write a comment about it, and send it into the conversation as an annotation — so you and the agent can keep talking about exactly that text.

## What it does

1. Select text anywhere in the conversation.
2. An **Annotate** pill appears next to the selection.
3. Click it, type your comment, press **Enter**.

The message that lands in the chat is:

```
Annotation on this passage:

> the text you selected

your comment
```

Because it is an ordinary user turn, the agent sees the quoted passage and your comment together, and the conversation continues normally.

## Install

### From a plugin market

Add this index source in **Plugins → Discover → Add index source**:

```
https://samuelraj-game.github.io/dsh-plugin-annotation/index.json
```

(Discover needs the experimental **Custom plugin markets** bundle switched on in **Plugins → More**.)

### From npm

```sh
dsh plugin install dsh-plugin-annotation
```

Or add the bundle in the app: **Plugins → Installed → Add bundle**, then pick `dsh-plugin-annotation`.

### As a profile bundle

This package is both a bundle and a plugin. The bundle patch (`cordis.patch.yml`) inserts its own row:

```yaml
- insert:
    - id: ui-annotation
      name: dsh-plugin-annotation
```

Adding `dsh-plugin-annotation` to the profile's `dsh.profile.bundles` (and installing the package) is enough — no hand-editing of `cordis.patch.yml`.

## How it works

- The browser half registers one entry in the `conversation.input.overlay` slot, which the shell mounts once per Session, so it is available in every conversation.
- Selecting text is tracked with `mouseup` / `keyup` / `selectionchange`; selections inside editable surfaces (the composer, inputs) are ignored.
- Sending uses the direct Session prompt — `ctx.sessions.scope(sessionId).conversation.send(text)` — so the composer draft is never touched and no send/queue arbitration is disturbed. If that path is unavailable it falls back to filling the composer through its stable `inputActions` face, appending to an existing draft rather than overwriting it.
- Styles are injected as one `<style data-plugin="dsh-plugin-annotation">` tag and use the shell's design tokens (`--dsw-alias-*`), so light and dark themes both look native.
- No host-side behaviour: the node half is an empty `apply()`.

## Compatibility

Requires DSH `>= 0.2.1-rc.5`. The plugin uses only the shared platform modules (`react`, `react-dom`), so it needs no build step beyond the shipped bundle.

## Development

The repository is the published package; `lib/client.js` is hand-authored in the bundle format the client module system expects:

```js
window.__ModuleLoader__.load({ id: "dsh-plugin-annotation", factory: (require) => { /* ... */ } });
```

After changing it, copy `lib/client.js` into `<profile>/node_modules/dsh-plugin-annotation/lib/` and reload the app.

`site/` holds the plugin-market index (`index.json` + `icons/`) published with GitHub Pages.

## License

MIT
