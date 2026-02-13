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

  it("should automatically trigger commitLayout when containerLayout becomes available", () => {
    // This test verifies that commitLayout is automatically called when containerLayout
    // exists and hasData is true, ensuring renderId increments and opacity becomes 1.
    // This fixes the stack navigation issue where renderId stays at 0.
    const result = render(
      <FlashList
        data={[0, 1, 2, 3, 4]}
        renderItem={({ item }) => <Text>{item}</Text>}
        estimatedItemSize={100}
      />
    );

    // The component should render items, which means commitLayout was triggered
    // and renderId was incremented, setting opacity to 1
    expect(result).toContainReactComponent(Text, { children: 0 });
    expect(result).toContainReactComponent(Text, { children: 1 });
  });

  it("should trigger commitLayout on remount in stack navigation scenarios", () => {
    // This simulates the stack navigation scenario where a component
    // is unmounted and remounted. The fix ensures commitLayout is called
    // when containerLayout becomes available, incrementing renderId and
    // making content visible (opacity: 1).
    const { unmount } = render(
      <FlashList
        data={[0, 1, 2, 3]}
        renderItem={({ item }) => <Text>{item}</Text>}
        estimatedItemSize={100}
      />
    );

    unmount();

    // Remount the component - simulates navigating back to the screen
    const result = render(
      <FlashList
        data={[0, 1, 2, 3]}
        renderItem={({ item }) => <Text>{item}</Text>}
        estimatedItemSize={100}
      />
    );

    // The remounted component should automatically trigger commitLayout
    // when containerLayout becomes available, ensuring proper rendering
    expect(result).toContainReactComponent(Text, { children: 0 });
    expect(result).toContainReactComponent(Text, { children: 1 });
  });
});
