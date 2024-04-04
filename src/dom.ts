export const $: Document["querySelectorAll"] = (query: string) => document.querySelectorAll(query);
export const getElementById: Document["getElementById"] = (id) => document.getElementById(id);
export const getElementsByTagName: Document["getElementsByTagName"] = (name: string) =>
  document.getElementsByTagName(name);

export const createElement: Document["createElement"] = (tag: any, options: any) =>
  document.createElement(tag, options);

export const h = <T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  properties: Partial<HTMLElementTagNameMap[T]> = {},
  ...children: Node[]
): HTMLElementTagNameMap[T] => {
  const element = createElement(tagName);
  Object.assign(element, properties);
  element.append(...children);
  return element;
};
