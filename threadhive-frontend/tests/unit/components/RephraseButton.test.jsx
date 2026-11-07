import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../mocks/server';
import RephraseButton from '../../../src/components/Shared/RephraseButton';

function Harness({ initial = 'rough text', type = 'comment', onAccept }) {
  const [text, setText] = useState(initial);
  return (
    <div>
      <input aria-label="field" value={text} onChange={(e) => setText(e.target.value)} />
      <RephraseButton
        text={text}
        type={type}
        onAccept={(t) => {
          onAccept?.(t);
          setText(t);
        }}
      />
    </div>
  );
}

describe('RephraseButton', () => {
  it('is disabled for blank text', () => {
    render(<Harness initial="  " />);
    expect(screen.getByRole('button', { name: /rephrase/i })).toBeDisabled();
  });

  it('shows loading, then a proposal without replacing the original', async () => {
    server.use(
      http.post('*/ai/rephrase', async () => {
        await delay(50);
        return HttpResponse.json({ data: { text: 'Polished text.' } });
      }),
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /rephrase/i }));
    expect(screen.getByRole('button', { name: /rephrase/i })).toBeDisabled();
    expect(screen.getByText(/rephrasing/i)).toBeInTheDocument();

    expect(await screen.findByText('Polished text.')).toBeInTheDocument();
    expect(screen.getByLabelText('field')).toHaveValue('rough text');
  });

  it('accept replaces the text', async () => {
    server.use(
      http.post('*/ai/rephrase', () => HttpResponse.json({ data: { text: 'Polished text.' } })),
    );
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<Harness onAccept={onAccept} />);
    await user.click(screen.getByRole('button', { name: /rephrase/i }));
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(onAccept).toHaveBeenCalledWith('Polished text.');
    expect(screen.getByLabelText('field')).toHaveValue('Polished text.');
    expect(screen.queryByText('Suggested rewrite')).not.toBeInTheDocument();
  });

  it('reject keeps the original text', async () => {
    server.use(
      http.post('*/ai/rephrase', () => HttpResponse.json({ data: { text: 'Polished text.' } })),
    );
    const onAccept = vi.fn();
    const user = userEvent.setup();
    render(<Harness onAccept={onAccept} />);
    await user.click(screen.getByRole('button', { name: /rephrase/i }));
    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByLabelText('field')).toHaveValue('rough text');
    expect(screen.queryByText('Polished text.')).not.toBeInTheDocument();
  });

  it('on failure keeps original text, shows an error, and can retry', async () => {
    server.use(
      http.post('*/ai/rephrase', () =>
        HttpResponse.json({ message: 'Failed to rephrase text' }, { status: 502 }),
      ),
    );
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /rephrase/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to rephrase text');
    expect(screen.getByLabelText('field')).toHaveValue('rough text');

    server.resetHandlers();
    server.use(http.post('*/ai/rephrase', () => HttpResponse.json({ data: { text: 'Retry ok.' } })));
    const btn = screen.getByRole('button', { name: /rephrase/i });
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(await screen.findByText('Retry ok.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('discards a proposal when the user edits the text', async () => {
    server.use(
      http.post('*/ai/rephrase', () => HttpResponse.json({ data: { text: 'Polished text.' } })),
    );
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /rephrase/i }));
    await screen.findByText('Polished text.');
    await user.type(screen.getByLabelText('field'), '!');
    await waitFor(() => expect(screen.queryByText('Polished text.')).not.toBeInTheDocument());
  });
});
