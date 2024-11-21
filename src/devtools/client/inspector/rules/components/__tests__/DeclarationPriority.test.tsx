import React from "react";
import { render, screen } from "@testing-library/react";
import DeclarationPriority from "../DeclarationPriority";

describe("DeclarationPriority", () => {
  it("renders nothing when no priority is provided", () => {
    const { container } = render(<DeclarationPriority />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the priority when provided", () => {
    render(<DeclarationPriority priority="important" />);
    expect(screen.getByText("!important")).toBeInTheDocument();
  });

  it("includes a helpful tooltip", () => {
    render(<DeclarationPriority priority="important" />);
    expect(screen.getByTitle("This rule has !important priority")).toBeInTheDocument();
  });
});
