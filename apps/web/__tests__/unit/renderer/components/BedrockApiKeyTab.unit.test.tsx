import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockApiKeyTab } from '@/components/settings/providers/BedrockApiKeyTab';

describe('BedrockApiKeyTab', () => {
  const defaultProps = {
    apiKey: '',
    region: 'us-east-1',
    onApiKeyChange: vi.fn(),
    onRegionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render API key input field', () => {
      render(<BedrockApiKeyTab {...defaultProps} />);

      const input = screen.getByTestId('bedrock-api-key-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render API key label', () => {
      render(<BedrockApiKeyTab {...defaultProps} />);

      expect(screen.getByText('API Key')).toBeInTheDocument();
    });

    it('should render "How to get it?" help link', () => {
      render(<BedrockApiKeyTab {...defaultProps} />);

      const helpLink = screen.getByText('How to get it?');
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute(
        'href',
        'https://console.aws.amazon.com/bedrock/home#/api-keys',
      );
      expect(helpLink).toHaveAttribute('target', '_blank');
    });

    it('should render region selector', () => {
      render(<BedrockApiKeyTab {...defaultProps} />);

      const regionSelect = screen.getByTestId('bedrock-region-select');
      expect(regionSelect).toBeInTheDocument();
    });

    it('should display the provided API key value', () => {
      const props = { ...defaultProps, apiKey: 'test-api-key-123' };

      render(<BedrockApiKeyTab {...props} />);

      const input = screen.getByTestId('bedrock-api-key-input');
      expect(input).toHaveValue('test-api-key-123');
    });

    it('should display the provided region value', () => {
      const props = { ...defaultProps, region: 'eu-west-1' };

      render(<BedrockApiKeyTab {...props} />);

      const regionSelect = screen.getByTestId('bedrock-region-select');
      expect(regionSelect).toHaveTextContent('eu-west-1');
    });
  });

  describe('interactions', () => {
    it('should call onApiKeyChange when API key input changes', () => {
      const onApiKeyChange = vi.fn();
      render(<BedrockApiKeyTab {...defaultProps} onApiKeyChange={onApiKeyChange} />);

      const input = screen.getByTestId('bedrock-api-key-input');
      fireEvent.change(input, { target: { value: 'new-api-key' } });

      expect(onApiKeyChange).toHaveBeenCalledWith('new-api-key');
    });

    it('should call onRegionChange when region selector changes', () => {
      const onRegionChange = vi.fn();
      render(<BedrockApiKeyTab {...defaultProps} onRegionChange={onRegionChange} />);

      const regionSelect = screen.getByTestId('bedrock-region-select');
      fireEvent.click(regionSelect);
      const option = screen.getByTestId('bedrock-region-select-option-ap-northeast-1');
      fireEvent.click(option);

      expect(onRegionChange).toHaveBeenCalledWith('ap-northeast-1');
    });

    it('should show clear button when API key has value', () => {
      const props = { ...defaultProps, apiKey: 'test-key' };

      render(<BedrockApiKeyTab {...props} />);

      const clearButton = screen.getByTestId('bedrock-api-key-clear');
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when API key is empty', () => {
      render(<BedrockApiKeyTab {...defaultProps} />);

      const clearButton = screen.queryByTestId('bedrock-api-key-clear');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should call onApiKeyChange with empty string when clear button clicked', () => {
      const onApiKeyChange = vi.fn();
      const props = { ...defaultProps, apiKey: 'test-key', onApiKeyChange };
      render(<BedrockApiKeyTab {...props} />);

      const clearButton = screen.getByTestId('bedrock-api-key-clear');
      fireEvent.click(clearButton);

      expect(onApiKeyChange).toHaveBeenCalledWith('');
    });
  });

  describe('placeholder', () => {
    it('should have correct placeholder text', () => {
      render(<BedrockApiKeyTab {...defaultProps} />);

      const input = screen.getByTestId('bedrock-api-key-input');
      expect(input).toHaveAttribute('placeholder', 'Enter Bedrock API key');
    });
  });
});
