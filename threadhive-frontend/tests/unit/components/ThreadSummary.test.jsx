import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import currentThreadReducer from '../../../src/reducers/currentThreadSlice';
import ThreadSummary from '../../../src/components/Summary/ThreadSummary';

const setup = () => {
  const store = configureStore({ reducer: { currentThread: currentThreadReducer } });
  render(
    <Provider store={store}>
      <ThreadSummary threadId="t1" />
    </Provider>,
  );
};

describe('ThreadSummary', () => {
  it('shows loading state then the summary', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /summarize/i }));
    expect(screen.getByRole('button', { name: /summarizing/i })).toBeDisabled();
    expect(await screen.findByText('Mock AI summary.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /re-summarize/i })).toBeEnabled();
  });

  it('shows an error and recovers so the user can retry', async () => {
    server.use(
      http.post('http://localhost:3000/api/threads/:id/summarize', () =>
        HttpResponse.json({ message: 'Failed to generate summary' }, { status: 502 }),
      ),
    );
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /summarize/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to generate summary');
    const btn = screen.getByRole('button', { name: /summarize/i });
    expect(btn).toBeEnabled();

    server.resetHandlers();
    await user.click(btn);
    await waitFor(() => expect(screen.getByText('Mock AI summary.')).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
