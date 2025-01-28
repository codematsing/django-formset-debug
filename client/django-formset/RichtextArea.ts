import template from 'lodash.template';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import isString from 'lodash.isstring';
import getDataValue from 'lodash.get';
import {arrow, computePosition} from '@floating-ui/dom';
import {Editor, Extension, Mark, Node, markPasteRule, mergeAttributes, getAttributes, JSONContent} from '@tiptap/core';
import {Plugin, PluginKey} from '@tiptap/pm/state';
import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import {Heading, Level} from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Text from '@tiptap/extension-text';
import {TextAlign, TextAlignOptions} from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {TextIndent, TextIndentOptions } from '../tiptap-extensions/indent';
import {TextMargin, TextMarginOptions } from '../tiptap-extensions/margin';
import {TextColor} from '../tiptap-extensions/color';
import {ClassBasedMark, ClassBasedNode} from '../tiptap-extensions/classbased';
import {StyleHelpers} from './helpers';
import {FormDialogBase} from './FormDialog';
import {parse} from '../build/function-code';
import styles from './RichtextArea.scss';


function appearTooltip(event: MouseEvent) {
	if (!(event.target instanceof HTMLButtonElement && event.target.ariaLabel))
		return;
	const button = event.target;
	const tooltipElement = document.createElement('div');
	tooltipElement.classList.add('tooltip');
	tooltipElement.innerText = button.ariaLabel ?? '';
	const arrowElement = document.createElement('div');
	arrowElement.classList.add('arrow');
	tooltipElement.appendChild(arrowElement);
	button.insertAdjacentElement('beforebegin', tooltipElement);
	computePosition(button, tooltipElement, {placement: 'top', strategy: 'fixed', middleware: [arrow({element: arrowElement})]}).then(
		({x, y}) => Object.assign(tooltipElement!.style, {
			left: `${x}px`,
			top: `${y}px`,
			opacity: '0.75',
			transition: 'opacity 0.5s 1.2s',
		})
	);
	button.addEventListener('mouseleave', () => tooltipElement.remove(), {once: true});
}


abstract class Action {
	public readonly name: string;
	public readonly button: HTMLButtonElement;
	protected readonly extensions: Array<Extension|Mark|Node> = [];
	private tooltipElement: HTMLElement|null = null;

	constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
		this.name = name;
		this.button = button;
	}

	public installEventHandler(editor: Editor) {
		this.button.addEventListener('click', () => this.clicked(editor));
		this.button.addEventListener('mouseenter', appearTooltip);
	}

	protected abstract clicked(editor: Editor): void;

	activate(editor: Editor) {
		this.button.classList.toggle('active', editor.isActive(this.name));
	}

	deactivate() {
		this.button.classList.remove('active');
	}

	extendExtensions(extensions: Array<Extension|Mark|Node>) {
		this.extensions.forEach(e => {
			if (!extensions.includes(e)) {
				extensions.push(e);
			}
		});
	}
}


abstract class DropdownAction extends Action {
	protected readonly dropdownMenu: HTMLUListElement|null;
	protected readonly dropdownItems: NodeListOf<Element>;

	constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement, itemsSelector: string) {
		super(wrapperElement, name, button);
		if (this.button.nextElementSibling instanceof HTMLUListElement && this.button.nextElementSibling.getAttribute('role') === 'menu') {
			this.dropdownMenu = this.button.nextElementSibling;
			this.dropdownItems = this.dropdownMenu.querySelectorAll(itemsSelector);
		} else {
			this.dropdownMenu = null;
			this.dropdownItems = document.querySelectorAll(':not(*)');  // empty list
		}
	}

	public installEventHandler(editor: Editor) {
		if (this.dropdownMenu) {
			this.button.addEventListener('click', () => this.toggleMenu(editor));
			this.dropdownMenu.addEventListener('click', event => this.toggleItem(event, editor));
			document.addEventListener('click', event => {
				let element = event.target instanceof Element ? event.target : null;
				while (element) {
					if (element.isSameNode(this.button) || element.isSameNode(this.dropdownMenu))
						return;
					element = element.parentElement;
				}
				this.toggleMenu(editor, false);
			});
		} else {
			this.button.addEventListener('click', event => this.toggleItem(event, editor));
		}
		this.button.addEventListener('mouseenter', appearTooltip);
	}

	protected toggleMenu(editor: Editor, force?: boolean) {
		if (this.dropdownMenu) {
			const expanded = (force !== false && this.button.ariaExpanded === 'false');
			this.button.ariaExpanded = expanded ? 'true' : 'false';
			if (expanded) {
				const textAreaElement = editor.options.element.nextElementSibling;
				computePosition(this.button, this.dropdownMenu, {strategy: 'fixed'}).then(
					({x, y}) => {
						Object.assign(this.dropdownMenu!.style, {left: `${x}px`, top: `${y}px`});
					}
				);
			}
		}
	}

	protected abstract toggleItem(event: MouseEvent, editor: Editor) : void;
}


namespace controls {
	// basic control actions

	export class BoldAction extends Action {
		protected readonly extensions = [Bold];

		clicked(editor: Editor) {
			editor.chain().focus().toggleBold().run();
			this.activate(editor);
		}
	}

	export class ItalicAction extends Action {
		protected readonly extensions = [Italic];

		clicked(editor: Editor) {
			editor.chain().focus().toggleItalic().run();
			this.activate(editor);
		}
	}

	export class StrikeAction extends Action {
		protected readonly extensions = [Strike];

		clicked(editor: Editor) {
			editor.chain().focus().toggleStrike().run();
			this.activate(editor);
		}
	}

	export class SubscriptAction extends Action {
		protected readonly extensions = [Subscript];

