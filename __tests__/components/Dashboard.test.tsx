import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/components/dashboard';
import { AuthContext } from '@/contexts/AuthContext';
import { fetchPollData } from '@/components/fetchPollData';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('@/components/fetchPollData', () => ({
  fetchPollData: jest.fn(),
}));

jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      remove: jest.fn(),
    })),
    append: jest.fn(() => ({
      attr: jest.fn(() => ({
        style: jest.fn(() => ({
          append: jest.fn(),
        })),
      })),
    })),
  })),
  arc: jest.fn(() => ({
    innerRadius: jest.fn(() => ({
      outerRadius: jest.fn(),
    })),
  })),
  pie: jest.fn(() => ({
    sort: jest.fn(() => ({
      value: jest.fn(() => ({
        startAngle: jest.fn(() => ({
          endAngle: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Mock data
const mockPollData = [
  {
    post_id: '1',
    caption: 'Test Question 1',
    option1: 'Yes',
    option2: 'No',
    resp_option1: '60',
    resp_option2: '40',
    pct_option1: '0.6',
    pct_option2: '0.4',
    sponsor_id: 'test_sponsor',
  },
];

// Mock AuthContext value
const mockAuthContext = {
  signOut: jest.fn(),
  remainingQuestions: 5,
  userAttributes: {
    email: 'test@example.com',
    'custom:zipnum': '12345',
    'custom:qs_remain': '5',
  },
  userGroups: ['test_sponsor'],
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPollData as jest.Mock).mockResolvedValue(mockPollData);
  });

  const renderDashboard = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <Dashboard />
      </AuthContext.Provider>
    );
  };

  it('renders the dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Snap')).toBeInTheDocument();
    expect(screen.getByText('Input')).toBeInTheDocument();
  });

  it('loads and displays poll data', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search...');
    await userEvent.type(searchInput, 'Question 1');

    expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    
    await userEvent.type(searchInput, 'NonexistentQuestion');
    expect(screen.queryByText('Test Question 1')).not.toBeInTheDocument();
  });

  it('handles row click and shows chart', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    });

    const row = screen.getByText('Test Question 1').closest('tr');
    if (row) {
      fireEvent.click(row);
    }

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });

  it('handles sign out', async () => {
    renderDashboard();
    const signOutButton = screen.getByTitle('Sign Out');
    fireEvent.click(signOutButton);
    expect(mockAuthContext.signOut).toHaveBeenCalled();
  });
}); 