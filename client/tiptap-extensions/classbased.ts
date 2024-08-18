import {Extension, Mark} from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		classBasedMark: {
			setMarkClass: (name: string, cssClass: string) => ReturnType,
			unsetMarkClass: (name: string) => ReturnType,
		},
		classBasedNode: {
			setNodeClass: (name: string, cssClass: string) => ReturnType,
			unsetNodeClass: (name: string) => ReturnType,
		},
	}
}


export const ClassBasedMark = Mark.create({
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
					if (this.options.allowedClasses.some((cssClass: string) => element.classList.contains(cssClass)))
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
			setMarkClass: (name: string, cssClass: string) => ({commands}) => {
				return commands.setMark(name, {[name]: cssClass});
			},
			unsetMarkClass: (name: string) => ({commands}) => {
				return commands.unsetMark(name);
			},
		}
	},
});


export const ClassBasedNode = Extension.create({
	name: 'classBasedNode',

	addGlobalAttributes() {
		console.log(this);
		return [{
			types: ['paragraph'],
			attributes: {
				cssClass: {
					default: null,
					parseHTML: element => element.getAttribute('class') ?? '',
					renderHTML: attributes => {
						if (!attributes.cssClass)
							return {};
						return {
							'class': attributes.cssClass,
						}
					},
				},
			},
		}];
	},

	addCommands() {
		return {
			setNodeClass: (name: string, cssClass: string) => ({commands}) => {
				return commands.updateAttributes('paragraph', {cssClass});
			},
			unsetNodeClass: (name: string) => ({commands}) => {
				return commands.resetAttributes('paragraph', ['cssClass']);
			},
		};
	},

});