		clicked(editor: Editor) {
			editor.chain().focus().unsetSuperscript().run();
			editor.chain().focus().toggleSubscript().run();
			this.activate(editor);
		}
	}

	export class SuperscriptAction extends Action {
		protected readonly extensions = [Superscript];

		clicked(editor: Editor) {
			editor.chain().focus().unsetSubscript().run();
			editor.chain().focus().toggleSuperscript().run();
			this.activate(editor);
		}
	}

	export class UnderlineAction extends Action {
		protected readonly extensions = [Underline];

		clicked(editor: Editor) {
			editor.chain().focus().toggleUnderline().run();
			this.activate(editor);
		}
	}

	export class BulletListAction extends Action {
		protected readonly extensions = [BulletList, ListItem];

		clicked(editor: Editor) {
			editor.chain().focus().toggleBulletList().run();
			this.activate(editor);
		}
	}

	export class BlockquoteAction extends Action {
		protected readonly extensions = [Blockquote];

		clicked(editor: Editor) {
			editor.chain().focus().toggleBlockquote().run();
			this.activate(editor);
		}
	}

	export class CodeBlockAction extends Action {
		protected readonly extensions = [CodeBlock];

		clicked(editor: Editor) {
			editor.chain().focus().toggleCodeBlock().run();
			this.activate(editor);
		}
	}

	export class HardBreakAction extends Action {
		// extension for HardBreak is always loaded

		clicked(editor: Editor) {
			editor.chain().focus().setHardBreak().run();
			this.activate(editor);
		}
	}

