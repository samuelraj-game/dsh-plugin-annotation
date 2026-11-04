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
		/** Name of the stronger highlight painted under the hovered annotation. */
		const HIGHLIGHT_HOVER = "dsh-annotation-hover";

		const CSS = `
::highlight(dsh-annotation) {
	background-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4d6bfe) 24%, transparent);
	color: inherit;
}
::highlight(dsh-annotation-hover) {
	background-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4d6bfe) 52%, transparent);
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
	background: var(--dsw-alias-state-business-primary, #4d6bfe);
	color: #fff;
	font: 600 11px/18px var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
	text-align: center;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	cursor: pointer;
	pointer-events: auto;
	transition: transform 120ms ease, box-shadow 120ms ease;
}
.dsh-annot-pin:hover,
.dsh-annot-pin.is-hovered {
	transform: scale(1.14);
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.38);
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
	border-left: 3px solid var(--dsw-alias-state-business-primary, #4d6bfe);
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
.dsh-annot-input:focus { border-color: var(--dsw-alias-state-business-primary, #4d6bfe); }
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

.dsh-annot-dock {
	position: fixed;
	z-index: 2147482985;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	pointer-events: none;
}
.dsh-annot-panel {
	pointer-events: auto;
	box-sizing: border-box;
	width: 100%;
	min-width: 260px;
	min-height: 110px;
	max-height: min(60vh, 460px);
	padding: 8px;
	overflow: auto;
	resize: vertical;
	border-radius: 12px;
	border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.32));
	background: var(--dsw-alias-bg-layer-2, #1f1f1f);
	color: var(--dsw-alias-label-primary, #fff);
	box-shadow: 0 14px 40px rgba(0, 0, 0, 0.34);
	font: 12px/1.4 var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
}
.dsh-annot-panel-head {
	position: sticky;
	top: -8px;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 4px 4px 8px;
	background: var(--dsw-alias-bg-layer-2, #1f1f1f);
}
.dsh-annot-panel-title { font-weight: 600; font-size: 12px; }
.dsh-annot-panel-actions { display: flex; align-items: center; gap: 6px; }
.dsh-annot-item {
	display: grid;
	grid-template-columns: 20px minmax(0, 1fr) 48px;
	gap: 8px;
	align-items: start;
	padding: 8px;
	border-radius: 8px;
	transition: background 100ms ease;
}
.dsh-annot-item + .dsh-annot-item { margin-top: 4px; }
.dsh-annot-item:hover,
.dsh-annot-item.is-hovered { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.14)); }
.dsh-annot-item-num {
	width: 20px;
	height: 20px;
	border-radius: 999px;
	background: var(--dsw-alias-state-business-primary, #4d6bfe);
	color: #fff;
	font-size: 11px;
	font-weight: 600;
	line-height: 20px;
	text-align: center;
}
.dsh-annot-item-body { min-width: 0; }
.dsh-annot-item-label {
	margin: 0 0 2px;
	color: var(--dsw-alias-label-tertiary, rgba(150, 150, 150, 1));
	font-size: 10px;
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}
.dsh-annot-item-quote {
	margin: 0 0 7px;
	color: var(--dsw-alias-label-secondary, rgba(215, 215, 215, 1));
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.dsh-annot-item-comment {
	color: var(--dsw-alias-label-primary, #fff);
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.dsh-annot-item-comment.is-empty { color: var(--dsw-alias-label-tertiary, rgba(150, 150, 150, 1)); font-style: italic; }
.dsh-annot-item-tools { display: flex; gap: 2px; justify-content: flex-end; }
.dsh-annot-icon-btn {
	width: 22px;
	height: 22px;
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

.dsh-annot-bar {
	pointer-events: auto;
	display: inline-flex;
	align-items: center;
	height: 30px;
	padding: 0 4px 0 10px;
	box-sizing: border-box;
	border-radius: 999px;
	border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.32));
	background: var(--dsw-alias-bg-layer-2, #1f1f1f);
	color: var(--dsw-alias-label-primary, #fff);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.26);
	font: 500 12px/1 var(--dsw-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
}
.dsh-annot-trigger {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 100%;
	padding: 0;
	border: 0;
	background: transparent;
	color: inherit;
	font: inherit;
	cursor: pointer;
}
.dsh-annot-trigger svg { width: 13px; height: 13px; display: block; opacity: 0.85; }
.dsh-annot-clear {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 0;
	height: 22px;
	margin-left: 0;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: var(--dsw-alias-label-secondary, rgba(210, 210, 210, 1));
	cursor: pointer;
	opacity: 0;
	visibility: hidden;
	overflow: hidden;
	transition: width 120ms ease, margin 120ms ease, opacity 120ms ease, background 120ms ease;
}
.dsh-annot-bar:hover .dsh-annot-clear,
.dsh-annot-bar:focus-within .dsh-annot-clear {
	width: 22px;
	margin-left: 4px;
	opacity: 1;
	visibility: visible;
	background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.18));
}
.dsh-annot-clear:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.32)); color: var(--dsw-alias-label-primary, #fff); }
.dsh-annot-clear svg { width: 11px; height: 11px; display: block; }

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
		const ICON_X = h(
			"svg",
			{ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", "aria-hidden": "true" },
			h("path", { d: "M6 6l12 12" }),
			h("path", { d: "M18 6L6 18" })
		);

		/**
		 * The annotation surface: a pill beside a selection, a comment card, a
		 * hoverable stack above the composer, and numbered pins over the annotated
		 * passages. Staged annotations stay out of the composer draft; they are
		 * combined only when the message is actually sent.
		 * @param props - standard Session props plus the injected sendAnnotation.
		 * @returns the pill, card, stack, pins, and toast, portalled to the body.
		 */
		function AnnotationOverlay(props) {
			const useInput = props.useInput;
			const inputActions = props.inputActions;
			const sendAnnotation = props.sendAnnotation;
			const input = typeof useInput === "function" ? useInput((state) => state) : undefined;
			const draft = input !== undefined && typeof input.draft === "string" ? input.draft : "";
			const phase = input !== undefined && typeof input.phase === "string" ? input.phase : "plain";
			const attachmentCount = input !== undefined && Array.isArray(input.attachmentIds) ? input.attachmentIds.length : 0;
			const referenceCount = input !== undefined && Array.isArray(input.occurrences) ? input.occurrences.length : 0;

			const [selection, setSelection] = useState(null);
			const [composing, setComposing] = useState(false);
			const [comment, setComment] = useState("");
			const [annotations, setAnnotations] = useState([]);
			const [editingId, setEditingId] = useState(null);
			const [pins, setPins] = useState([]);
			const [dockBox, setDockBox] = useState(null);
			const [toast, setToast] = useState(null);
			const [hoveredId, setHoveredId] = useState(null);
			const [listOpen, setListOpen] = useState(false);
			const [ctrlHeld, setCtrlHeld] = useState(false);
			const [sending, setSending] = useState(false);

			const composingRef = useRef(false);
			const annotationsRef = useRef(annotations);
			const dialogRef = useRef(null);
			const textRef = useRef(null);
			const probeRef = useRef(null);
			const toastTimer = useRef(0);
			const closeTimer = useRef(0);
			const draftRef = useRef(draft);
			const sendingRef = useRef(false);
			const stateRef = useRef({ annotations, draft, phase, sending, attachmentCount, referenceCount });

			composingRef.current = composing;
			annotationsRef.current = annotations;
			draftRef.current = draft;
			stateRef.current = { annotations, draft, phase, sending, attachmentCount, referenceCount };

			const showToast = useCallback((message) => {
				setToast(message);
				if (toastTimer.current !== 0) window.clearTimeout(toastTimer.current);
				toastTimer.current = window.setTimeout(() => setToast(null), 2600);
			}, []);

			useEffect(() => () => {
				if (toastTimer.current !== 0) window.clearTimeout(toastTimer.current);
				if (closeTimer.current !== 0) window.clearTimeout(closeTimer.current);
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
				setCtrlHeld(false);
			}, []);

			// Escape closes the card, or the open annotation list.
			useEffect(() => {
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					if (composingRef.current) {
						event.stopPropagation();
						closeCard();
						return;
					}
					if (listOpen) {
						event.stopPropagation();
						setListOpen(false);
					}
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey, true);
			}, [closeCard, listOpen]);

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

			// Reflect the Ctrl/Cmd modifier on the card's primary button.
			useEffect(() => {
				if (!composing) {
					setCtrlHeld(false);
					return undefined;
				}
				const down = (event) => {
					if (event.key === "Control" || event.key === "Meta") setCtrlHeld(true);
				};
				const up = (event) => {
					if (event.key === "Control" || event.key === "Meta") setCtrlHeld(false);
				};
				const blur = () => setCtrlHeld(false);
				window.addEventListener("keydown", down, true);
				window.addEventListener("keyup", up, true);
				window.addEventListener("blur", blur);
				return () => {
					window.removeEventListener("keydown", down, true);
					window.removeEventListener("keyup", up, true);
					window.removeEventListener("blur", blur);
				};
			}, [composing]);

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

			// Paint the passage under the pointer with a stronger colour.
			useEffect(() => {
				const registry = window.CSS && window.CSS.highlights;
				if (!registry || typeof window.Highlight !== "function") return undefined;
				if (hoveredId === null) {
					try { registry.delete(HIGHLIGHT_HOVER); } catch { /* gone */ }
					return undefined;
				}
				const annotation = annotations.find((candidate) => candidate.id === hoveredId);
				if (annotation === undefined || !annotation.range) {
					try { registry.delete(HIGHLIGHT_HOVER); } catch { /* gone */ }
					return undefined;
				}
				const highlight = new window.Highlight();
				try { highlight.add(annotation.range); } catch { return undefined; }
				registry.set(HIGHLIGHT_HOVER, highlight);
				return () => {
					try {
						if (registry.get(HIGHLIGHT_HOVER) === highlight) registry.delete(HIGHLIGHT_HOVER);
					} catch { /* gone */ }
				};
			}, [hoveredId, annotations]);

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

			// Anchor the stack just above the composer card.
			useEffect(() => {
				const place = () => {
					const probe = probeRef.current;
					const card = (probe === null ? null : probe.closest("[data-composer-card]"))
						?? document.querySelector("[data-composer-card]");
					if (card === null) return;
					const rect = card.getBoundingClientRect();
					setDockBox({
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

			const openList = useCallback(() => {
				if (closeTimer.current !== 0) {
					window.clearTimeout(closeTimer.current);
					closeTimer.current = 0;
				}
				setListOpen(true);
			}, []);

			const scheduleCloseList = useCallback(() => {
				if (closeTimer.current !== 0) window.clearTimeout(closeTimer.current);
				closeTimer.current = window.setTimeout(() => {
					closeTimer.current = 0;
					setListOpen(false);
				}, 160);
			}, []);

			const clearAll = useCallback(() => {
				setAnnotations([]);
				annotationsRef.current = [];
				setHoveredId(null);
				setListOpen(false);
				showToast("Annotations cleared");
			}, [showToast]);

			const stage = useCallback((next) => {
				setAnnotations(next);
				annotationsRef.current = next;
			}, []);

			/** Send exactly one annotation as its own turn, leaving the stack alone. */
			const sendOne = useCallback((annotation, wasEditing) => {
				const block = blockText(1, annotation);
				if (typeof sendAnnotation !== "function") {
					showToast("Annotation transport unavailable");
					return;
				}
				let result;
				try {
					result = sendAnnotation(block);
				} catch {
					showToast("Could not send annotation");
					return;
				}
				Promise.resolve(result).then(() => {
					if (wasEditing) {
						const next = annotationsRef.current.filter((candidate) => candidate.id !== annotation.id);
						stage(next);
					}
					showToast("Annotation sent");
				}, () => {
					showToast("Could not send annotation");
				});
			}, [sendAnnotation, showToast, stage]);

			/** Send the whole stack, combined with the composer draft, as one turn. */
			const sendAll = useCallback(() => {
				const current = annotationsRef.current;
				if (current.length === 0 || sendingRef.current) return;
				if (stateRef.current.phase !== "plain") {
					showToast("Finish the command first");
					return;
				}
				const composed = current.map((annotation, index) => blockText(index + 1, annotation)).join("") + draftRef.current;
				const capturedDraft = draftRef.current;
				sendingRef.current = true;
				setSending(true);

				const finish = (ok, clearDraft) => {
					sendingRef.current = false;
					setSending(false);
					if (!ok) return;
					setAnnotations([]);
					annotationsRef.current = [];
					setHoveredId(null);
					setListOpen(false);
					if (clearDraft && draftRef.current === capturedDraft) {
						try { inputActions.setDraft(""); } catch { /* composer unavailable */ }
					}
				};

				/** Last resort: put the composed turn through the composer itself. */
				const composerSend = () => {
					let wroteDraft = false;
					try {
						inputActions.setDraft(composed);
						wroteDraft = true;
					} catch { /* composer unavailable */ }
					window.setTimeout(() => {
						try {
							inputActions.submit();
							finish(true, false);
						} catch {
							finish(false, false);
							if (wroteDraft && draftRef.current === composed) {
								try { inputActions.setDraft(capturedDraft); } catch { /* composer unavailable */ }
							}
							showToast("Could not send annotations");
						}
					}, 30);
				};

				if (stateRef.current.attachmentCount > 0 || stateRef.current.referenceCount > 0 || typeof sendAnnotation !== "function") {
					composerSend();
					return;
				}

				let result;
				try {
					result = sendAnnotation(composed);
				} catch {
					composerSend();
					return;
				}
				Promise.resolve(result).then(() => {
					finish(true, true);
				}, () => {
					composerSend();
				});
			}, [inputActions, sendAnnotation, showToast]);

			const sendAllRef = useRef(sendAll);
			sendAllRef.current = sendAll;

			// Let ordinary Enter / the primary send button include the staged stack.
			useEffect(() => {
				const isOurs = (element) => element.closest("[data-dsh-annotation-ui]") !== null;
				const onKey = (event) => {
					if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
					if (event.isComposing || (event.nativeEvent !== undefined && event.nativeEvent.isComposing)) return;
					const target = event.target;
					if (!(target instanceof Element) || isOurs(target)) return;
					if (target.closest("[data-composer-card]") === null) return;
					if (target.closest('[contenteditable="true"], [contenteditable=""], textarea') === null) return;
					if (stateRef.current.annotations.length === 0) return;
					if (stateRef.current.phase !== "plain") return;
					event.preventDefault();
					event.stopImmediatePropagation();
					sendAllRef.current();
				};
				const onClick = (event) => {
					const target = event.target;
					if (!(target instanceof Element) || isOurs(target)) return;
					const button = target.closest("[data-composer-card] button");
					if (button === null || button.disabled) return;
					if (!String(button.className).includes("primary")) return;
					if (button.querySelector("svg rect") !== null) return;
					if (stateRef.current.annotations.length === 0) return;
					if (stateRef.current.phase !== "plain") return;
					event.preventDefault();
					event.stopImmediatePropagation();
					sendAllRef.current();
				};
				window.addEventListener("keydown", onKey, true);
				window.addEventListener("click", onClick, true);
				return () => {
					window.removeEventListener("keydown", onKey, true);
					window.removeEventListener("click", onClick, true);
				};
			}, []);

			const commitCard = useCallback((sendNow) => {
				if (selection === null) return;
				const note = comment.trim();
				let annotation;
				if (editingId !== null) {
					const existing = annotationsRef.current.find((candidate) => candidate.id === editingId);
					annotation = {
						id: editingId,
						quote: existing === undefined ? selection.text : existing.quote,
						comment: note,
						range: existing === undefined ? selection.range : existing.range,
					};
				} else {
					annotation = {
						id: nextId(),
						quote: selection.text,
						comment: note,
						range: selection.range,
					};
				}

				if (sendNow) {
					sendOne(annotation, editingId !== null);
				} else if (editingId !== null) {
					stage(annotationsRef.current.map((candidate) =>
						candidate.id === editingId ? annotation : candidate));
					showToast("Annotation updated");
				} else {
					stage([...annotationsRef.current, annotation]);
					showToast(note === "" ? "Selection added to the stack" : "Annotation added to the stack");
				}

				const live = window.getSelection();
				if (live !== null && live !== undefined) live.removeAllRanges();
				setComposing(false);
				setEditingId(null);
				setComment("");
				setSelection(null);
				setCtrlHeld(false);
			}, [selection, comment, editingId, sendOne, stage, showToast]);

			const startEdit = useCallback((annotation) => {
				setEditingId(annotation.id);
				setComment(annotation.comment);
				setSelection({
					text: annotation.quote,
					range: annotation.range,
					rect: annotation.range ? annotation.range.getBoundingClientRect() : { left: 40, top: 40, right: 40, bottom: 40 },
				});
				setComposing(true);
				setListOpen(false);
			}, []);

			const removeAnnotation = useCallback((id) => {
				const next = annotationsRef.current.filter((annotation) => annotation.id !== id);
				stage(next);
				if (hoveredId === id) setHoveredId(null);
			}, [stage, hoveredId]);

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
						h(
							"span",
							{ className: "dsh-annot-hint" },
							ctrlHeld
								? "Enter sends only this annotation"
								: "Enter stages · Ctrl+Enter sends only this · Shift+Enter new line",
						),
						h(
							"div",
							{ className: "dsh-annot-actions" },
							h("button", { type: "button", className: "dsh-annot-btn dsh-annot-btn-ghost", onClick: closeCard }, "Cancel"),
							h(
								"button",
								{
									type: "button",
									className: "dsh-annot-btn dsh-annot-btn-primary",
									title: ctrlHeld ? "Send only this annotation" : "Add to the stack",
									onClick: () => commitCard(ctrlHeld),
								},
								ctrlHeld ? "Send" : editingId === null ? "Add" : "Save",
							),
						),
					),
				)
				: null;

			const panel = annotations.length > 0 && listOpen
				? h(
					"div",
					{
						className: "dsh-annot-panel",
						"data-dsh-annotation-ui": "panel",
						onMouseEnter: openList,
						onMouseLeave: scheduleCloseList,
					},
					h(
						"div",
						{ className: "dsh-annot-panel-head" },
						h("span", { className: "dsh-annot-panel-title" }, annotations.length + (annotations.length === 1 ? " annotation" : " annotations")),
						h(
							"div",
							{ className: "dsh-annot-panel-actions" },
							h(
								"button",
								{
									type: "button",
									className: "dsh-annot-btn dsh-annot-btn-primary",
									disabled: sending,
									onClick: sendAll,
								},
								sending ? "Sending…" : "Send all",
							),
						),
					),
					annotations.map((annotation, index) => h(
						"div",
						{
							key: annotation.id,
							className: "dsh-annot-item" + (hoveredId === annotation.id ? " is-hovered" : ""),
							"data-dsh-annotation-ui": "item",
							onMouseEnter: () => setHoveredId(annotation.id),
							onMouseLeave: () => setHoveredId(null),
						},
						h("div", { className: "dsh-annot-item-num" }, String(index + 1)),
						h(
							"div",
							{ className: "dsh-annot-item-body" },
							h("div", { className: "dsh-annot-item-label" }, "Selected text"),
							h("div", { className: "dsh-annot-item-quote" }, annotation.quote.replace(/\s+/g, " ").trim()),
							h("div", { className: "dsh-annot-item-label" }, "User comment"),
							h(
								"div",
								{ className: "dsh-annot-item-comment" + (annotation.comment.trim() === "" ? " is-empty" : "") },
								annotation.comment.trim() === "" ? "No comment" : annotation.comment,
							),
						),
						h(
							"div",
							{ className: "dsh-annot-item-tools" },
							h("button", { type: "button", className: "dsh-annot-icon-btn", title: "Edit", onClick: () => startEdit(annotation) }, ICON_PENCIL),
							h("button", { type: "button", className: "dsh-annot-icon-btn", title: "Remove", onClick: () => removeAnnotation(annotation.id) }, ICON_TRASH),
						),
					)),
				)
				: null;

			const bar = annotations.length > 0
				? h(
					"div",
					{
						className: "dsh-annot-bar",
						"data-dsh-annotation-ui": "bar",
						onMouseEnter: openList,
						onMouseLeave: scheduleCloseList,
					},
					h(
						"button",
						{
							type: "button",
							className: "dsh-annot-trigger",
							"aria-expanded": listOpen,
							title: "Show annotations",
							onClick: () => (listOpen ? setListOpen(false) : openList()),
						},
						ICON_COMMENT,
						h("span", null, annotations.length + (annotations.length === 1 ? " annotation" : " annotations")),
					),
					h(
						"button",
						{
							type: "button",
							className: "dsh-annot-clear",
							title: "Clear annotations",
							onClick: (event) => {
								event.stopPropagation();
								clearAll();
							},
						},
						ICON_X,
					),
				)
				: null;

			const dock = annotations.length > 0 && dockBox !== null
				? h(
					"div",
					{
						className: "dsh-annot-dock",
						"data-dsh-annotation-ui": "dock",
						style: { left: dockBox.left, width: dockBox.width, bottom: dockBox.bottom },
					},
					panel,
					bar,
				)
				: null;

			const pinLayer = pins.map((pin) => h(
				"div",
				{
					key: pin.id,
					className: "dsh-annot-pin" + (hoveredId === pin.id ? " is-hovered" : ""),
					"data-dsh-annotation-ui": "pin",
					style: { left: pin.left, top: pin.top },
					title: "Show annotation " + pin.index,
					onMouseEnter: () => setHoveredId(pin.id),
					onMouseLeave: () => setHoveredId(null),
				},
				String(pin.index),
			));

			const notice = toast !== null
				? h("div", { className: "dsh-annot-toast", "data-dsh-annotation-ui": "toast" }, toast)
				: null;

			const probe = h("span", { ref: probeRef, style: { display: "none" }, "data-dsh-annotation-ui": "probe" });

			if (typeof document === "undefined" || document.body === null) return null;
			return h(
				React.Fragment,
				null,
				probe,
				ReactDOM.createPortal(
					h(React.Fragment, null, pill, pinLayer, card, dock, notice),
					document.body,
				),
			);
		}

		/** Required services: the UI slot registry and the Session controller. */
		const inject = ["slots", "sessions"];

		/**
		 * Client plugin body: install the styles and contribute the annotation surface
		 * to the composer's overlay slot, which the shell mounts once per Session.
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
