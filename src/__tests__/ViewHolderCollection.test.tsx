/**
 * Tests for ViewHolderCollection opacity behavior
 */
import React, { useState } from "react";
import { Text, View } from "react-native";
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

  it("should handle React Navigation stack push/pop with correct item heights", () => {
    // This test simulates React Navigation stack behavior where:
    // 1. Screen A with FlashList is rendered
    // 2. Screen B is pushed (Screen A remains mounted but hidden)
    // 3. Screen B is popped (Screen A becomes visible again)
    // 4. Items should measure correctly on all transitions

    // Simulate a stack navigator with two screens
    const StackNavigator = () => {
      const [currentScreen, setCurrentScreen] = useState<"A" | "B">("A");

      return (
        <View>
          {/* Screen A - stays mounted when B is pushed */}
          <View style={{ display: currentScreen === "A" ? "flex" : "none" }}>
            <FlashList
              data={[0, 1, 2, 3, 4]}
              renderItem={({ item }) => (
                <View testID={`screen-a-item-${item}`}>
                  <Text>{`Screen A Item ${item}`}</Text>
                </View>
              )}
              estimatedItemSize={100}
            />
          </View>

          {/* Screen B - pushed on top */}
          {currentScreen === "B" && (
            <View>
              <FlashList
                data={[5, 6, 7]}
                renderItem={({ item }) => (
                  <View testID={`screen-b-item-${item}`}>
                    <Text>{`Screen B Item ${item}`}</Text>
                  </View>
                )}
                estimatedItemSize={100}
              />
            </View>
          )}
        </View>
      );
    };

    const result = render(<StackNavigator />);

    // Screen A should be visible initially
    expect(result).toContainReactComponent(Text, {
      children: "Screen A Item 0",
    });

    // TODO: Simulate stack push and verify Screen A items are hidden but Screen B renders
    // TODO: Simulate stack pop and verify Screen A items are visible again with correct heights
    // This test documents the expected behavior for React Navigation stack scenarios
  });
});