	export class TextColorAction extends DropdownAction {
		private readonly colors: Array<string|null> = [];
		private allowedClasses: Array<string> = [];

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button, '[richtext-click^="color:"]');
			if (!(button.nextElementSibling instanceof HTMLUListElement) || button.nextElementSibling.getAttribute('role') !== 'menu')
				throw new Error('Text color requires a sibling element <ul role="menu">…</ul>');
			this.collectColors();
		}

		private collectColors() {
			this.dropdownItems.forEach(element => {
				const color = this.extractColor(element);
				if (!color)
					return;
				if (/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/.test(color)) {
					if (this.allowedClasses.length !== 0)
						throw new Error(`In element ${element} can not mix class based with style based colors.`);
					this.colors.push(color);
				} else if (/^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(color)) {
					this.allowedClasses.push(color);
				} else {
					throw new Error(`${color} is not a valid color.`);
				}
			});
		}

		private extractColor(element: Element) {
			const parts = element.getAttribute('richtext-click')?.split(':') ?? [];
			if (parts.length !== 2)
				throw new Error(`Element ${element} requires attribute 'richtext-click'.`);
			if (parts[1] === 'null')
				return null;
			return parts[1];
		}

		clicked() {}

		activate(editor: Editor) {
			let isActive = false;
			const rect = this.button.querySelector('svg > rect');
			this.dropdownItems.forEach(element => {
				const color = this.extractColor(element);
				if (color) {
					if (editor.isActive({textColor: color})) {
						if (this.allowedClasses.length === 0) {
							rect?.setAttribute('fill', color);
						} else {
							rect?.classList.forEach(value => rect.classList.remove(value));
							rect?.classList.add(color);
						}
						isActive = true;
					}
				}
			});
			this.button.classList.toggle('active', isActive);
			if (!isActive) {
				if (this.allowedClasses.length === 0) {
					rect?.removeAttribute('fill');
				} else {
					rect?.classList.forEach(value => rect.classList.remove(value));
				}
			}
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			if (extensions.find(e => e.name === 'textColor'))
				throw new Error("RichtextArea allows only one control element with 'textColor'.");
			extensions.push(TextColor.configure({allowedClasses: this.allowedClasses}));
		}

		protected toggleMenu(editor: Editor, force?: boolean) {
			super.toggleMenu(editor, force);
			this.dropdownItems.forEach(element => {
				const color = this.extractColor(element);
				element.parentElement?.classList.toggle('active', editor.isActive({textColor: color}));
			});
		}

		protected toggleItem(event: MouseEvent, editor: Editor) {
			let element = event.target instanceof Element ? event.target : null;
			while (element) {
				if (element.role === 'menuitem') {
					const color = this.extractColor(element);
					if (color) {
						editor.chain().focus().setColor(color).run();
					} else {
						editor.chain().focus().unsetColor().run();
					}
					this.activate(editor);
					this.toggleMenu(editor, false);
					break;
				}
				element = element.parentElement;
			}
		}
	}

	abstract class ClassBasedDropdownAction extends DropdownAction {
		protected allowedClasses = new Set<string>();

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			const parts = name.split(':');
			if (parts.length !== 2 || !parts[1])
				throw new Error(`Element ${button} requires attribute 'richtext-click="classBased<Mark|Node>:..."'.`);
			name = parts[1];
			super(wrapperElement, name, button, `[richtext-click^="${name}:"]`);
			if (!(button.nextElementSibling instanceof HTMLUListElement) || button.nextElementSibling.getAttribute('role') !== 'menu')
				throw new Error('Class Based Dropdown requires a sibling element <ul role="menu">…</ul>');
			this.collectClasses();
		}

		protected collectClasses() {
			this.dropdownItems.forEach(element => {
				const cssClass = this.extractClass(element);
				if (!cssClass)
					return;
				if (/^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(cssClass)) {
					this.allowedClasses.add(cssClass);
				} else {
					throw new Error(`${cssClass} is not a valid CSS class.`);
				}
			});
		}

		protected extractClass(element: Element) {
			const parts = element.getAttribute('richtext-click')?.split(':') ?? [];
			if (parts.length !== 2)
				throw new Error(`Element ${element} requires attribute 'richtext-click'.`);
			if (parts[1] === 'null')
				return null;
			return parts[1];
		}

		clicked() {}

		activate(editor: Editor) {
			let isActive = false;
			this.dropdownItems.forEach(element => {
				const cssClass = this.extractClass(element);
				if (cssClass && this.allowedClasses.has(cssClass) && this.isActive(editor, cssClass)) {
					isActive = true;
				}
			});
			this.button.classList.toggle('active', isActive);
		}

		protected isActive(editor: Editor, cssClass: string) {
			return false;
		}

		protected toggleMenu(editor: Editor, force?: boolean) {
			super.toggleMenu(editor, force);
			this.dropdownItems.forEach(element => {
				const cssClass = this.extractClass(element);
				element.parentElement?.classList.toggle('active', this.isActive(editor, cssClass ?? ''));
			});
		}
	}

	export class ClassBasedMarkAction extends ClassBasedDropdownAction {
		private readonly tiptapExtension: Mark;

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button);
			this.tiptapExtension = ClassBasedMark.extend({name: this.name});
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			if (extensions.find(e => e.name === this.name))
				throw new Error(`RichtextArea allows only one control element with '${this.name}'.`);
			extensions.push(this.tiptapExtension.configure({allowedClasses: Array.from(this.allowedClasses)}));
		}

		protected isActive(editor: Editor, cssClass: string): boolean {
			return editor.isActive({[this.name]: cssClass});
		}

		protected toggleItem(event: MouseEvent, editor: Editor) {
			let element = event.target instanceof Element ? event.target : null;
			while (element) {
				if (element.role === 'menuitem') {
					const cssClass = this.extractClass(element);
					if (cssClass) {
						editor.chain().focus().setMarkClass(this.name, cssClass).run();
					} else {
						editor.chain().focus().unsetMarkClass(this.name).run();
					}
					this.activate(editor);
					this.toggleMenu(editor, false);
					break;
				}
				element = element.parentElement;
			}
		}
	}

	export class ClassBasedNodeAction extends ClassBasedDropdownAction {
		private readonly tiptapExtension: Extension;

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button);
			this.tiptapExtension = ClassBasedNode.extend({name: this.name});
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			if (extensions.find(e => e.name === this.name))
				throw new Error(`RichtextArea allows only one control element with '${this.name}'.`);
			extensions.push(this.tiptapExtension.configure());
		}

		protected isActive(editor: Editor, cssClass: string): boolean {
			return Boolean(cssClass) && editor.isActive({cssClasses: new RegExp(cssClass)});
		}

		protected toggleItem(event: MouseEvent, editor: Editor) {
			let element = event.target instanceof Element ? event.target : null;
			while (element) {
				if (element.role === 'menuitem') {
					const cssClass = this.extractClass(element);
					editor.chain().focus().toggleNodeClass(cssClass, this.allowedClasses).run();
					this.activate(editor);
					this.toggleMenu(editor, false);
					break;
				}
				element = element.parentElement;
			}
		}
	}

	export class TextIndentAction extends Action {
		private readonly options: TextIndentOptions = {
			types: ['heading', 'paragraph'],
		};
		private readonly indent: string;

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button);
			const parts = name.split(':');
			this.indent = parts[1] ?? '';
		}

		clicked(editor: Editor) {
			if (editor.isActive({textIndent: this.indent})) {
				editor.chain().focus().unsetTextIndent().run();
			} else {
				editor.chain().focus().setTextIndent(this.indent).run();
			}
			this.activate(editor);
		}

		activate(editor: Editor) {
			this.button.classList.toggle('active', editor.isActive({textIndent: this.indent}));
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			if (!extensions.find(e => e.name === 'textIndent')) {
				extensions.push(TextIndent.configure(this.options));
			}
		}
	}

	export class TextMarginAction extends Action {
		private readonly options: TextMarginOptions = {
			types: ['heading', 'paragraph'],
			maxIndentLevel: 5,
		};
		private readonly indent: string;

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button);
			const parts = name.split(':');
			this.indent = parts[1] ?? '';
		}

		clicked(editor: Editor) {
			if (this.indent === 'increase') {
				editor.chain().focus().increaseTextMargin().run();
			} else if (this.indent === 'decrease') {
				editor.chain().focus().decreaseTextMargin().run();
			} else {
				editor.chain().focus().unsetTextMargin().run();
			}
			this.activate(editor);
		}

		activate(editor: Editor) {
			this.button.classList.toggle('active', editor.isActive({textMargin: this.indent}));
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			if (!extensions.find(e => e.name === 'textMargin')) {
				extensions.push(TextMargin.configure(this.options));
			}
		}
	}

	export class OrderedListAction extends Action {
		protected readonly extensions = [OrderedList, ListItem];

		clicked(editor: Editor) {
			editor.chain().focus().toggleOrderedList().run();
			this.activate(editor);
		}
	}

	export class HorizontalRuleAction extends Action {
		protected readonly extensions = [HorizontalRule];

		clicked(editor: Editor) {
			editor.chain().focus().setHorizontalRule().run();
		}
	}

	export class ClearFormatAction extends Action {
		clicked(editor: Editor) {
			editor.chain().focus().clearNodes().unsetAllMarks().run();
			this.activate(editor);
		}
	}

	export class UndoAction extends Action {
		protected readonly extensions = [History];

		clicked(editor: Editor) {
			editor.commands.undo();
		}
	}

	export class RedoAction extends Action {
		protected readonly extensions = [History];

		clicked(editor: Editor) {
			editor.commands.redo();
		}
	}

	export class HeadingAction extends DropdownAction {
		private readonly defaultIcon: Element;
		private readonly levels: Array<Level> = [];

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button, '[richtext-click^="heading:"]');
			if (this.dropdownMenu) {
				this.dropdownItems.forEach(element => this.levels.push(this.extractLevel(element)));
			} else {
				this.levels.push(this.extractLevel(this.button));
			}
			this.defaultIcon = this.button.querySelector('svg')?.cloneNode(true) as Element;
		}

		private extractLevel(element: Element) : Level {
			const parts = element.getAttribute('richtext-click')?.split(':') ?? [];
			if (parts.length !== 2)
				throw new Error(`Element ${element} requires attribute 'richtext-click'.`);
			const level = parseInt(parts[1]) as Level;
			return level;
		}

		clicked() {}

		activate(editor: Editor) {
			if (this.dropdownMenu) {
				let isActive = false;
				this.dropdownItems.forEach(element => {
					const level = this.extractLevel(element);
					const icon = element.querySelector('svg')?.cloneNode(true);
					if (editor.isActive('heading', {level}) && icon) {
						this.button.replaceChildren(icon);
						isActive = true;
					}
				});
				this.button.classList.toggle('active', isActive);
				if (!isActive) {
					this.button.replaceChildren(this.defaultIcon);
				}
			} else {
				const level = this.extractLevel(this.button);
				this.button.classList.toggle('active', editor.isActive('heading', {level}));
			}
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			let unmergedOptions = true;
			extensions.forEach(e => {
				if (e.name === 'heading') {
					e.options.levels.push(...this.levels);
					unmergedOptions = false;
				}
			});
			if (unmergedOptions) {
				extensions.push(Heading.configure({
					levels: this.levels,
				}));
			}
		}

		protected toggleMenu(editor: Editor, force?: boolean) {
			super.toggleMenu(editor, force);
			this.dropdownItems.forEach(element => {
				const level = this.extractLevel(element);
				element.parentElement?.classList.toggle('active', editor.isActive('heading', {level}));
			});
		}

		protected toggleItem(event: MouseEvent, editor: Editor) {
			let element = event.target instanceof Element ? event.target : null;
			while (element) {
				if (this.dropdownItems.length === 0) {
					if (element === this.button) {
						const level = this.extractLevel(element);
						editor.chain().focus().setHeading({level: level}).run();
						this.activate(editor);
						break;
					}
				} else if (element.role === 'menuitem') {
					const level = this.extractLevel(element);
					editor.chain().focus().setHeading({level: level}).run();
					this.activate(editor);
					this.toggleMenu(editor, false);
					const icon = element.querySelector('svg')?.cloneNode(true);
					if (icon) {
						this.button.replaceChildren(icon);
					}
					break;
				}
				element = element.parentElement;
			}
		}
	}

	export class TextAlignAction extends DropdownAction {
		private readonly defaultIcon: Element;
		private readonly options: TextAlignOptions = {
			types: ['heading', 'paragraph'],
			alignments: [],
			defaultAlignment: '',
		};

		constructor(wrapperElement: HTMLElement, name: string, button: HTMLButtonElement) {
			super(wrapperElement, name, button, '[richtext-click^="alignment:"]');
			if (this.dropdownMenu) {
				this.dropdownItems.forEach(element => {
					this.options.alignments.push(this.extractAlignment(element));
				});
			} else {
				this.options.alignments.push(this.extractAlignment(this.button));
			}
			this.defaultIcon = this.button.querySelector('svg')?.cloneNode(true) as Element;
		}

		private extractAlignment(element: Element) : string {
			const parts = element.getAttribute('richtext-click')?.split(':') ?? [];
			if (parts.length !== 2)
				throw new Error(`Element ${element} requires attribute 'richtext-click'.`);
			return parts[1];
		}

		clicked() {}

		activate(editor: Editor) {
			if (this.dropdownMenu) {
				let isActive = false;
				this.dropdownItems.forEach(element => {
					const alignment = this.extractAlignment(element);
					const icon = element.querySelector('svg')?.cloneNode(true);
					if (editor.isActive({textAlign: alignment}) && icon) {
						this.button.replaceChildren(icon);
						isActive = true;
					}
				});
				// do not toggle dropdown button's class "active", because text is somehow always aligned
				if (!isActive) {
					this.button.replaceChildren(this.defaultIcon);
				}
			} else {
				const alignment = this.extractAlignment(this.button);
				this.button.classList.toggle('active', editor.isActive({textAlign: alignment}));
			}
		}

		extendExtensions(extensions: Array<Extension|Mark|Node>) {
			let unmergedOptions = true;
			extensions.forEach(e => {
				if (e.name === 'textAlign') {
					e.options.alignments.push(...this.options.alignments);
					unmergedOptions = false;
				}
			});
			if (unmergedOptions) {
				extensions.push(TextAlign.configure(this.options));
			}
		}

		protected toggleMenu(editor: Editor, force?: boolean) {
			super.toggleMenu(editor, force);
			this.dropdownItems.forEach(element => {
				const alignment = this.extractAlignment(element);
				element.parentElement?.classList.toggle('active', editor.isActive({textAlign: alignment}));
			});
		}

		protected toggleItem(event: MouseEvent, editor: Editor) {
			let element = event.target instanceof Element ? event.target : null;
			while (element) {
				if (element.role === 'menuitem') {
					const alignment = this.extractAlignment(element);
					editor.chain().focus().setTextAlign(alignment).run();
					this.activate(editor);
					this.toggleMenu(editor, false);
					const icon = element.querySelector('svg')?.cloneNode(true);
					if (icon) {
						this.button.replaceChildren(icon);
					}
					break;
				}
				element = element.parentElement;
			}
		}
	}

}


