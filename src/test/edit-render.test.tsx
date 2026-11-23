import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StudyCircleManagement from "@/pages/admin/StudyCircleManagement";
import React from "react";

describe("StudyCircleManagement Edit button", () => {
  it("renders editor without throwing when Edit button is clicked", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <StudyCircleManagement />
      </QueryClientProvider>
    );

    // Wait for sessions to load
    await waitFor(() => {
      const editButtons = screen.getAllByRole("button", { name: /Edit/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    // Check if editor appears
    await waitFor(() => {
      expect(screen.getByText("Session Settings & Timing")).toBeInTheDocument();
    });
  });
});
