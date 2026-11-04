window.__ModuleLoader__.load({
	id: "dsh-plugin-annotation",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");
		const ReactDOM = require("react-dom");
		const { useState, useEffect, useRef, useCallback } = React;
		const h = React.createElement;

		/** Plugin identity, used for the style tag and for debug logging. */
		const PLUGIN = "dsh-plugin-annotation";
		/** Longest quoted passage carried into the annotation message. */
		const MAX_QUOTE = 2000;

		const CSS = `
.dsh-annot-pill {
	position: fixed;
	z-index: 2147483000;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 32px;
	padding: 0 12px;
	border: 0;
	border-radius: 999px;
	font: 500 13px/1 var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
	background: var(--dsw-alias-label-primary, #111);
	color: var(--dsw-alias-bg-base, #fff);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
	cursor: pointer;
	transition: transform 120ms ease, box-shadow 120ms ease;
}
.dsh-annot-pill:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.34); }
.dsh-annot-pill:active { transform: translateY(0); }
.dsh-annot-pill svg { width: 14px; height: 14px; display: block; }

.dsh-annot-dialog {
	position: fixed;
	z-index: 2147483001;
	display: flex;
	flex-direction: column;
	gap: 10px;
	width: 380px;
	max-width: calc(100vw - 24px);
	padding: 14px;
	box-sizing: border-box;
	border-radius: 14px;
	border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.32));
	background: var(--dsw-alias-bg-layer-2, #1f1f1f);
	color: var(--dsw-alias-label-primary, #fff);
	box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
	font: 13px/1.45 var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
}
.dsh-annot-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	font-weight: 600;
	font-size: 13px;
}
.dsh-annot-close {
	border: 0;
	background: transparent;
	color: var(--dsw-alias-label-tertiary, rgba(140, 140, 140, 1));
	cursor: pointer;
	padding: 2px 4px;
	border-radius: 6px;
	font-size: 15px;
	line-height: 1;
}
.dsh-annot-close:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.16)); }
.dsh-annot-quote {
	margin: 0;
	padding: 8px 10px;
	border-left: 3px solid var(--dsw-alias-brand-primary, #4d6bfe);
	border-radius: 6px;
	background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.1));
	color: var(--dsw-alias-label-secondary, rgba(200, 200, 200, 1));
	font-size: 12px;
	line-height: 1.45;
	max-height: 84px;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	white-space: pre-wrap;
	word-break: break-word;
}
.dsh-annot-input {
	width: 100%;
	box-sizing: border-box;
	min-height: 76px;
	max-height: 220px;
	resize: vertical;
	padding: 9px 10px;
	border-radius: 9px;
	border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.32));
	background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.08));
	color: inherit;
	font: inherit;
	outline: none;
}
.dsh-annot-input:focus { border-color: var(--dsw-alias-brand-primary, #4d6bfe); }
.dsh-annot-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
}
.dsh-annot-hint { color: var(--dsw-alias-label-tertiary, rgba(150, 150, 150, 1)); font-size: 11px; }
.dsh-annot-actions { display: flex; gap: 8px; }
.dsh-annot-btn {
	border-radius: 8px;
	padding: 6px 12px;
	font: 500 12px/1.2 inherit;
	cursor: pointer;
	border: 1px solid transparent;
}
.dsh-annot-btn-ghost {
	background: transparent;
	border-color: var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.32));
	color: var(--dsw-alias-label-secondary, rgba(210, 210, 210, 1));
}
.dsh-annot-btn-ghost:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.16)); }
.dsh-annot-btn-primary {
	background: var(--dsw-alias-button-primary-fill, #4d6bfe);
	color: var(--dsw-alias-label-primary-foreground, #fff);
}
.dsh-annot-btn-primary:hover { background: var(--dsw-alias-button-primary-hover, #3f5ae0); }
.dsh-annot-btn-primary:disabled { opacity: 0.45; cursor: default; }
.dsh-annot-toast {
	position: fixed;
	left: 50%;
	bottom: 96px;
	transform: translateX(-50%);
	z-index: 2147483002;
	padding: 8px 14px;
	border-radius: 999px;
	background: var(--dsw-alias-toast-bg, rgba(28, 28, 28, 0.94));
	color: var(--dsw-alias-toast-label, #fff);
	font: 500 12px/1.3 var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	pointer-events: none;
}
`;

		/** Install the style tag once per page. */
		function installStyles() {
			if (document.querySelector('style[data-plugin="' + PLUGIN + '"]') !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = PLUGIN;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		/** Whether a node sits in an editable surface or in this plugin's own chrome. */
		function inEditable(node) {
			const element = node === null || node === undefined
				? null
				: node.nodeType === 1 ? node : node.parentElement;
			if (element === null || typeof element.closest !== "function") return false;
			return element.closest('input, textarea, [contenteditable="true"], [contenteditable=""], [data-dsh-annotation-ui]') !== null;
		}

		/** The live selection's text and viewport rectangle, or null when it is not annotatable. */
		function readSelection() {
			const selection = window.getSelection();
			if (selection === null || selection === undefined) return null;
			if (selection.isCollapsed || selection.rangeCount === 0) return null;
			const text = selection.toString().replace(/[ \t]+\n/g, "\n").trim();
			if (text.length < 2) return null;
			if (inEditable(selection.anchorNode) || inEditable(selection.focusNode)) return null;
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			if (rect.width === 0 && rect.height === 0) return null;
			return { text, rect };
		}

		/** Clamp a floating box of the given size near a selection rectangle. */
		function placeNear(rect, width, height) {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			let left = rect.right - width;
			if (left < 8) left = 8;
			if (left + width > vw - 8) left = Math.max(8, vw - width - 8);
			let top = rect.bottom + 10;
			if (top + height > vh - 8) top = rect.top - height - 10;
			if (top < 8) top = 8;
			return { left, top };
		}

		/** Build the message text an annotation submits: the quoted passage, then the comment. */
		function buildAnnotation(quote, comment) {
			const trimmed = quote.length > MAX_QUOTE ? quote.slice(0, MAX_QUOTE).trimEnd() + "â€¦" : quote;
			const quoted = trimmed
				.split("\n")
				.map((line) => (line.trim() === "" ? ">" : "> " + line.trim()))
				.join("\n");
			return "Annotation on this passage:\n\n" + quoted + "\n\n" + comment.trim();
		}

		const ICON = h(
			"svg",
			{ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
			h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
		);

		/**
		 * The annotation surface: a pill that appears beside a text selection, and the
		 * comment dialog it opens. Sending fills the composer through the Session's
		 * stable `inputActions` face and submits it when the composer was empty, so an
		 * annotation joins the conversation as an ordinary user message.
		 * @param props - the standard Session props supplied to a conversation slot entry.
		 * @returns the pill, dialog, and toast, portalled to the document body.
		 */
		function AnnotationOverlay(props) {
			const useInput = props.useInput;
			const inputActions = props.inputActions;
			const sendAnnotation = props.sendAnnotation;
			const input = typeof useInput === "function" ? useInput((state) => state) : undefined;
			const sessionId = props.sessionId;

			const [selection, setSelection] = useState(null);
			const [composing, setComposing] = useState(false);
			const [comment, setComment] = useState("");
			const [toast, setToast] = useState(null);

			const composingRef = useRef(false);
			const dialogRef = useRef(null);
			const textRef = useRef(null);
			const toastTimer = useRef(0);

			composingRef.current = composing;

			const showToast = useCallback((message) => {
				setToast(message);
				if (toastTimer.current !== 0) window.clearTimeout(toastTimer.current);
				toastTimer.current = window.setTimeout(() => setToast(null), 2800);
			}, []);

			useEffect(() => () => {
				if (toastTimer.current !== 0) window.clearTimeout(toastTimer.current);
			}, []);

			// Track the document selection while idle; a new selection replaces the pill.
			useEffect(() => {
				let timer = 0;
				const rescan = () => {
					if (composingRef.current) return;
					if (timer !== 0) window.clearTimeout(timer);
					timer = window.setTimeout(() => {
						if (composingRef.current) return;
						setSelection(readSelection());
					}, 12);
				};
				const dismiss = () => {
					if (composingRef.current) return;
					setSelection(null);
				};
				document.addEventListener("mouseup", rescan, true);
				document.addEventListener("keyup", rescan, true);
				document.addEventListener("selectionchange", rescan, true);
				window.addEventListener("scroll", dismiss, true);
				window.addEventListener("resize", dismiss);
				return () => {
					if (timer !== 0) window.clearTimeout(timer);
					document.removeEventListener("mouseup", rescan, true);
					document.removeEventListener("keyup", rescan, true);
					document.removeEventListener("selectionchange", rescan, true);
					window.removeEventListener("scroll", dismiss, true);
					window.removeEventListener("resize", dismiss);
				};
			}, []);

			const close = useCallback(() => {
				setComposing(false);
				setComment("");
				setSelection(null);
			}, []);

			// Escape closes the dialog from anywhere inside it.
			useEffect(() => {
				if (!composing) return undefined;
				const onKey = (event) => {
					if (event.key === "Escape") {
						event.stopPropagation();
						close();
					}
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey, true);
			}, [composing]);

			// A click outside the open dialog abandons the annotation.
			useEffect(() => {
				if (!composing) return undefined;
				const onDown = (event) => {
					const root = dialogRef.current;
					if (root !== null && root.contains(event.target)) return;
					close();
				};
				document.addEventListener("mousedown", onDown, true);
				return () => document.removeEventListener("mousedown", onDown, true);
			}, [composing]);

			useEffect(() => {
				if (!composing) return;
				const node = textRef.current;
				if (node !== null) node.focus();
			}, [composing]);

			// Last resort: fill the composer through its stable action face, so a
			// Session whose direct prompt is unavailable still receives the note.
			const viaComposer = (annotation) => {
				if (inputActions === undefined || inputActions === null) {
					showToast("Could not send the annotation");
					return false;
				}
				const draft = input !== undefined && typeof input.draft === "string" ? input.draft : "";
				const busyDraft = draft.trim() !== "" || (Array.isArray(input?.attachmentIds) && input.attachmentIds.length > 0);
				try {
					if (busyDraft) {
						// Never overwrite what the user already wrote: append and let them send.
						inputActions.setDraft(draft === "" ? annotation : draft.replace(/\s+$/, "") + "\n\n" + annotation);
						showToast("Annotation added to your draft");
					} else {
						inputActions.setDraft(annotation);
						window.setTimeout(() => {
							try {
								inputActions.submit();
							} catch (error) {
								console.error("[" + PLUGIN + "] submit failed", error);
								showToast("Could not send the annotation");
							}
						}, 20);
						showToast("Annotation sent");
					}
					return true;
				} catch (error) {
					console.error("[" + PLUGIN + "] annotation failed", error);
					showToast("Could not create the annotation");
					return false;
				}
			};

			const send = useCallback(() => {
				const text = comment.trim();
				if (selection === null || text === "") return;
				const annotation = buildAnnotation(selection.text, text);
				const done = () => {
					const live = window.getSelection();
					if (live !== null && live !== undefined) live.removeAllRanges();
					setComposing(false);
					setComment("");
					setSelection(null);
				};
				// Prefer the direct Session prompt: it never touches the user's draft
				// and needs no composer focus.
				if (typeof sendAnnotation === "function") {
					Promise.resolve()
						.then(() => sendAnnotation(annotation))
						.then(() => {
							showToast("Annotation sent");
							done();
						})
						.catch((error) => {
							console.error("[" + PLUGIN + "] direct send failed, using the composer", error);
							if (viaComposer(annotation)) done();
						});
					return;
				}
				if (viaComposer(annotation)) done();
			}, [comment, selection, sendAnnotation, inputActions, input, showToast]);

			const pill = selection !== null && !composing
				? h(
					"button",
					{
						type: "button",
						className: "dsh-annot-pill",
						"data-dsh-annotation-ui": "pill",
						title: "Annotate the selected text",
						style: placeNear(selection.rect, 112, 32),
						onMouseDown: (event) => event.preventDefault(),
						onClick: () => setComposing(true)
					},
					ICON,
					"Annotate"
				)
				: null;

			const dialog = composing && selection !== null
				? h(
					"div",
					{
						ref: dialogRef,
						className: "dsh-annot-dialog",
						"data-dsh-annotation-ui": "dialog",
						role: "dialog",
						"aria-label": "Annotate selection",
						style: placeNear(selection.rect, 380, 250)
					},
					h(
						"div",
						{ className: "dsh-annot-title" },
						h("span", null, "Annotate this passage"),
						h(
							"button",
							{ type: "button", className: "dsh-annot-close", title: "Cancel", onClick: close },
							"Ã—"
						)
					),
					h("blockquote", { className: "dsh-annot-quote" }, selection.text),
					h("textarea", {
						ref: textRef,
						className: "dsh-annot-input",
						placeholder: "What do you want to say about this?",
						value: comment,
						onChange: (event) => setComment(event.target.value),
						onKeyDown: (event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								send();
							}
						}
					}),
					h(
						"div",
						{ className: "dsh-annot-foot" },
						h("span", { className: "dsh-annot-hint" }, "Enter sends Â· Shift+Enter new line"),
						h(
							"div",
							{ className: "dsh-annot-actions" },
							h(
								"button",
								{ type: "button", className: "dsh-annot-btn dsh-annot-btn-ghost", onClick: close },
								"Cancel"
							),
							h(
								"button",
								{
									type: "button",
									className: "dsh-annot-btn dsh-annot-btn-primary",
									disabled: comment.trim() === "",
									onClick: send
								},
								"Send"
							)
						)
					)
				)
				: null;

			const notice = toast !== null
				? h("div", { className: "dsh-annot-toast", "data-dsh-annotation-ui": "toast" }, toast)
				: null;

			if (pill === null && dialog === null && notice === null) return null;
			if (typeof document === "undefined" || document.body === null) return null;
			return ReactDOM.createPortal(h(React.Fragment, null, pill, dialog, notice), document.body);
		}

		/** Required services: the UI slot registry and the Session controller. */
		const inject = ["slots", "sessions"];

		/**
		 * Client plugin body: install the styles and contribute the annotation surface
		 * to the composer's overlay slot, which the shell mounts once per Session. The
		 * entry's own inject binds the per-Session prompt so a comment is delivered as
		 * an ordinary user message without touching the composer draft.
		 * @param ctx - Client root context.
		 */
		function apply(ctx) {
			installStyles();
			ctx.slots.inject("conversation.input.overlay", () => ctx.slots.register({
				name: "conversation.input.overlay",
				id: "annotation",
				order: 5,
				inject: (sessionId) => ({
					sendAnnotation: (text) => {
						const scope = ctx.sessions.scope(sessionId);
						if (scope === undefined) throw new Error("annotation: session scope is not retained");
						return scope.conversation.send(text);
					}
				})
			}, AnnotationOverlay));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