interface FormDialogOptions {
	/**
	* A list of HTML attributes to be rendered.
	*/
	HTMLAttributes: Record<string, any>;
}


class RichtextFormDialog extends FormDialogBase {
	private readonly richtext: RichtextArea;
	private readonly inputElements = new Array<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>();
	private textSelectionField: HTMLInputElement|null = null;
	private applyAttributes: Function = () => {};
	private revertAttributes: Function = () => {};
	private readonly induceButton: HTMLButtonElement;
	private readonly closeButtons = new Array<HTMLButtonElement>();
	private applyButton: HTMLButtonElement|null = null;
	private revertButton: HTMLButtonElement|null = null;
	public readonly extension: string;

	constructor(element: HTMLDialogElement, button: HTMLButtonElement, richtext: RichtextArea) {
		super(element);
		this.induceButton = button;
		this.richtext = richtext;
		const extension = this.formElement.getAttribute('richtext-extension');
		if (!extension)
			throw new Error(`${this} requires a <form richtext-extension="…">`);
		this.extension = extension;
		this.initialize();
	}

	private initialize() {
		if (!this.formElement)
			throw new Error(`${this} requires a <form method="dialog">`);
		Array.from(this.formElement.elements).forEach(innerElement => {
			if (innerElement instanceof HTMLInputElement && innerElement.hasAttribute('richtext-selection')) {
				this.textSelectionField = innerElement;
			} else if (innerElement.hasAttribute('richtext-map-to') || innerElement.hasAttribute('richtext-map-from')) {
				this.inputElements.push(innerElement as HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement);
			} else if (innerElement instanceof HTMLButtonElement) {
				const action = innerElement.getAttribute('df-click');
				if (action?.startsWith('activate')) {
					this.closeButtons.push(innerElement);
				}
				if (action === 'activate("apply")') {
					this.applyButton = innerElement;
				}
				if (action === 'activate("revert")') {
					this.revertButton = innerElement;
				}
			}
		});
		this.induceButton.addEventListener('mouseenter', appearTooltip);
	}

