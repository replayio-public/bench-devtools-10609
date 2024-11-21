import React from "react";
import { Priority } from "../models/text-property";
import styles from "./DeclarationPriority.module.css";

interface DeclarationPriorityProps {
  priority?: Priority;
}

const DeclarationPriority: React.FC<DeclarationPriorityProps> = ({ priority }) => {
  if (!priority) {
    return null;
  }

  return (
    <span className={styles["declaration-priority"]} title="This rule has !important priority">
      !{priority}
    </span>
  );
};

export default DeclarationPriority;
