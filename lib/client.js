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
		/** Longest quoted passage carried into one annotation block. */
		const MAX_QUOTE = 2000;
		/** Name of the CSS Custom Highlight registration for annotated ranges. */
		const HIGHLIGHT = "dsh-annotation";

		const CSS = `
::highlight(dsh-annotation) {
	background-color: color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 26%, transparent);
	color: inherit;
}

.dsh-annot-pill {
	position: fixed;
	z-index: 2147483000;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 30px;
	padding: 0 11px;
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
.dsh-annot-pill svg { width: 13px; height: 13px; display: block; }

.dsh-annot-pin {
	position: fixed;
	z-index: 2147482990;
	min-width: 18px;
	height: 18px;
	padding: 0 4px;
	box-sizing: border-box;
	border-radius: 999px;
	background: var(--dsw-alias-brand-primary, #4d6bfe);
	color: #fff;
	font: 600 11px/18px var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
	text-align: center;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	pointer-events: none;
}

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
	min-height: 70px;
	max-height: 200px;
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

.dsh-annot-tray {
	position: fixed;
	z-index: 2147482985;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 8px;
	border-radius: 12px;
	border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.32));
	background: var(--dsw-alias-bg-layer-2, #1f1f1f);
	color: var(--dsw-alias-label-primary, #fff);
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
	font: 12px/1.4 var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
}
.dsh-annot-tray-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
}
.dsh-annot-tray-title {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border: 0;
	background: transparent;
	color: inherit;
	font: 600 12px/1.4 inherit;
	cursor: pointer;
	padding: 2px 4px;
	border-radius: 6px;
}
.dsh-annot-tray-title:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.16)); }
.dsh-annot-tray-count {
	min-width: 17px;
	height: 17px;
	padding: 0 4px;
	box-sizing: border-box;
	border-radius: 999px;
	background: var(--dsw-alias-brand-primary, #4d6bfe);
	color: #fff;
	font-size: 11px;
	line-height: 17px;
	text-align: center;
}
.dsh-annot-row {
	display: grid;
	grid-template-columns: 20px minmax(0, 1fr) 44px;
	gap: 8px;
	align-items: start;
	padding: 6px;
	border-radius: 8px;
	background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.08));
}
.dsh-annot-row-num {
	width: 20px;
	height: 20px;
	border-radius: 999px;
	background: var(--dsw-alias-brand-primary, #4d6bfe);
	color: #fff;
	font-size: 11px;
	font-weight: 600;
	line-height: 20px;
	text-align: center;
}
.dsh-annot-row-body { min-width: 0; }
.dsh-annot-row-quote {
	color: var(--dsw-alias-label-secondary, rgba(210, 210, 210, 1));
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.dsh-annot-row-comment {
	color: var(--dsw-alias-label-primary, #fff);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin-top: 2px;
}
.dsh-annot-row-comment.is-empty { color: var(--dsw-alias-label-tertiary, rgba(150, 150, 150, 1)); font-style: italic; }
.dsh-annot-row-tools { display: flex; gap: 2px; justify-content: flex-end; }
.dsh-annot-icon-btn {
	width: 20px;
	height: 20px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 5px;
	background: transparent;
	color: var(--dsw-alias-label-secondary, rgba(190, 190, 190, 1));
	cursor: pointer;
	padding: 0;
}
.dsh-annot-icon-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.2)); color: var(--dsw-alias-label-primary, #fff); }
.dsh-annot-icon-btn svg { width: 12px; height: 12px; display: block; }
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

		/** The live selection's text and range, or null when it is not annotatable. */
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
			return { text, range, rect };
		}

		/** Clamp a floating box of the given size near a rectangle. */
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

		/** One annotation as it appears inside the composed message. */
		function blockText(index, annotation) {
			const raw = annotation.quote.length > MAX_QUOTE
				? annotation.quote.slice(0, MAX_QUOTE).trimEnd() + "…"
				: annotation.quote;
			const quoted = raw
				.split("\n")
				.map((line) => (line.trim() === "" ? ">" : "> " + line.trim()))
				.join("\n");
			const head = "Annotation " + index + ":\n" + quoted;
			const note = annotation.comment.trim();
			return head + (note === "" ? "" : "\n\n" + note) + "\n\n";
		}

		/** Remove this plugin's blocks from a draft, leaving the user's own text. */
		function stripBlocks(draft, annotations) {
			let rest = draft;
			annotations.forEach((annotation, index) => {
				const block = blockText(index + 1, annotation);
				if (rest.includes(block)) rest = rest.replace(block, "");
			});
			return rest.replace(/^\n+/, "");
		}

		let sequence = 0;
		function nextId() {
			sequence += 1;
			return "a" + Date.now().toString(36) + sequence;
		}

		const ICON_COMMENT = h(
			"svg",
			{ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
			h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
		);
		const ICON_PENCIL = h(
			"svg",
			{ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
			h("path", { d: "M12 20h9" }),
			h("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" })
		);
		const ICON_TRASH = h(
			"svg",
			{ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
			h("path", { d: "M3 6h18" }),
			h("path", { d: "M8 6V4h8v2" }),
			h("path", { d: "M19 6l-1 14H6L5 6" })
		);

		/**
		 * The annotation surface: a pill beside a selection, a comment card that
		 * stages drafts in a tray above the composer, and numbered pins over the
		 * annotated passages. Staged annotations are mirrored into the composer
		 * draft as numbered blocks, so they travel with whatever the user writes.
		 * @param props - standard Session props plus the injected Session prompt.
		 * @returns the pill, card, tray, pins, and toast, portalled to the body.
		 */
		function AnnotationOverlay(props) {
			const useInput = props.useInput;
			const inputActions = props.inputActions;
			const input = typeof useInput === "function" ? useInput((state) => state) : undefined;
			const draft = input !== undefined && typeof input.draft === "string" ? input.draft : "";

			const [selection, setSelection] = useState(null);
			const [composing, setComposing] = useState(false);
			const [comment, setComment] = useState("");
			const [annotations, setAnnotations] = useState([]);
			const [editingId, setEditingId] = useState(null);
			const [collapsed, setCollapsed] = useState(false);
			const [pins, setPins] = useState([]);
			const [trayBox, setTrayBox] = useState(null);
			const [toast, setToast] = useState(null);

			const composingRef = useRef(false);
			const annotationsRef = useRef(annotations);
			const dialogRef = useRef(null);
			const textRef = useRef(null);
			const trayRef = useRef(null);
			const probeRef = useRef(null);
			const appliedRef = useRef(false);
			const sawDraftRef = useRef(false);
			const toastTimer = useRef(0);

			composingRef.current = composing;
			annotationsRef.current = annotations;

			const showToast = useCallback((message) => {
				setToast(message);
				if (toastTimer.current !== 0) window.clearTimeout(toastTimer.current);
				toastTimer.current = window.setTimeout(() => setToast(null), 2600);
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

			const closeCard = useCallback(() => {
				setComposing(false);
				setEditingId(null);
				setComment("");
				setSelection(null);
			}, []);

			// Escape closes the card from anywhere inside it.
			useEffect(() => {
				if (!composing) return undefined;
				const onKey = (event) => {
					if (event.key === "Escape") {
						event.stopPropagation();
						closeCard();
					}
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey, true);
			}, [composing, closeCard]);

			// A click outside the card abandons the pending annotation.
			useEffect(() => {
				if (!composing) return undefined;
				const onDown = (event) => {
					const root = dialogRef.current;
					if (root !== null && root.contains(event.target)) return;
					closeCard();
				};
				document.addEventListener("mousedown", onDown, true);
				return () => document.removeEventListener("mousedown", onDown, true);
			}, [composing, closeCard]);

			useEffect(() => {
				if (!composing) return;
				const node = textRef.current;
				if (node !== null) node.focus();
			}, [composing, editingId]);

			// Paint annotated ranges with the CSS Custom Highlight API when available.
			useEffect(() => {
				const registry = window.CSS && window.CSS.highlights;
				if (!registry || typeof window.Highlight !== "function") return undefined;
				const highlight = new window.Highlight();
				annotations.forEach((annotation) => {
					if (annotation.range) {
						try { highlight.add(annotation.range); } catch { /* range detached */ }
					}
				});
				if (highlight.size === 0) registry.delete(HIGHLIGHT);
				else registry.set(HIGHLIGHT, highlight);
				return () => { try { registry.delete(HIGHLIGHT); } catch { /* gone */ } };
			}, [annotations]);

			// Keep the numbered pins over their passages while the transcript moves.
			useEffect(() => {
				if (annotations.length === 0) {
					setPins([]);
					return undefined;
				}
				let frame = 0;
				const measure = () => {
					if (frame !== 0) return;
					frame = window.requestAnimationFrame(() => {
						frame = 0;
						const next = [];
						annotationsRef.current.forEach((annotation, index) => {
							if (!annotation.range) return;
							let rect;
							try { rect = annotation.range.getBoundingClientRect(); } catch { return; }
							if (rect.width === 0 && rect.height === 0) return;
							next.push({
								id: annotation.id,
								index: index + 1,
								left: Math.min(rect.right + 3, window.innerWidth - 22),
								top: Math.max(rect.top - 9, 4),
							});
						});
						setPins(next);
					});
				};
				measure();
				const timer = window.setInterval(measure, 400);
				document.addEventListener("scroll", measure, true);
				window.addEventListener("resize", measure);
				return () => {
					if (frame !== 0) window.cancelAnimationFrame(frame);
					window.clearInterval(timer);
					document.removeEventListener("scroll", measure, true);
					window.removeEventListener("resize", measure);
				};
			}, [annotations]);

			// Anchor the tray just above the composer card.
			useEffect(() => {
				const place = () => {
					const probe = probeRef.current;
					const card = probe === null ? null : probe.closest("[data-composer-card]");
					if (card === null) return;
					const rect = card.getBoundingClientRect();
					setTrayBox({
						left: Math.round(rect.left),
						width: Math.round(rect.width),
						bottom: Math.round(window.innerHeight - rect.top + 8),
					});
				};
				place();
				const timer = window.setInterval(place, 1500);
				window.addEventListener("resize", place);
				return () => {
					window.clearInterval(timer);
					window.removeEventListener("resize", place);
				};
			}, []);

			/** Write the staged annotations plus the user's own text back into the draft. */
			const rebuild = useCallback((next, previous) => {
				if (inputActions === undefined || inputActions === null) return;
				const before = previous === undefined ? annotationsRef.current : previous;
				const userText = stripBlocks(
					input !== undefined && typeof input.draft === "string" ? input.draft : "",
					before,
				);
				const composed = next.map((annotation, index) => blockText(index + 1, annotation)).join("") + userText;
				appliedRef.current = true;
				sawDraftRef.current = false;
				try { inputActions.setDraft(composed); } catch { /* composer unavailable */ }
			}, [input, inputActions]);

			/** Drop the tray once the composed draft has been sent or emptied. */
			useEffect(() => {
				if (!appliedRef.current) return;
				if (draft !== "") {
					sawDraftRef.current = true;
					return;
				}
				if (!sawDraftRef.current) return;
				sawDraftRef.current = false;
				appliedRef.current = false;
				if (annotationsRef.current.length > 0) setAnnotations([]);
			}, [draft]);

			const stage = useCallback((next, sendNow) => {
				const previous = annotationsRef.current;
				setAnnotations(next);
				annotationsRef.current = next;
				rebuild(next, previous);
				if (sendNow) {
					window.setTimeout(() => {
						try { inputActions.submit(); } catch { showToast("Could not send"); }
					}, 30);
				}
			}, [rebuild, inputActions, showToast]);

			const commitCard = useCallback((sendNow) => {
				if (selection === null) return;
				const note = comment.trim();
				if (editingId !== null) {
					const next = annotationsRef.current.map((annotation) =>
						annotation.id === editingId ? { ...annotation, comment: note } : annotation);
					stage(next, sendNow);
					showToast("Annotation updated");
				} else {
					const next = [...annotationsRef.current, {
						id: nextId(),
						quote: selection.text,
						comment: note,
						range: selection.range,
					}];
					stage(next, sendNow);
					showToast(note === "" ? "Selection added to the tray" : "Annotation added to the tray");
				}
				const live = window.getSelection();
				if (live !== null && live !== undefined) live.removeAllRanges();
				setComposing(false);
				setEditingId(null);
				setComment("");
				setSelection(null);
			}, [selection, comment, editingId, stage, showToast]);

			const startEdit = useCallback((annotation) => {
				setEditingId(annotation.id);
				setComment(annotation.comment);
				setSelection({ text: annotation.quote, range: annotation.range, rect: annotation.range ? annotation.range.getBoundingClientRect() : { left: 40, top: 40, right: 40, bottom: 40 } });
				setComposing(true);
			}, []);

			const removeAnnotation = useCallback((id) => {
				const next = annotationsRef.current.filter((annotation) => annotation.id !== id);
				stage(next, false);
			}, [stage]);

			const sendTray = useCallback(() => {
				if (annotationsRef.current.length === 0) return;
				if (draft.trim() === "") rebuild(annotationsRef.current);
				window.setTimeout(() => {
					try { inputActions.submit(); } catch { showToast("Could not send"); }
				}, 30);
			}, [draft, rebuild, inputActions, showToast]);

			const pill = selection !== null && !composing
				? h(
					"button",
					{
						type: "button",
						className: "dsh-annot-pill",
						"data-dsh-annotation-ui": "pill",
						title: "Comment on the selected text",
						style: placeNear(selection.rect, 112, 30),
						onMouseDown: (event) => event.preventDefault(),
						onClick: () => setComposing(true),
					},
					ICON_COMMENT,
					"Comment",
				)
				: null;

			const card = composing && selection !== null
				? h(
					"div",
					{
						ref: dialogRef,
						className: "dsh-annot-dialog",
						"data-dsh-annotation-ui": "dialog",
						role: "dialog",
						"aria-label": editingId === null ? "Comment on selection" : "Edit annotation",
						style: placeNear(selection.rect, 380, 250),
					},
					h(
						"div",
						{ className: "dsh-annot-title" },
						h("span", null, editingId === null ? "Comment on this passage" : "Edit annotation"),
						h("button", { type: "button", className: "dsh-annot-close", title: "Cancel", onClick: closeCard }, "×"),
					),
					h("blockquote", { className: "dsh-annot-quote" }, selection.text),
					h("textarea", {
						ref: textRef,
						className: "dsh-annot-input",
						placeholder: "Add an optional comment…",
						value: comment,
						onChange: (event) => setComment(event.target.value),
						onKeyDown: (event) => {
							if (event.nativeEvent !== undefined && event.nativeEvent.isComposing) return;
							if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
								event.preventDefault();
								commitCard(false);
							} else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
								event.preventDefault();
								commitCard(true);
							}
						},
					}),
					h(
						"div",
						{ className: "dsh-annot-foot" },
						h("span", { className: "dsh-annot-hint" }, "Enter adds · Ctrl+Enter sends · Shift+Enter new line"),
						h(
							"div",
							{ className: "dsh-annot-actions" },
							h("button", { type: "button", className: "dsh-annot-btn dsh-annot-btn-ghost", onClick: closeCard }, "Cancel"),
							h("button", { type: "button", className: "dsh-annot-btn dsh-annot-btn-primary", onClick: () => commitCard(false) }, "Add"),
						),
					),
				)
				: null;

			const tray = annotations.length > 0 && trayBox !== null
				? h(
					"div",
					{
						ref: trayRef,
						className: "dsh-annot-tray",
						"data-dsh-annotation-ui": "tray",
						style: { left: trayBox.left, width: trayBox.width, bottom: trayBox.bottom },
					},
					h(
						"div",
						{ className: "dsh-annot-tray-head" },
						h(
							"button",
							{ type: "button", className: "dsh-annot-tray-title", onClick: () => setCollapsed((value) => !value) },
							h("span", { className: "dsh-annot-tray-count" }, String(annotations.length)),
							annotations.length === 1 ? "annotation" : "annotations",
							h("span", { style: { opacity: 0.6, fontSize: 10 } }, collapsed ? "▸" : "▾"),
						),
						h(
							"button",
							{ type: "button", className: "dsh-annot-btn dsh-annot-btn-primary", onClick: sendTray },
							"Send",
						),
					),
					collapsed ? null : h(
						"div",
						{ style: { display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" } },
						annotations.map((annotation, index) => h(
							"div",
							{ key: annotation.id, className: "dsh-annot-row" },
							h("div", { className: "dsh-annot-row-num" }, String(index + 1)),
							h(
								"div",
								{ className: "dsh-annot-row-body" },
								h("div", { className: "dsh-annot-row-quote" }, "“" + annotation.quote.replace(/\s+/g, " ").trim() + "”"),
								h(
									"div",
									{ className: "dsh-annot-row-comment" + (annotation.comment.trim() === "" ? " is-empty" : "") },
									annotation.comment.trim() === "" ? "no comment — sent as context" : annotation.comment,
								),
							),
							h(
								"div",
								{ className: "dsh-annot-row-tools" },
								h("button", { type: "button", className: "dsh-annot-icon-btn", title: "Edit", onClick: () => startEdit(annotation) }, ICON_PENCIL),
								h("button", { type: "button", className: "dsh-annot-icon-btn", title: "Remove", onClick: () => removeAnnotation(annotation.id) }, ICON_TRASH),
							),
						)),
					),
				)
				: null;

			const pinLayer = pins.map((pin) => h(
				"div",
				{ key: pin.id, className: "dsh-annot-pin", style: { left: pin.left, top: pin.top } },
				String(pin.index),
			));

			const notice = toast !== null
				? h("div", { className: "dsh-annot-toast", "data-dsh-annotation-ui": "toast" }, toast)
				: null;

			const probe = h("span", { ref: probeRef, style: { display: "none" }, "data-dsh-annotation-ui": "probe" });

			if (typeof document === "undefined" || document.body === null) return null;
			return ReactDOM.createPortal(
				h(React.Fragment, null, probe, pill, pinLayer, card, tray, notice),
				document.body,
			);
		}

		/** Required services: the UI slot registry and the Session controller. */
		const inject = ["slots", "sessions"];

		/**
		 * Client plugin body: install the styles and contribute the annotation surface
		 * to the composer's overlay slot, which the shell mounts once per Session. The
		 * entry's own inject binds the per-Session prompt used as a fallback transport.
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
					},
				}),
			}, AnnotationOverlay));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