	activate(editor: Editor) {
		this.induceButton.classList.toggle('active', editor.isActive(this.extension));
	}

	private addProseMirrorPlugins() {
		const self = this;
		return () => {
			const plugin = new Plugin({
				key: new PluginKey(self.extension),
				props: {
					handleDoubleClick: (view, pos, event) => {
						if (!(event.target instanceof HTMLElement) || event.button !== 0)
							return false;
						const attributes = getAttributes(view.state, self.extension);
						if (isEmpty(attributes))
							return false;
						const viewDesc = event.target.pmViewDesc;
						if (viewDesc) {
							self.richtext.editor.chain().focus()
								.setTextSelection({from: viewDesc.posAtStart, to: viewDesc.posAtEnd})
								.run();
						}
						self.openPrefilledDialog(attributes);
						return true;
					}
				},
			});
			return [plugin];
		}
	}

	public async createPlugin() : Promise<Mark|Node> {
		if (!(this.element.nextElementSibling instanceof HTMLScriptElement) || this.element.nextElementSibling.type !== 'text/plain')
			throw new Error(`Element ${this.element} requires a <script type="text/plain">…</script>`);
		const scriptElement = this.element.nextElementSibling as HTMLScriptElement;
		try {
			const plugin = scriptElement.getAttribute('tiptap-plugin');
			const response = await fetch(scriptElement.src);
			const extensionScript = parse(await response.text(), {startRule: 'FunctionCode'});
			const parsedScript = new Function('mergeAttributes', 'markPasteRule', `return ${extensionScript}`);
			const executedScript = parsedScript(mergeAttributes, markPasteRule);
			executedScript.addProseMirrorPlugins = this.addProseMirrorPlugins();
			switch (plugin) {
				case 'mark':
					this.applyAttributes = this.applyMarkAttributes;
					this.revertAttributes = this.revertMarkAttributes;
					return Mark.create<FormDialogOptions>(executedScript);
				case 'node':
					this.applyAttributes = this.applyNodeAttributes;
					this.revertAttributes = this.revertNodeAttributes;
					return Node.create<FormDialogOptions>(executedScript);
				default:
					throw new Error(`tiptap-plugin="${plugin}" <script type="text/plain"…> must be either "mark", "node" or "extension".`);
			}
		} catch (error) {
			throw new Error(`Error while parsing <script type="text/plain" tiptap-plugin="${this.extension}"></script>: ${error}.`);
		}
	}

	protected isButtonActive(path: Array<string>, action: string): boolean {
		if (action !== 'active')
			return false;
		const openButton = this.richtext.formDialogs.find(
			dialog => dialog.induceButton.name === path[0]
		)?.induceButton;
		if (openButton instanceof HTMLButtonElement)
			return openButton === document.activeElement;
		const closeButton = this.closeButtons.find(button => isEqual(button.name, path[0]));
		return closeButton === document.activeElement;
	}

	private openPrefilledDialog(attributes: Object) {
		this.revertButton?.removeAttribute('hidden');
		if (this.textSelectionField) {
			const {selection, doc} = this.richtext.editor.view.state;
			if (selection.empty)
				return;  // nothing selected
			this.textSelectionField.value = doc.textBetween(selection.from, selection.to, '');
		}
		this.inputElements.forEach(inputElement => {
			const mapping = inputElement.getAttribute('richtext-map-from');
			if (typeof mapping === 'string' && mapping.startsWith('{') && mapping.endsWith('}')) {
				const mapFunction = new Function('attributes', `return ${mapping}`);
				Object.entries(mapFunction(attributes)).forEach(([key0, value]) => {
					if (value) {
						if (typeof (inputElement as any)[key0] === 'object') {
							Object.entries(value).forEach(([key1, value]) => {
								(inputElement as any)[key0][key1] = value;
							});
						} else {
							(inputElement as any)[key0] = value;
						}
					}
				});
			} else if (mapping) {
				inputElement.value = getDataValue(attributes, mapping);
			} else {
				inputElement.value = getDataValue(attributes, inputElement.name);
			}
		});
		super.openDialog();
		this.richtext.textAreaElement.dispatchEvent(new Event('blur', {bubbles: true}));
	}

