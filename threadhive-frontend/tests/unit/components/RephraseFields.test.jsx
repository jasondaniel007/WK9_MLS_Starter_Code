import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../mocks/server';
import CreateThreadForm from '../../../src/components/Forms/CreateThreadForm';
import CommentForm from '../../../src/components/Comment/CommentForm';
import threadReducer from '../../../src/reducers/threadListSlice';
import subredditReducer from '../../../src/reducers/subredditSlice';
import * as subredditService from '../../../src/services/subredditService';

vi.mock('../../../src/services/subredditService');

describe('Rephrase in CreateThreadForm', () => {
  beforeEach(() => {
    subredditService.fetchSubreddits?.mockResolvedValue?.([]);
  });

  const renderForm = () => {
    const store = configureStore({
      reducer: { threads: threadReducer, subreddits: subredditReducer },
    });
    render(
      <Provider store={store}>
        <CreateThreadForm onClose={vi.fn()} />
      </Provider>,
    );
  };

  it('rephrases title and body independently, replacing only on accept', async () => {
    server.use(
      http.post('*/ai/rephrase', async ({ request }) => {
        const { text, type } = await request.json();
        if (type === 'body') await delay(200);
        return HttpResponse.json({ data: { text: `${type.toUpperCase()}: ${text}` } });
      }),
    );
    const user = userEvent.setup();
    renderForm();
    const title = screen.getByPlaceholderText(/What's on your mind/);
    const body = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(title, 'my title');
    await user.type(body, 'my body');

    fireEvent.click(screen.getByRole('button', { name: /rephrase body with ai/i }));
    // Only the body button is loading; title button stays usable.
    expect(screen.getByRole('button', { name: /rephrase body with ai/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rephrase title with ai/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /rephrase title with ai/i }));
    const titleProposal = await screen.findByTestId('rephrase-proposal-title');
    expect(titleProposal).toHaveTextContent('TITLE: my title');
    expect(title).toHaveValue('my title');

    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(title).toHaveValue('TITLE: my title');
    expect(body).toHaveValue('my body');

    expect(await screen.findByTestId('rephrase-proposal-body')).toHaveTextContent('BODY: my body');
  });

  it('keeps text intact when the AI call fails', async () => {
    server.use(http.post('*/ai/rephrase', () => HttpResponse.json({ message: 'nope' }, { status: 502 })));
    const user = userEvent.setup();
    renderForm();
    const title = screen.getByPlaceholderText(/What's on your mind/);
    await user.type(title, 'my title');
    await user.click(screen.getByRole('button', { name: /rephrase title with ai/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('nope');
    expect(title).toHaveValue('my title');
  });
});

describe('Rephrase in CommentForm', () => {
  function Harness() {
    const [text, setText] = useState('');
    return (
      <CommentForm
        commentText={text}
        onCommentChange={(e) => setText(e.target.value)}
        onTextReplace={setText}
        onPostComment={() => {}}
        disabled={!text.trim()}
      />
    );
  }

  it('replaces comment text only after accept', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const box = screen.getByPlaceholderText(/Write a comment/);
    await user.type(box, 'hey');
    await user.click(screen.getByRole('button', { name: /rephrase comment with ai/i }));
    await screen.findByText('Rephrased: hey');
    expect(box).toHaveValue('hey');
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(box).toHaveValue('Rephrased: hey'));
  });

  it('does not render the button when onTextReplace is not provided', () => {
    render(<CommentForm commentText="x" onCommentChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /rephrase/i })).not.toBeInTheDocument();
  });
});
