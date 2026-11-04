# dsh-plugin-annotation

Select a passage in a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) response, write a comment about it, and stage it in a stack above the composer — then send every annotation together with whatever you write next.

## What it does

1. Select text anywhere in the conversation.
2. A **Comment** pill appears beside the selection; click it.
3. Type an optional comment and press **Enter** to stage it, or **Ctrl+Enter** to send only that annotation immediately.

Staged annotations stay **out of the composer draft**. They collect in a small
count pill above the composer:

```
[ 💬 2 annotations  (×) ]
```

Hover the pill to open the stack. The panel lists each annotation with its
quoted passage, your comment, and edit/remove actions:

```
2 annotations                                            [Send all]
 1  SELECTED TEXT
    "remove"
    USER COMMENT
    are you sure?
 2  SELECTED TEXT
    "the official 0.4.10 installer"
    USER COMMENT
    no comment
```

- Each annotation carries a **numbered pin** over the passage it came from; the passage stays highlighted.
- Hovering a row or its pin paints that passage with a stronger highlight.
- The panel is resizable vertically and matches the composer width.
- The **×** button appears when you hover the count pill and clears the whole stack.
- A blank comment is allowed: the selection alone is staged, so it can stand as context or agreement for the prompt you are about to write.
- **Ctrl+Enter** sends only the annotation you are drafting, even when other annotations are already staged.

Sending produces one message combining every annotation with your composer text:

```
Annotation 1:
> remove

are you sure?

Annotation 2:
> the official 0.4.10 installer

please also check the checksum
```

An ordinary **Enter** in the composer (or the composer's send button) sends the
staged stack with the draft, so annotations are part of the next message rather
than a separate side channel. They are not written into the text field while you
are composing.

## Keyboard

| Where | Key | Effect |
|---|---|---|
| Comment card | `Enter` | Stage in the stack |
| Comment card | `Ctrl`/`Cmd`+`Enter` | Send only this annotation now |
| Comment card | `Shift`+`Enter` | New line |
| Comment card | `Esc` | Cancel |
| Count pill | Hover | Open the stack |
| Count pill | `×` (on hover) | Clear the stack |
| Stack panel | `Send all` | Send the stack plus the draft |

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
- Staged annotations are kept in plugin state, not in the draft. When a message is sent, the stack is serialized into numbered blocks and sent with the draft through the normal composer submit (or through the Session conversation transport for a single annotation).
- An ordinary Enter or a click on the composer's primary send button is intercepted only when the stack is non-empty and the composer is in its plain phase, so command menus and other modes still behave normally.
- Annotated ranges are painted with the CSS Custom Highlight API (`::highlight(dsh-annotation)`), and the hovered annotation gets a second, stronger highlight; numbered pins re-measure on scroll, resize, and a light interval.
- Styles use the shell's design tokens (`--dsw-alias-*`), so light and dark themes both look native.
- No host-side behaviour: the node half is an empty `apply()`.

## Known limits

- Pins follow the live DOM range. If the transcript re-renders and detaches the range (for example a streaming message that replaces its nodes), the pin disappears while the annotation itself stays in the stack.
- Annotations are not persisted across a page reload, because they live in client state.
- Sending the stack while a draft has file attachments uses the composer submit path, so the composed annotation text is briefly written into the draft immediately before it is sent.

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
