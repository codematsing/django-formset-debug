// Do not mix this Tiptap extension with `@tiptap/extension-text-style`
// as they interfere making this extension unusable
import {Mark} from '@tiptap/core';

export interface ClassBasedOptions {
	allowedClasses: string[];
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		classBased: {
			setClass: (name: string, cssClass: string) => ReturnType,
			unsetClass: (name: string) => ReturnType,
		}
	}
}


export const ClassBasedMark = Mark.create<ClassBasedOptions>({
	name: 'classBasedMark',

	addOptions() {
		return {
			allowedClasses: [],
		}
	},

	addAttributes() {
		return {
			[this.name]: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					for (let cssClass of this.options.allowedClasses) {
						if (element.classList.contains(cssClass))
							return cssClass;
					}
				},
				renderHTML: (attributes: Record<string, any>) => {
					return {class: attributes[this.name]};
				},
			},
		};
	},

	parseHTML() {
		return [{
			tag: 'span',
			getAttrs: (element: HTMLElement) => {
				if (element instanceof HTMLElement) {
					if (this.options.allowedClasses.some(cssClass => element.classList.contains(cssClass)))
						return {};
				}
				return false;
			},
		}];
	},

	renderHTML({HTMLAttributes}) {
		return ['span', HTMLAttributes, 0];
	},

	addCommands() {
		return {
			setClass: (name: string, cssClass: string) => ({commands}) => {
				return commands.setMark(name, {[name]: cssClass});
			},
			unsetClass: (name: string) => ({commands}) => {
				return commands.unsetMark(name);
			},
		}
	},
});