	protected openDialog() {
		if (this.element.open)
			return;
		this?.revertButton?.setAttribute('hidden', 'hidden');
		const editor = this.richtext.editor;
		if (this.textSelectionField) {
			const {selection, doc} = editor.view.state;
			if (selection.empty)
				return;  // nothing selected
			this.textSelectionField.value = doc.textBetween(selection.from, selection.to, '');
		}
		super.openDialog();
		this.element.style.maxWidth = `${this.richtext.wrapperElement.clientWidth}px`;  // prevent overflow
		this.richtext.textAreaElement.dispatchEvent(new Event('blur', {bubbles: true}));
	}

	protected closeDialog(...args: any[]) {
		if (!isString(args[1]))
			return;
		const editor = this.richtext.editor;
		if (args[1] === 'apply') {
			this.formElement.dispatchEvent(new Event('submit', {bubbles: true}));
			if (!this.formElement.checkValidity()) {
				// checkValidity() triggers the invalid event for each invalid input field
				return;
			}
			let attributes = {};
			this.inputElements.forEach(inputElement => {
				let mapFunction: Function;
				const mapping = inputElement.getAttribute('richtext-map-to')  ?? '';
				if (mapping.startsWith('{') && mapping.endsWith('}')) {
					mapFunction = new Function('elements', `return ${mapping}`);
				} else if (mapping) {
					mapFunction = (elements: HTMLFormControlsCollection) => ({[mapping]: inputElement.value});
				} else {
					mapFunction = (elements: HTMLFormControlsCollection) => ({[inputElement.name]: inputElement.value});
				}
				attributes = {...attributes, ...mapFunction(this.formElement.elements)};
			});
			this.applyAttributes(editor, attributes);
		} else if (args[1] === 'revert') {
			this.revertAttributes(editor);
		}
		// reset form to be pristine for the next invocation
		this.formElement.reset();
		super.closeDialog();
	}

	private applyMarkAttributes(editor: Editor, attributes: Object) {
		const selection = editor.view.state.selection;
		const markedEditor = editor.chain().focus()
			.extendMarkRange(this.extension)
			.setMark(this.extension, attributes);
		if (this.textSelectionField) {
			markedEditor.insertContentAt({from: selection.from, to: selection.to}, this.textSelectionField.value);
		}
		markedEditor.run();
	}

	private revertMarkAttributes(editor: Editor) {
		editor.chain().focus()
			.extendMarkRange(this.extension)
			.unsetMark(this.extension, {extendEmptyMarkRange: true})
			.run();
	}

	private applyNodeAttributes(editor: Editor, options: Object) {
		editor.chain().focus().insertContent({type: this.extension, attrs: options}).run();
	}

	private revertNodeAttributes(editor: Editor) {
		const {from, to} = editor.view.state.selection;
		editor.chain().focus().deleteRange({from, to}).run();
	}

	public updateOperability(...args: any[]) {
		super.updateOperability(...args);
		if (this.applyButton?.hasAttribute('auto-disable')) {
			this.applyButton.disabled = !this.formElement.checkValidity();
		}
	}
}


class RichtextArea {
	public readonly textAreaElement: HTMLTextAreaElement;
	private readonly menubarElement: HTMLElement|null;
	public readonly wrapperElement: HTMLElement;
	private readonly registeredActions = new Array<Action>();
	public readonly formDialogs = new Array<RichtextFormDialog>();
	private readonly useJson: boolean = false;
	private readonly attributesObserver: MutationObserver;
	private readonly resizeObserver: ResizeObserver;
	public editor!: Editor;
	private initialValue!: JSONContent|string;
	private characterCountTemplate?: Function;
	private charaterCountDiv: HTMLElement|null = null;
	private readonly baseSelector = '.dj-richtext-wrapper';
	public readonly initializedPromise: Promise<void>;
	public isInitialized = false;

	constructor(wrapperElement: HTMLElement, textAreaElement: HTMLTextAreaElement) {
		this.wrapperElement = wrapperElement;
		this.textAreaElement = textAreaElement;
		this.menubarElement = wrapperElement.querySelector('[role="menubar"]');
		this.useJson = Object.hasOwn(this.textAreaElement.dataset, 'content');
		if (!StyleHelpers.stylesAreInstalled(this.baseSelector)) {
			this.transferStyles();
		}
		this.attributesObserver = new MutationObserver(mutationsList => this.attributesChanged(mutationsList));
		this.resizeObserver = new ResizeObserver(() => this.wrapMenubar());
		this.initializedPromise = this.initialize();
	}

	private async initialize() {
		const initialContent = this.useJson ? JSON.parse(this.textAreaElement.dataset.content as string) : this.textAreaElement.textContent;
		return new Promise<void>(resolve => {
			this.createEditor(this.wrapperElement, initialContent).then(editor => {
				this.editor = editor;
				this.initialValue = this.getValue();
				this.concealTextArea(this.wrapperElement);
				if (this.useJson) {
					// innerHTML must reflect the content, otherwise field validation complains about a missing value
					this.textAreaElement.innerHTML = this.editor.getHTML();
				}
				this.updateCharCounter();
				this.installEventHandlers();
				this.attributesObserver.observe(this.textAreaElement, {attributes: true});
				if (this.menubarElement) {
					// to prevent flickering when loading the page, the visibility of the menubar is hidden
					this.menubarElement.style.visibility = '';
					this.resizeObserver.observe(this.menubarElement);
					this.wrapMenubar();
				}
				this.isInitialized = true;
				resolve();
			});
		});
	}

