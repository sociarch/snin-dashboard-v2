import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '@/components/dashboard';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock d3
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      remove: jest.fn()
    })),
    append: jest.fn(() => ({
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis()
    }))
  })),
  arc: jest.fn(() => ({
    innerRadius: jest.fn().mockReturnThis(),
    outerRadius: jest.fn().mockReturnThis()
  })),
  pie: jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    value: jest.fn().mockReturnThis(),
    startAngle: jest.fn().mockReturnThis(),
    endAngle: jest.fn().mockReturnThis()
  }))
}));

// Mock fetchPollData with a delay to simulate async behavior
jest.mock('@/components/fetchPollData', () => ({
  fetchPollData: jest.fn().mockImplementation(() => 
    Promise.resolve([{
      post_id: '1',
      caption: 'Test Question',
      option1: 'Option 1',
      option2: 'Option 2',
      resp_option1: '10',
      resp_option2: '20',
      pct_option1: '0.33',
      pct_option2: '0.67',
      sponsor_id: 'test_group'
    }])
  )
}));

// Mock BotpressEmbed component
jest.mock('@/components/BotpressEmbed', () => ({
  BotpressEmbed: () => null
}));

// Add this helper function at the top of the test file
const findTableCell = (text: string) => {
  return screen.getByRole('cell', { name: text });
};

const findChartTitle = (text: string) => {
  return screen.getByRole('heading', { 
    name: text,
    level: 2 
  });
};

describe('Dashboard Component', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn()
  };

  const mockAuthContext: AuthContextType = {
    signOut: jest.fn().mockImplementation(() => Promise.resolve()),
    remainingQuestions: 5,
    userAttributes: {
      email: 'test@example.com',
      'custom:zipnum': '12345',
      'custom:qs_remain': '5',
      sub: 'test-sub'
    },
    userGroups: ['test_group'],
    isAuthenticated: true,
    user: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    resendConfirmationCode: jest.fn(),
    forgotPassword: jest.fn(),
    forgotPasswordSubmit: jest.fn(),
    updateUserAttributes: jest.fn(),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock axios response for user groups
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        response: ['test_group']
      }
    });
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
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles search functionality', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    }, { timeout: 3000 });

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });
  });

  it('handles row click and shows chart', async () => {
    renderDashboard();
    
    await waitFor(() => {
      const row = findTableCell('Test Question');
      expect(row).toBeInTheDocument();
      fireEvent.click(row);

      const chartTitle = findChartTitle('Test Question');
      expect(chartTitle).toBeInTheDocument();

      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
      expect(screen.getByText(/Most people prefer/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles sign out', async () => {
    renderDashboard();
    const signOutButton = screen.getByTitle('Sign Out');
    fireEvent.click(signOutButton);
    await waitFor(() => {
      expect(mockAuthContext.signOut).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
}); 