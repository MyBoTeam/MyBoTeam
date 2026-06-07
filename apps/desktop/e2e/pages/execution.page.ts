import type { Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../config';

export class ExecutionPage {
  constructor(private page: Page) {}

  get statusBadge() {
    return this.page.getByTestId('execution-status-badge');
  }

  get cancelButton() {
    return this.page.getByTestId('execution-cancel-button');
  }

  get thinkingIndicator() {
    return this.page.getByTestId('execution-thinking-indicator');
  }

  get followUpInput() {
    return this.page.getByTestId('execution-follow-up-input');
  }

  get stopButton() {
    return this.page.getByTestId('execution-stop-button');
  }

  get permissionCard() {
    return this.page.getByTestId('execution-permission-card');
  }

  get allowButton() {
    return this.page.getByTestId('permission-allow-button');
  }

  get denyButton() {
    return this.page.getByTestId('permission-deny-button');
  }

  get questionOptions() {
    return this.permissionCard.locator('button').filter({ hasText: /Option|Other/ });
  }

  get customResponseInput() {
    return this.page.getByPlaceholder('Enter a different option...');
  }

  get messagesScrollContainer() {
    return this.page.getByTestId('messages-scroll-container');
  }

  get scrollToBottomButton() {
    return this.page.getByTestId('scroll-to-bottom-button');
  }

  get copyButtons() {
    return this.page.getByTestId('message-copy-button');
  }

  get codeBlockCopyButtons() {
    return this.page.getByTestId('code-block-copy-button');
  }

  get favoriteToggle() {
    return this.page.getByTestId('favorite-toggle');
  }

  get startNewTaskButton() {
    return this.page.getByTestId('start-new-task');
  }

  async selectQuestionOption(index: number) {
    await this.questionOptions.nth(index).click();
  }

  async waitForComplete(timeout: number = TEST_TIMEOUTS.TASK_COMPLETE_WAIT) {
    await this.page.waitForFunction(
      () => {
        const badge = document.querySelector('[data-testid="execution-status-badge"]');
        if (!badge) return false;
        const text = badge.textContent?.toLowerCase() || '';
        return (
          text.includes('completed') ||
          text.includes('failed') ||
          text.includes('stopped') ||
          text.includes('cancelled')
        );
      },
      null,
      { timeout },
    );
  }
}
