export function elementCreate<S extends string>(selector: S): ElementFromSelector<S> {
  // Extract parent and child parts if `>` exists
  const [parentSelector, ...childSelectors] = selector.split(">").map(s => s.trim());

  // Extract the tag name
  const tagMatch = parentSelector.match(/^([a-z1-6]+)/i);

  const tag = tagMatch ? tagMatch[1] : 'div';
  const element = document.createElement(tag);

  // Extract ID and classes
  const idMatch = parentSelector.match(/#([\w-]+)/);
  // Set ID if found
  if (idMatch) {
    element.id = idMatch[1];
  }

  // Step 1: Remove `[attributes="..."]` and `:contains("...")` before extracting classes
  const cleanedSelector = parentSelector
    .replace(/\[.*?]/g, "") // Remove `[attr="value"]`
    .replace(/:contains\(["'].*?["']\)/g, "") // Remove `:contains("text")`
    .replace(/:checked/g, ""); // Remove `:checked`
  // Step 2: Extract class names from the cleaned selector
  const classMatches = [...cleanedSelector.matchAll(/\.[\w-]+/g)].map(m => m[0].slice(1));
  if (classMatches.length > 0) {
    element.classList.add(...classMatches);
  }
  // Extract attributes (matches `[key="value"]`)
  const attrMatches = [...parentSelector.matchAll(/\[([\w-]+)="([^"]+)"]/g)];
  for (const [, key, value] of attrMatches) {
    element.setAttribute(key, value);
  }
  // Extract text content using `:contains("Text")`
  const textMatch = parentSelector.match(/:contains\(["']([^"']+)["']\)/);
  if (textMatch) {
    element.textContent = textMatch[1];
  }
  // **Handle `:checked`**
  if (parentSelector.includes(":checked") && "checked" in element) {
    (element as HTMLInputElement).checked = true;
  }

  // Handle children > and multiple with ,
  if (childSelectors.length > 0) {
    if (childSelectors.length > 1) {
      const childElement = elementCreate(childSelectors.join(" > "));
      element.appendChild(childElement);
    } else {
      const children = childSelectors.pop()!.split(',').map(s => s.trim());
      for (const childSelector of children) {
        const childElement = elementCreate(childSelector);
        element.appendChild(childElement);
      }
    }
  }
  return element as ElementFromSelector<S>;
}

// Claude: Better approach using a more direct type inference method
type ExtractTagName<S extends string> =
  S extends `${infer T}#${string}` | `${infer T}.${string}` | `${infer T}[${string}` | `${infer T}:${string}` | `${infer T} > ${string}` ?
    T extends keyof HTMLElementTagNameMap ? T : never :
    S extends keyof HTMLElementTagNameMap ? S : never;

type ElementFromSelector<S extends string> =
  ExtractTagName<S> extends keyof HTMLElementTagNameMap ?
    HTMLElementTagNameMap[ExtractTagName<S>] :
    HTMLElement;