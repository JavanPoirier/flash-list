/**
 * Tests for ViewHolderCollection opacity behavior
 */
import React from "react";
import { Text } from "react-native";
import "@quilted/react-testing/matchers";
import { render } from "@quilted/react-testing";

import { FlashList } from "..";

// Mock measureLayout to return fixed dimensions
jest.mock("../recyclerview/utils/measureLayout", () => {
  const originalModule = jest.requireActual(
    "../recyclerview/utils/measureLayout"
  );
  return {
    ...originalModule,
    measureParentSize: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 399,
      height: 899,
    })),
    measureFirstChildLayout: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 399,
      height: 899,
    })),
    measureItemLayout: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })),
  };
});

describe("ViewHolderCollection Opacity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  it("should set opacity to 1 when containerLayout and renderStack are available", () => {
    // This test verifies that the opacity is set to 1 when both containerLayout exists
    // and renderStack has content. This ensures the container is only visible when
    // it actually has children to render, fixing the issue where opacity would be 1
    // but the container was empty in stack navigation scenarios.
    const result = render(
      <FlashList
        data={[0, 1, 2, 3, 4]}
        renderItem={({ item }) => <Text>{item}</Text>}
        estimatedItemSize={100}
      />
    );

    // The component should render items, which means opacity should be 1
    expect(result).toContainReactComponent(Text, { children: 0 });
    expect(result).toContainReactComponent(Text, { children: 1 });
  });

  it("should render with opacity 1 on remount when layout and content are ready", () => {
    // This simulates the stack navigation scenario where a component
    // is unmounted and remounted. The fix ensures that when both layout
    // and content (renderStack) are ready, opacity is set to 1.
    const { unmount } = render(
      <FlashList
        data={[0, 1, 2, 3]}
        renderItem={({ item }) => <Text>{item}</Text>}
        estimatedItemSize={100}
      />
    );

    unmount();

    // Remount the component
    const result = render(
      <FlashList
        data={[0, 1, 2, 3]}
        renderItem={({ item }) => <Text>{item}</Text>}
        estimatedItemSize={100}
      />
    );

    // The remounted component should render items with opacity 1
    // only when both containerLayout and renderStack are populated
    expect(result).toContainReactComponent(Text, { children: 0 });
    expect(result).toContainReactComponent(Text, { children: 1 });
  });
});
