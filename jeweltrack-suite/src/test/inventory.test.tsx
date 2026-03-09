import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Inventory from '@/pages/Inventory';
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

// Mock URL.createObjectURL for export tests
global.URL.createObjectURL = vi.fn();

describe('Inventory Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({
      id: 'u1',
      store_id: 's1',
      name: 'Rajesh Mehta',
      email: 'rajesh@mehtajewellers.com',
      role: 'owner'
    }));
    queryClient.clear();
  });

  it('should list products and support searching', async () => {
    renderWithProviders(<Inventory />);

    // Wait for products to load
    await screen.findByText('Gold Ring');

    // Search for product
    const searchInput = screen.getByPlaceholderText(/Search by name or SKU/i);
    fireEvent.change(searchInput, { target: { value: 'Gold Ring' } });

    expect(screen.getByText('Gold Ring')).toBeInTheDocument();

    // Search for non-existent product
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });
    expect(screen.queryByText('Gold Ring')).not.toBeInTheDocument();
  });

  it('should add a new product successfully with validation', async () => {
    const createProductSpy = vi.fn();
    server.use(
      http.post('http://localhost:3001/api/products', async ({ request }) => {
        const body = (await request.json()) as any;
        createProductSpy(body);
        return HttpResponse.json({
          success: true,
          product: { id: 'new-p1', ...body }
        });
      })
    );

    renderWithProviders(<Inventory />);

    // Wait for loading to finish
    await screen.findByText('Inventory');

    // Open add dialog
    const addButton = screen.getByRole('button', { name: /Add Item/i });
    fireEvent.click(addButton);

    // Verify dialog is open
    expect(screen.getByText('Add New Product')).toBeInTheDocument();

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Diamond Earring' } });
    fireEvent.change(screen.getByLabelText(/SKU \/ Code/i), { target: { value: 'DE-001' } });
    fireEvent.change(screen.getByLabelText(/Net Weight/i), { target: { value: '2.5' } });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '45000' } });
    fireEvent.change(screen.getByLabelText(/Stock Quantity/i), { target: { value: '5' } });

    // Submit
    const submitButton = screen.getByText('Add Product');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Product added/i)).toBeInTheDocument();
      expect(createProductSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Diamond Earring',
        sku: 'DE-001',
        selling_price: 45000,
        quantity: 5
      }));
    });
  });

  it('should export inventory to CSV', async () => {
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    
    renderWithProviders(<Inventory />);

    await screen.findByText('Gold Ring');

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(linkClickSpy).toHaveBeenCalled();
  });

  it('should handle backend errors when adding product', async () => {
    server.use(
      http.post('http://localhost:3001/api/products', () => {
        return HttpResponse.json(
          { success: false, message: 'SKU already exists' },
          { status: 400 }
        );
      })
    );

    renderWithProviders(<Inventory />);

    await screen.findByText('Inventory');

    fireEvent.click(screen.getByRole('button', { name: /Add Item/i }));
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Error Product' } });
    fireEvent.change(screen.getByLabelText(/SKU \/ Code/i), { target: { value: 'ERR-001' } });
    fireEvent.change(screen.getByLabelText(/Net Weight/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Stock Quantity/i), { target: { value: '1' } });

    fireEvent.click(screen.getByText('Add Product'));

    await waitFor(() => {
      expect(screen.getByText(/SKU already exists/i)).toBeInTheDocument();
    });
  });
});