	private wrapMenubar() {
		this.menubarElement?.querySelectorAll('[role="group"]').forEach(element => {
			if (!(element instanceof HTMLElement) || !(element.nextElementSibling instanceof HTMLElement))
				return;
			const sameRow = element.offsetLeft < element.nextElementSibling.offsetLeft;
			element.classList.toggle('has-sibling', sameRow);
		});
	}

	private async createEditor(wrapperElement: HTMLElement, content: any) : Promise<Editor> {
		const extensions = new Array<Extension|Mark|Node>(
			Document,
			Paragraph,
			Text,
			HardBreak,  // always add hard breaks via keyboard entry
		);
		this.registerControlActions(extensions);
		await this.registerFormDialogs(extensions);
		this.registerPlaceholder(extensions);
		this.registerCharaterCount(extensions);
		const editor = new Editor({
			element: wrapperElement,
			extensions: extensions,
			content: content,
			autofocus: false,
			editable: !this.textAreaElement.disabled,
			injectCSS: false,
		});
		return editor;
	}

	private registerControlActions(extensions: Array<Extension|Mark|Node>) {
		this.menubarElement?.querySelectorAll('button[richtext-click]').forEach(button => {
			if (!(button instanceof HTMLButtonElement))
				return;
			const richtextClick = button.getAttribute('richtext-click');
			if (!richtextClick)
				throw new Error("Missing attribute 'richtext-click' on action button");
			const parts = richtextClick.split(':');
			const actionName = `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}Action`;
			const ActionClass = (<any>controls)[actionName];
			if (!(ActionClass?.prototype instanceof Action))
				throw new Error(`Unknown action class '${actionName}'.`);
			const actionInstance = new ActionClass(this.wrapperElement, richtextClick, button) as Action;
			this.registeredActions.push(actionInstance);
			actionInstance.extendExtensions(extensions);
		});
	}

	private async registerFormDialogs(extensions: Array<Extension|Mark|Node>) {
		return new Promise<void>(resolve => {
			const promises = new Array<Promise<Mark|Node>>();
			this.menubarElement?.querySelectorAll('button[df-click]').forEach(button => {
				if (!(button instanceof HTMLButtonElement))
					return;
				const dialogElement = this.wrapperElement?.querySelector(`:scope > dialog[df-induce-open="${button.name}:active"]`);
				if (dialogElement instanceof HTMLDialogElement) {
					const formDialog = new RichtextFormDialog(dialogElement, button, this);
					if (this.formDialogs.find(dialog => dialog.extension === formDialog.extension))
						throw new Error(`Duplicate dialog for extension ${formDialog.extension}`);
					this.formDialogs.push(formDialog);
					promises.push(formDialog.createPlugin());
				}
			});
			Promise.all(promises).then(plugins => {
				plugins.forEach(plugin => extensions.push(plugin));
				resolve();
			});
		});
	}

	private registerPlaceholder(extensions: Array<Extension|Mark|Node>) {
		const placeholderText = this.textAreaElement.getAttribute('placeholder');
		if (!placeholderText)
			return;
		extensions.push(Placeholder.configure({placeholder: placeholderText}));
	}

	private registerCharaterCount(extensions: Array<Extension|Mark|Node>) {
		const limit = parseInt(this.textAreaElement.getAttribute('maxlength') ?? '');
		if (limit > 0) {
			extensions.push(CharacterCount.configure({limit}));
			this.characterCountTemplate = template(`\${count}/${limit}`);
			this.charaterCountDiv = document.createElement('div');
			this.charaterCountDiv.classList.add('character-count');
			this.wrapperElement.insertAdjacentElement('beforeend', this.charaterCountDiv);
		}
	}

	private installEventHandlers() {
		this.editor.on('focus', this.focused);
		this.editor.on('update', this.updated);
		this.editor.on('blur', this.blurred);
		this.editor.on('selectionUpdate', this.selectionUpdate);
		const form = this.textAreaElement.form;
		form!.addEventListener('reset', this.formResetted);
		form!.addEventListener('submitted', this.formSubmitted);
		this.registeredActions.forEach(action => action.installEventHandler(this.editor));
	}

	private concealTextArea(wrapperElement: HTMLElement) {
		this.textAreaElement.classList.add('dj-concealed');
	}

	private focused = () => {
		this.wrapperElement.classList.add('focused');
		this.textAreaElement.dispatchEvent(new Event('focus'));
	};

	private updated = () => {
		this.textAreaElement.innerHTML = this.editor.getHTML();
		this.updateCharCounter();
		this.textAreaElement.dispatchEvent(new Event('input'));
	};

	private blurred = () => {
		this.registeredActions.forEach(action => action.deactivate());
		this.wrapperElement.classList.remove('focused');
		if (this.textAreaElement.required && this.editor.getText().length === 0) {
			this.wrapperElement.classList.remove('valid');
			this.wrapperElement.classList.add('invalid');
		} else {
			this.wrapperElement.classList.add('valid');
			this.wrapperElement.classList.remove('invalid');
		}
		this.textAreaElement.dispatchEvent(new Event('blur'));
	};

	private updateCharCounter = () => {
		if (this.charaterCountDiv && this.characterCountTemplate) {
			const context = {count: this.editor.storage.characterCount.characters()};
			this.charaterCountDiv.innerHTML = this.characterCountTemplate(context);
		}
	};

	private selectionUpdate = () => {
		this.registeredActions.forEach(action => action.activate(this.editor));
		this.formDialogs.forEach(dialog => dialog.activate(this.editor));
	};

