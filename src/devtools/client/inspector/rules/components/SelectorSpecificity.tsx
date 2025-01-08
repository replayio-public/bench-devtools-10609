/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";

interface SelectorSpecificityProps {
  specificity: [number, number, number];
}

/**
 * Component that displays the specificity of a CSS selector.
 * The specificity is displayed as three numbers representing the count of:
 * - ID selectors (#foo)
 * - Class selectors (.foo), attribute selectors ([foo]), and pseudo-classes (:foo)
 * - Type selectors (div) and pseudo-elements (::before)
 */
export default function SelectorSpecificity({ specificity }: SelectorSpecificityProps) {
  const [idCount, classCount, typeCount] = specificity;
  const total = idCount * 100 + classCount * 10 + typeCount;

  return (
    <span className="ruleview-specificity" title={`Specificity: ${idCount},${classCount},${typeCount}`}>
      ({total})
    </span>
  );
}
