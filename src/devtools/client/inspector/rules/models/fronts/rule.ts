import { Object as ProtocolObject, Rule } from "@replayio/protocol";
import QuickLRU from "shared/utils/quick-lru";

import { assert } from "protocol/utils";
import { getCachedObject } from "replay-next/src/suspense/ObjectPreviews";

import { StyleFront } from "./style";
import { StyleSheetFront } from "./styleSheet";

const cachedSelectorStrings = new QuickLRU<string, string[]>({
  maxSize: 3000,
});
const cachedSelectorText = new QuickLRU<string, string>({
  maxSize: 3000,
});

// Manages interaction with a CSSRule.
export class RuleFront {
  private pauseId: string;
  private _object: ProtocolObject;
  private _rule: Rule;
  private _styleFront: StyleFront | null = null;
  private _styleSheetFront: StyleSheetFront | null = null;

  constructor(pauseId: string, data: ProtocolObject) {
    this.pauseId = pauseId;
    assert(data && data.preview && data.preview.rule, "no rule preview");
    this._object = data;
    this._rule = data.preview.rule;
  }

  objectId() {
    return this._object.objectId;
  }

  isRule() {
    return true;
  }

  /**
   * The type of CSS rule.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants.
   */
  get type() {
    return this._rule.type;
  }

  get cssText() {
    return this._rule.cssText;
  }

  get cleanedSelectorText() {
    if (cachedSelectorText.has(this._rule.selectorText!)) {
      return cachedSelectorText.get(this._rule.selectorText!)!;
    }

    const selectorText = this.selectors.join(", ");
    cachedSelectorText.set(this._rule.selectorText!, selectorText);
    return selectorText;
  }

  get selectors() {
    if (cachedSelectorStrings.has(this._rule.selectorText!)) {
      return cachedSelectorStrings.get(this._rule.selectorText!)!;
    }

    const selectors = this._rule.selectorText!.split(",").map(s => s.trim());
    cachedSelectorStrings.set(this._rule.selectorText!, selectors);
    return selectors;
  }

  get style() {
    if (this._rule.style) {
      if (!this._styleFront) {
        // `ElementStyle` makes sure this data is cached already
        this._styleFront = new StyleFront(getCachedObject(this.pauseId, this._rule.style!)!);
      }
      return this._styleFront;
    }
    return null;
  }

  get parentStyleSheet() {
    if (this._rule.parentStyleSheet) {
      if (!this._styleSheetFront) {
        this._styleSheetFront = new StyleSheetFront(
          getCachedObject(this.pauseId, this._rule.parentStyleSheet!)!
        );
      }
      return this._styleSheetFront;
    }
    return null;
  }

  get href() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.href;
    }
    return this.parentStyleSheet && this.parentStyleSheet.href;
  }

  /**
   * Whether or not the rule is an user agent style.
   */
  get isSystem() {
    return this.parentStyleSheet && this.parentStyleSheet.isSystem;
  }

  get line() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.startLine;
    }
    return this._rule.startLine;
  }

  get column() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.startColumn;
    }
    return this._rule.startColumn;
  }

  get mediaText() {
    // NYI
    return undefined;
  }

  /**
   * Calculate the specificity of a selector.
   * Returns an array of three numbers representing [id, class, type] counts.
   * For example: "#foo.bar p" returns [1, 1, 1]
   */
  private calculateSelectorSpecificity(selector: string): [number, number, number] {
    let idCount = 0;
    let classCount = 0;
    let typeCount = 0;

    selector = selector.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

    idCount = (selector.match(/#[a-z0-9_-]+/gi) || []).length;

    classCount = (selector.match(/\.[a-z0-9_-]+|\[.+?\]|:[a-z0-9_-]+/gi) || []).length;
    classCount -= (selector.match(/::[a-z0-9_-]+/gi) || []).length;
    classCount -= (selector.match(/:not\([^)]*\)/gi) || []).length;

    typeCount = (selector.match(/[a-z0-9]+|::[a-z0-9_-]+/gi) || []).length;

    return [idCount, classCount, typeCount];
  }

  /**
   * Get the specificity of the rule's selectors.
   * Returns an array of specificities for each selector in the rule.
   */
  get specificity(): [number, number, number][] {
    return this.selectors.map(selector => this.calculateSelectorSpecificity(selector));
  }

  /**
   * Get the highest specificity among all selectors in the rule.
   */
  get highestSpecificity(): [number, number, number] {
    const specificities = this.specificity;
    return specificities.reduce((highest, current) => {
      if (current[0] > highest[0] || 
          (current[0] === highest[0] && current[1] > highest[1]) ||
          (current[0] === highest[0] && current[1] === highest[1] && current[2] > highest[2])) {
        return current;
      }
      return highest;
    }, [0, 0, 0] as [number, number, number]);
  }
}