	private formResetted = () => {
		const chain = this.editor.chain().clearContent();
		if (!this.editor.isEmpty) {
			if (this.useJson) {
				chain.insertContent((this.initialValue as any).content);
			} else {
				chain.insertContent(this.initialValue);
			}
			chain.run();
		}
	};

	private formSubmitted = () => {};

	private attributesChanged(mutationsList: Array<MutationRecord>) {
		for (const mutation of mutationsList) {
			if (mutation.type === 'attributes' && mutation.attributeName === 'data-content') {
				const content = JSON.parse(this.textAreaElement.dataset.content ?? '{"type": "doc"}');
				this.editor.chain().clearContent().insertContent(content).run();
			}
		}
	}

	private transferStyles() {
		const declaredStyles = document.createElement('style');
		declaredStyles.innerText = styles;
		document.head.appendChild(declaredStyles);
		if (!declaredStyles.sheet)
			throw new Error("Could not create <style> element");
		const sheet = declaredStyles.sheet;

		let loaded = false;
		const buttonGroupHeight = this.menubarElement?.getBoundingClientRect().height ?? 0;
		for (let index = 0; index < sheet.cssRules.length; index++) {
			const cssRule = sheet.cssRules.item(index) as CSSStyleRule;
			let extraStyles: string;
			switch (cssRule.selectorText) {
				case this.baseSelector:
					extraStyles = StyleHelpers.extractStyles(this.textAreaElement, [
						'height', 'background-image', 'border-style', 'border-width', 'border-radius', 'box-shadow',
						'outline', 'resize',
					]);
					extraStyles = extraStyles.concat(`min-height:${buttonGroupHeight * 2}px;`);
					sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
					loaded = true;
					break;
				case `${this.baseSelector}.focused`:
					this.textAreaElement.style.transition = 'none';
					this.textAreaElement.focus();
					extraStyles = StyleHelpers.extractStyles(this.textAreaElement, [
						'border', 'box-shadow', 'outline']);
					this.textAreaElement.blur();
					sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
					this.textAreaElement.style.transition = '';
					break;
				case `.dj-submitted ${this.baseSelector}.focused.invalid`:
					this.textAreaElement.style.transition = 'none';
					this.textAreaElement.classList.add('-focus-', '-invalid-', 'is-invalid');  // is-invalid is a Bootstrap hack
					extraStyles = StyleHelpers.extractStyles(this.textAreaElement, [
						'border', 'box-shadow', 'outline']);
					this.textAreaElement.classList.remove('-focus-', '-invalid-', 'is-invalid');
					sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
					this.textAreaElement.style.transition = '';
					break;
				case `${this.baseSelector} .ProseMirror`:
					extraStyles = StyleHelpers.extractStyles(this.textAreaElement, [
						'font-family', 'font-size', 'font-stretch', 'font-style', 'font-weight', 'letter-spacing',
						'white-space', 'line-height', 'overflow', 'padding']);
					extraStyles = extraStyles.concat(`top:${buttonGroupHeight + 1}px;`);
					sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
					break;
				case `${this.baseSelector} [role="menubar"]`:
					extraStyles = StyleHelpers.extractStyles(this.textAreaElement, [
						'border-bottom-style', 'border-bottom-width',
					]);
					sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
					break;
				case `${this.baseSelector} [role="menubar"] button[aria-haspopup="true"] + ul[role="menu"]`:
					extraStyles = StyleHelpers.extractStyles(this.textAreaElement, ['border-radius', 'z-index']);
					const re = new RegExp('z-index:(\\d+);');
					const matches = extraStyles.match(re);
					if (matches) {
						extraStyles = extraStyles.replace(re, `z-index:${parseInt(matches[1]) + 1}`);
					} else {
						extraStyles = extraStyles.replace('z-index:auto;', 'z-index:1;');
					}
					sheet.insertRule(`${cssRule.selectorText}{${extraStyles}}`, ++index);
					break;
				default:
					break;
			}
		}

		// border color may change during runtime
		StyleHelpers.pushMediaQueryStyles([[
			sheet,
			this.baseSelector,
			{'--border-color': 'border-color'},
			this.textAreaElement,
		]]);

		if (!loaded)
			throw new Error(`Could not load styles for ${this.baseSelector}`);
		// window.matchMedia('(prefers-color-scheme: dark)').onchange = () => mediaQueryStyle();
	}

	public disconnect() {
		// TODO: remove event handlers
	}

	public getValue() : JSONContent|string {
		if (this.editor === undefined || this.editor.isEmpty)
			return '';  // otherwise empty field is not detected by calling function
		return this.useJson ? this.editor.getJSON() : this.editor.getHTML();
	}

	public updateOperability(...args: any[]) : void {
		this.formDialogs.forEach(dialog => dialog.updateOperability(...args));
	}
}


const RA = Symbol('RichtextArea');

export class RichTextAreaElement extends HTMLTextAreaElement {
	isInitialized = false;
	private [RA]: RichtextArea;  // hides internal implementation

	constructor() {
		super();
		const wrapperElement = this.previousElementSibling;
		if (!(wrapperElement instanceof HTMLElement && wrapperElement.classList.contains('dj-richtext-wrapper')))
			throw new Error(`${this} must be a child of '<ANY class="dj-richtext-wrapper">' element.`);
		this[RA] = new RichtextArea(wrapperElement, this);
	}

	connectedCallback() {
		this[RA].initializedPromise.then(() => {
			this.isInitialized = true;
			this.dispatchEvent(new CustomEvent('initialized'));
		});
	}

	disconnectCallback() {
		this[RA].disconnect();
	}

	get value() : any {
		return this[RA].getValue();
	}

	updateOperability(...args: any[]) : void {
		this[RA].updateOperability(...args);
	}
}
