import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Register from '@/pages/Register';
import { server } from './server';
import { http, HttpResponse } from 'msw';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {ui}
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Registration Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
  });

  it('should successfully register a new store and redirect to dashboard', async () => {
    server.use(
      http.post('http://localhost:3001/api/register', async ({ request }) => {
        const { storeName, userName, email } = (await request.json()) as any;
        return HttpResponse.json({
          success: true,
          user: {
            id: 'new-user-id',
            store_id: 'new-store-id',
            name: userName,
            email: email,
            role: 'owner'
          }
        });
      })
    );

    renderWithProviders(<Register />);

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Store Name/i), { target: { value: 'Test Store' } });
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Register Store/i }));

    // Verify loading state
    expect(screen.getByText(/Creating Store\.\.\./i)).toBeInTheDocument();

    // Verify success toast and redirection
    await waitFor(() => {
      expect(screen.getByText(/Welcome to JewelTrack!/i)).toBeInTheDocument();
      expect(window.location.pathname).toBe('/dashboard');
    }, { timeout: 5000 });

    // Verify localStorage persistence
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    expect(savedUser.email).toBe('john@example.com');
    expect(savedUser.store_id).toBe('new-store-id');
  });

  it('should show error message when registration fails (duplicate email)', async () => {
    server.use(
      http.post('http://localhost:3001/api/register', () => {
        return HttpResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        );
      })
    );

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText(/Store Name/i), { target: { value: 'Duplicate Store' } });
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Duplicate User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'duplicate@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Register Store/i }));

    await waitFor(() => {
      const errorTitles = screen.getAllByText(/Registration failed/i);
      expect(errorTitles.length).toBeGreaterThan(0);
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  it('should show generic error message when server returns 500', async () => {
    server.use(
      http.post('http://localhost:3001/api/register', () => {
        return HttpResponse.json(
          { success: false, message: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    renderWithProviders(<Register />);

    fireEvent.change(screen.getByLabelText(/Store Name/i), { target: { value: 'Error Store' } });
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Error User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'error@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Register Store/i }));

    await waitFor(() => {
      const errorTitles = screen.getAllByText(/Registration failed/i);
      expect(errorTitles.length).toBeGreaterThan(0);
      expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    renderWithProviders(<Register />);

    const submitButton = screen.getByRole('button', { name: /Register Store/i });
    
    // Attempt to submit empty form
    fireEvent.click(submitButton);

    // HTML5 validation doesn't prevent form submission in JSDOM, 
    // but the inputs should have 'required' attribute.
    expect(screen.getByLabelText(/Store Name/i)).toBeRequired();
    expect(screen.getByLabelText(/Full Name/i)).toBeRequired();
    expect(screen.getByLabelText(/Email Address/i)).toBeRequired();
    expect(screen.getByLabelText(/Password/i)).toBeRequired();
  });

  it('should validate email format', async () => {
    renderWithProviders(<Register />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
