import { Action } from "redux";
import ElementStyle from "../../rules/models/element-style";
import { ComputedPropertyState, MatchedSelectorState } from "../state";
import CSSProperties from "../../css-properties";
const { OutputParser } = require("devtools/client/shared/output-parser");

type SetComputedPropertiesAction = Action<"set_computed_properties"> & {
  properties: ComputedPropertyState[];
};
type SetComputedPropertySearchAction = Action<"set_computed_property_search"> & { search: string };
type SetShowBrowserStylesAction = Action<"set_show_browser_styles"> & { show: boolean };
type SetComputedPropertyExpandedAction = Action<"set_computed_property_expanded"> & {
  property: string;
  expanded: boolean;
};
export type ComputedAction =
  | SetComputedPropertiesAction
  | SetComputedPropertySearchAction
  | SetShowBrowserStylesAction
  | SetComputedPropertyExpandedAction;

export function setComputedProperties(elementStyle: ElementStyle): SetComputedPropertiesAction {
  return { type: "set_computed_properties", properties: createComputedProperties(elementStyle) };
}

export function setComputedPropertySearch(search: string): SetComputedPropertySearchAction {
  return { type: "set_computed_property_search", search };
}

export function setShowBrowserStyles(show: boolean): SetShowBrowserStylesAction {
  return { type: "set_show_browser_styles", show };
}

export function setComputedPropertyExpanded(
  property: string,
  expanded: boolean
): SetComputedPropertyExpandedAction {
  return { type: "set_computed_property_expanded", property, expanded };
}

const outputParser = new OutputParser(document, CSSProperties);

function createComputedProperties(elementStyle: ElementStyle): ComputedPropertyState[] {
  const computed = elementStyle.element.getComputedStyle();
  if (!computed) return [];

  const properties: ComputedPropertyState[] = [];
  for (const [name, value] of computed) {
    let inheritanceCounter = 1;
    const selectors: MatchedSelectorState[] = [];
    for (const rule of elementStyle.rules) {
      if (rule.isUnmatched) continue;

      let selector: string;
      let stylesheet: string;
      let stylesheetURL: string;
      if (rule.domRule.isRule()) {
        // this is not an inline style
        selector = rule.selectorText;
        stylesheet = rule.sourceLink.label || "";
        stylesheetURL = rule.domRule.href || "";
      } else {
        if (rule.inherited) {
          // this is an inherited inline style
          if (rule.inherited.id) {
            selector = `#${rule.inherited.id}.style`;
          } else {
            selector = `${rule.inherited.displayName.toUpperCase()}[${inheritanceCounter}].style`;
            inheritanceCounter++;
          }
        } else {
          // this is the selected element's own inline style
          selector = "this.style";
        }
        stylesheet = "element";
        stylesheetURL = "#";
      }

      for (const declaration of rule.declarations) {
        for (const property of declaration.computed || []) {
          if (property.name === name) {
            const parsedValue = outputParser.parseCssProperty(name, property.value);
            selectors.push({
              value: property.value,
              parsedValue,
              selector,
              stylesheet,
              stylesheetURL,
              overridden: !!property.overridden,
            });
          }
        }
      }
    }

    const parsedValue = outputParser.parseCssProperty(name, value);

    properties.push({
      name,
      value,
      parsedValue,
      selectors,
    });
  }

  return properties;
}
