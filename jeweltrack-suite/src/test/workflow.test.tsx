import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Workflow Integration Test', () => {
  it('completes full login and dashboard navigation workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Verify we are on the login page
    expect(screen.getAllByText(/JewelTrack/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();

    // 2. Perform Login
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'rajesh@mehtajewellers.com');
    await user.type(passwordInput, 'anypassword'); // password check is mocked
    await user.click(submitBtn);

    // 3. Verify Dashboard Access
    await waitFor(() => {
      const dashboardHeadings = screen.getAllByText(/Dashboard/i);
      expect(dashboardHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText(/Welcome back, Rajesh/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // 4. Verify Stat Cards
    await waitFor(() => {
      expect(screen.getByText(/Today's Sales/i)).toBeInTheDocument();
      const pendingRepairsElements = screen.getAllByText(/Pending Repairs/i);
      expect(pendingRepairsElements.length).toBeGreaterThan(0);
      
      // Look for values that represent data was fetched (even if derived from list)
      const countElements = screen.getAllByText('1');
      expect(countElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    // 5. Navigate to Inventory
    const inventorySidebarLink = screen.getByRole('link', { name: /Inventory/i });
    await user.click(inventorySidebarLink);

    await waitFor(() => {
      // Check for the heading in the main content area
      const inventoryHeading = screen.getByRole('heading', { name: /Inventory/i, level: 1 });
      expect(inventoryHeading).toBeInTheDocument();
      // Prove data was fetched by checking for MSW mock product
      expect(screen.getByText(/Gold Ring/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // 6. Navigate to Repairs
    const repairsSidebarLink = screen.getByRole('link', { name: /Repairs/i });
    await user.click(repairsSidebarLink);

    await waitFor(() => {
      const repairsHeading = screen.getByRole('heading', { name: /Repairs/i, level: 1 });
      expect(repairsHeading).toBeInTheDocument();
      expect(screen.getByText(/REP-001/i)).toBeInTheDocument();
      expect(screen.getByText(/Anita Desai/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // 7. Logout
    const profileBtn = screen.getByText(/Rajesh Mehta/i);
    await user.click(profileBtn);

    const logoutBtn = screen.getByText(/Logout/i);
    await user.click(logoutBtn);

    // 8. Verify we are back on login page
    await waitFor(() => {
      expect(screen.getAllByText(/JewelTrack/i)[0]).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
  }, 15000); // Increase test timeout

  it('shows error on invalid login', async () => {
    const user = userEvent.setup();
    render(<App />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'wrong@email.com');
    await user.type(passwordInput, 'wrong');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
