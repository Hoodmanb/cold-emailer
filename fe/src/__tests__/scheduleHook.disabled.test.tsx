// fe/src/__tests__/scheduleHook.disabled.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axiosInstance from "@/hooks/axios";
import { useGetSchedule } from "@/hooks/queryHooks/schedule";

// Mock axios to ensure no network calls
vi.mock("@/hooks/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useGetSchedule when QStash disabled", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_SCHEDULER_ENABLED: "false" };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns empty schedule without calling API", async () => {
    const { result } = renderHook(() => useGetSchedule());
    // Initial state
    expect(result.current.schedule).toBeUndefined();
    // Wait for the effect to run and schedule to be set
    await waitFor(() => {
      expect(result.current.schedule).toEqual([]);
    });
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });
});
