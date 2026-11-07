import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CreateThreadForm from "../../../src/components/Forms/CreateThreadForm";
import threadReducer from "../../../src/reducers/threadListSlice";
import subredditReducer from "../../../src/reducers/subredditSlice";
import * as subredditService from "../../../src/services/subredditService";

// Mock subreddit service
vi.mock("../../../src/services/subredditService");

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

const createMockStore = () => {
  return configureStore({
    reducer: {
      threads: threadReducer,
      subreddits: subredditReducer,
    },
  });
};

const renderWithProviders = (onClose = vi.fn()) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <CreateThreadForm onClose={onClose} />
    </Provider>,
  );
};

describe("CreateThreadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue("user-123");
    subredditService.fetchSubreddits.mockResolvedValue([
      { _id: "1", name: "JavaScript", description: "JS community" },
      { _id: "2", name: "Python", description: "Python community" },
    ]);
    global.alert = vi.fn();
  });

  it("should render form title", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Create New Thread/)).toBeInTheDocument();
    });
  });

  it("should render form fields", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/What's on your mind?/),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText(/Share your thoughts/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Select a community/)).toBeInTheDocument();
  });

  it("should render Post Thread and Cancel buttons", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Post Thread/)).toBeInTheDocument();
    });
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should load and display subreddits", async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("r/JavaScript")).toBeInTheDocument();
    });

    expect(screen.getByText("r/Python")).toBeInTheDocument();
  });

  it("should allow typing in title field", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const titleInput = screen.getByPlaceholderText(/What's on your mind?/);
    await user.type(titleInput, "My New Thread");

    expect(titleInput).toHaveValue("My New Thread");
  });

  it("should allow typing in content field", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const contentInput = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(contentInput, "This is my thread content");

    expect(contentInput).toHaveValue("This is my thread content");
  });

  it("should allow selecting a subreddit", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("r/JavaScript")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "1");

    expect(select).toHaveValue("1");
  });

  it("should call onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    renderWithProviders(mockOnClose);

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should disable subreddit select when new subreddit name is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("r/JavaScript")).toBeInTheDocument();
    });

    const newSubredditInput =
      screen.getByPlaceholderText(/Enter community name/);
    await user.type(newSubredditInput, "NewSubreddit");

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });

  it("should show description field when new subreddit name is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const newSubredditInput =
      screen.getByPlaceholderText(/Enter community name/);
    await user.type(newSubredditInput, "NewSubreddit");

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Describe your community/),
      ).toBeInTheDocument();
    });
  });

  it("should clear new subreddit fields when existing subreddit is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("r/JavaScript")).toBeInTheDocument();
    });

    // First enter new subreddit name
    const newSubredditInput =
      screen.getByPlaceholderText(/Enter community name/);
    await user.type(newSubredditInput, "NewSubreddit");

    // The dropdown should now be disabled since new subreddit name is filled
    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();

    // Clear the new subreddit name to re-enable dropdown
    await user.clear(newSubredditInput);
    expect(select).not.toBeDisabled();

    // Now select existing subreddit
    await user.selectOptions(select, "1");

    // New subreddit input should remain empty and be disabled
    await waitFor(() => {
      expect(newSubredditInput).toHaveValue("");
      expect(newSubredditInput).toBeDisabled();
    });
  });

  it('should show "No communities found" when subreddit fetch fails', async () => {
    subredditService.fetchSubreddits.mockRejectedValue(
      new Error("Failed to fetch"),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("No communities found.")).toBeInTheDocument();
    });
  });

  it("should show alert when submitting without selecting subreddit", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("r/JavaScript")).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/What's on your mind?/);
    const contentInput = screen.getByPlaceholderText(/Share your thoughts/);

    await user.type(titleInput, "Title");
    await user.type(contentInput, "Content");

    const submitButton = screen.getByText(/Post Thread/);
    await user.click(submitButton);

    expect(global.alert).toHaveBeenCalledWith(
      "Please select or create a subreddit before posting.",
    );
  });

  it("should show alert when creating new subreddit without description", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/What's on your mind?/),
      ).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(/What's on your mind?/);
    const contentInput = screen.getByPlaceholderText(/Share your thoughts/);
    const newSubredditInput =
      screen.getByPlaceholderText(/Enter community name/);

    await user.type(titleInput, "Title");
    await user.type(contentInput, "Content");
    await user.type(newSubredditInput, "NewSub");

    // Use fireEvent.submit to bypass HTML5 required validation on the description textarea
    const form = screen.getByText(/Post Thread/).closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Please provide a description for the new subreddit.",
      );
    });
  });

  it('should render "Or Create New Community" section', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Or Create New Community/)).toBeInTheDocument();
    });
  });
});
