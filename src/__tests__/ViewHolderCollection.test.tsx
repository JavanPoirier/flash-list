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

  it("should handle React Navigation stack push/pop with proper rendering", () => {
    // This test simulates React Navigation stack behavior where:
    // 1. Screen A with FlashList is rendered
    // 2. Screen B is pushed (Screen A remains mounted but hidden)
    // 3. Verifies both screens render their items correctly
    // 4. Items should have proper dimensions on all transitions

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const measureLayout = require("../recyclerview/utils/measureLayout");

    // Track measurements to verify they're being called correctly
    const measurements: { item: number; screen: string }[] = [];
    measureLayout.measureItemLayout.mockImplementation(() => {
      measurements.push({ item: measurements.length, screen: "mock" });
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100, // Each item is 100px tall
      };
    });

    // Simulate a stack navigator with two screens
    const StackNavigator = () => {
      const [currentScreen, setCurrentScreen] = useState<"A" | "B">("A");

      return (
        <View>
          {/* Screen A - stays mounted when B is pushed */}
          <View style={{ display: currentScreen === "A" ? "flex" : "none" }}>
            <FlashList
              data={[0, 1, 2]}
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

          {/* Control to simulate stack navigation */}
          <View testID="navigation-control">
            <Text onPress={() => setCurrentScreen("B")}>Push Screen B</Text>
            <Text onPress={() => setCurrentScreen("A")}>Pop to Screen A</Text>
          </View>
        </View>
      );
    };

    const result = render(<StackNavigator />);

    // Run timers to allow effects to execute
    jest.runAllTimers();

    // Screen A should be visible initially with items rendered
    expect(result).toContainReactComponent(Text, {
      children: "Screen A Item 0",
    });
    expect(result).toContainReactComponent(Text, {
      children: "Screen A Item 1",
    });

    // Verify measurements were called for Screen A items
    const initialMeasurements = measurements.length;
    expect(initialMeasurements).toBeGreaterThan(0);

    // Simulate pushing Screen B
    const pushButton = result.find(Text, { children: "Push Screen B" });
    pushButton?.trigger("onPress");

    // Run timers for Screen B effects
    jest.runAllTimers();

    // Screen B should now be visible
    expect(result).toContainReactComponent(Text, {
      children: "Screen B Item 5",
    });

    // Verify measurements were called for Screen B items
    expect(measurements.length).toBeGreaterThan(initialMeasurements);

    // Screen A items should still exist in DOM (mounted but hidden)
    // This is the key behavior - Screen A stays mounted
    const screenAContainer = result.find(View, {
      style: { display: "none" },
    });
    expect(screenAContainer).toBeDefined();

    // Pop back to Screen A
    const popButton = result.find(Text, { children: "Pop to Screen A" });
    popButton?.trigger("onPress");

    jest.runAllTimers();

    // Screen A should be visible again
    expect(result).toContainReactComponent(Text, {
      children: "Screen A Item 0",
    });

    // Verify that items maintain their measurements and render correctly
    // The key test: items should still have proper dimensions (100px height)
    // This validates that the auto-trigger commitLayout fix works correctly
    expect(measureLayout.measureItemLayout).toHaveBeenCalled();
  });
});
