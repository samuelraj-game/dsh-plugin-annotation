# dsh-plugin-annotation

Select a passage in a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) response, write a comment about it, and stage it in a tray above the composer — then send every annotation together with whatever you write next.

## What it does

1. Select text anywhere in the conversation.
2. A **Comment** pill appears beside the selection; click it.
3. Type an optional comment and press **Enter** to stage it, or **Ctrl+Enter** to send immediately.

Staged annotations collect in a **tray above the composer**:

```
(2) annotations                                        [Send]
 1  "remove"                                     ✎  🗑
    are you sure?
 2  "the official 0.4.10 installer"              ✎  🗑
    no comment — sent as context
```

- Each annotation carries a **numbered pin** over the passage it came from, and the passage stays highlighted.
- Rows can be **edited** or **removed** before sending.
- A blank comment is allowed: the selection alone is staged, so it can stand as context or agreement for the prompt you are about to write.

Sending produces one message combining every annotation with your composer text:

```
Annotation 1:
> remove

are you sure?

Annotation 2:
> the official 0.4.10 installer

please also check the checksum
```

Because the staged blocks are mirrored into the composer draft, a normal **Enter in the composer** sends them too — they are part of the message, not a separate side channel.

## Keyboard

| Where | Key | Effect |
|---|---|---|
| Comment card | `Enter` | Stage in the tray |
| Comment card | `Ctrl`/`Cmd`+`Enter` | Stage and send now |
| Comment card | `Shift`+`Enter` | New line |
| Comment card | `Esc` | Cancel |
| Tray | `Send` | Send the tray plus the draft |

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
- Selections are tracked with `mouseup` / `keyup` / `selectionchange`; selections inside editable surfaces (the composer, inputs) are ignored.
- Staged annotations are serialized into numbered blocks and written into the composer through the stable `inputActions.setDraft` face; the user's own text is preserved by removing the previous blocks first. Sending uses the normal composer submit, so queue/steer policy, drafts, and undo all behave as usual.
- Annotated ranges are painted with the CSS Custom Highlight API (`::highlight(dsh-annotation)`) and numbered with a positioned overlay that re-measures on scroll, resize, and a light interval.
- Styles use the shell's design tokens (`--dsw-alias-*`), so light and dark themes both look native.
- No host-side behaviour: the node half is an empty `apply()`.

## Known limits

- Pins follow the live DOM range. If the transcript re-renders and detaches the range (for example a streaming message that replaces its nodes), the pin disappears while the annotation itself stays in the tray.
- If you delete a staged block by hand inside the composer, the tray row remains until the draft is sent or emptied.
- Annotations are not persisted across a page reload, because the draft is.

## Compatibility

Requires DSH `>= 0.2.1-rc.5`. The plugin uses only the shared platform modules (`react`, `react-dom`), so it needs no build step beyond the shipped bundle.

## Development

The repository is the published package; `lib/client.js` is hand-authored in the bundle format the client module system expects:

```js
window.__ModuleLoader__.load({ id: "dsh-plugin-annotation", factory: (require) => { /* ... */ } });
```

After changing it, copy `lib/client.js` into `<profile>/node_modules/dsh-plugin-annotation/lib/` and reload the app.

`docs/` holds the plugin-market index (`index.json` + `icons/`), published with GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `/docs`).

## License

MIT
